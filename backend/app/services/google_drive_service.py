import io
import re
import threading
from functools import lru_cache
from dataclasses import dataclass

import httplib2
import httpx
import google_auth_httplib2
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

from app.core.config import get_settings

SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

# httplib2 sem timeout fica pendurado pra sempre numa conexão travada/lenta do
# Google — e como isso acontece dentro do lock abaixo, uma única chamada presa
# derruba o endpoint de imagens inteiro (todo mundo espera um lock que nunca é
# liberado). Timeout aqui garante que a chamada sempre falha em vez de travar.
_HTTP_TIMEOUT_SECONDS = 30

# O client do Drive (_get_client) é cacheado e reusado entre threads, mas o
# transporte HTTP por baixo (httplib2) não é thread-safe: duas chamadas
# concorrentes usando o mesmo client corrompem uma a outra (erros aleatórios
# em ~1s, mesmo com poucas requisições ao mesmo tempo). Esse lock serializa
# toda chamada à API do Drive (list e download) — sem isso, qualquer rajada de
# 2+ requisições simultâneas falha de forma intermitente.
_DRIVE_API_LOCK = threading.Lock()
_LOCK_WAIT_TIMEOUT_SECONDS = 45


@dataclass
class DriveFile:
    id: str
    name: str
    md5_checksum: str


@lru_cache
def _get_client():
    import json
    settings = get_settings()
    file_path = settings.google_service_account_file
        
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            info = json.load(f)
        
        if "private_key" in info and isinstance(info["private_key"], str):
            pk = info["private_key"]
            if "\\n" in pk:
                info["private_key"] = pk.replace("\\n", "\n")
            info["private_key"] = info["private_key"].strip().strip('"').strip("'")
            
        credentials = service_account.Credentials.from_service_account_info(
            info, scopes=SCOPES
        )
    except Exception:
        # Fallback para o método padrão caso falte o arquivo ou ocorra algum erro na leitura manual
        credentials = service_account.Credentials.from_service_account_file(
            file_path, scopes=SCOPES
        )

    authorized_http = google_auth_httplib2.AuthorizedHttp(
        credentials, http=httplib2.Http(timeout=_HTTP_TIMEOUT_SECONDS)
    )
    return build("drive", "v3", http=authorized_http, cache_discovery=False)


def debug_list_folder_raw(folder_id: str) -> list[dict]:
    """Lista TUDO dentro da pasta (sem filtro de mimeType/checksum) — usado só
    pra diagnosticar se tem subpastas ou arquivos sem md5Checksum sendo
    ignorados pela sincronização normal."""
    query = f"'{folder_id}' in parents and trashed=false"

    if not _DRIVE_API_LOCK.acquire(timeout=_LOCK_WAIT_TIMEOUT_SECONDS):
        raise TimeoutError("Drive ocupado processando outra requisição, tente novamente")
    try:
        items: list[dict] = []
        page_token = None
        client = _get_client()
        while True:
            response = (
                client.files()
                .list(
                    q=query,
                    fields="nextPageToken, files(id, name, mimeType, md5Checksum)",
                    pageToken=page_token,
                    pageSize=1000,
                )
                .execute()
            )
            items.extend(response.get("files", []))
            page_token = response.get("nextPageToken")
            if not page_token:
                break
    finally:
        _DRIVE_API_LOCK.release()

    return items


def list_image_files(folder_id: str) -> list[DriveFile]:
    """Lista imagens da pasta, sem duplicar por paginação."""
    query = f"'{folder_id}' in parents and mimeType contains 'image/' and trashed=false"

    if not _DRIVE_API_LOCK.acquire(timeout=_LOCK_WAIT_TIMEOUT_SECONDS):
        raise TimeoutError("Drive ocupado processando outra requisição, tente novamente")
    try:
        files: list[DriveFile] = []
        page_token = None
        client = _get_client()
        while True:
            response = (
                client.files()
                .list(
                    q=query,
                    fields="nextPageToken, files(id, name, md5Checksum, mimeType)",
                    pageToken=page_token,
                    pageSize=1000,
                )
                .execute()
            )
            for f in response.get("files", []):
                if not f.get("md5Checksum"):
                    continue
                files.append(DriveFile(id=f["id"], name=f["name"], md5_checksum=f["md5Checksum"]))

            page_token = response.get("nextPageToken")
            if not page_token:
                break
    finally:
        _DRIVE_API_LOCK.release()

    return files


@lru_cache(maxsize=40)
def download_file(file_id: str) -> bytes:
    """Baixa o arquivo original (qualidade completa). Lento — usado só na hora
    de efetivamente subir a foto pro produto na Nuvemshop, nunca pra preview."""
    if not _DRIVE_API_LOCK.acquire(timeout=_LOCK_WAIT_TIMEOUT_SECONDS):
        raise TimeoutError("Drive ocupado processando outra requisição, tente novamente")
    try:
        client = _get_client()
        request = client.files().get_media(fileId=file_id)
        buffer = io.BytesIO()
        downloader = MediaIoBaseDownload(buffer, request)
        done = False
        while not done:
            _, done = downloader.next_chunk()
        return buffer.getvalue()
    finally:
        _DRIVE_API_LOCK.release()


def _with_thumbnail_size(thumbnail_link: str, size: int) -> str:
    if re.search(r"=s\d+", thumbnail_link):
        return re.sub(r"=s\d+", f"=s{size}", thumbnail_link)
    return f"{thumbnail_link}=s{size}"


@lru_cache(maxsize=200)
def get_preview_bytes(file_id: str, size: int = 1024) -> tuple[bytes, str]:
    """Preview rápido pra exibir na tela: usa a miniatura já gerada pelo Drive
    (pequena, servida pelo CDN do Google) em vez de baixar o arquivo original
    inteiro. Só busca o link no nosso client (protegido pelo lock, chamada
    rápida de metadado) — o download da miniatura em si roda fora do lock,
    direto no CDN do Google, então não trava outras requisições.

    Retorna (bytes, origem) — "thumbnail" ou "original-fallback" — pra dar pra
    diagnosticar de fora (ex: header de resposta) qual caminho foi usado.
    """
    if not _DRIVE_API_LOCK.acquire(timeout=_LOCK_WAIT_TIMEOUT_SECONDS):
        raise TimeoutError("Drive ocupado processando outra requisição, tente novamente")
    try:
        client = _get_client()
        metadata = client.files().get(fileId=file_id, fields="thumbnailLink").execute()
    finally:
        _DRIVE_API_LOCK.release()

    thumbnail_link = metadata.get("thumbnailLink")
    if not thumbnail_link:
        # arquivo sem miniatura gerada ainda (raro) — cai pro download completo
        return download_file(file_id), "original-fallback-no-link"

    response = httpx.get(_with_thumbnail_size(thumbnail_link, size), timeout=15)
    if response.status_code != 200:
        return download_file(file_id), f"original-fallback-http-{response.status_code}"
    return response.content, "thumbnail"
