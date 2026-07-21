import io
import threading
from functools import lru_cache
from dataclasses import dataclass

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

from app.core.config import get_settings

SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]

# O client do Drive (_get_client) é cacheado e reusado entre threads, mas o
# transporte HTTP por baixo (httplib2) não é thread-safe: duas chamadas
# concorrentes usando o mesmo client corrompem uma a outra (erros aleatórios
# em ~1s, mesmo com poucas requisições ao mesmo tempo). Esse lock serializa
# toda chamada à API do Drive (list e download) — sem isso, qualquer rajada de
# 2+ requisições simultâneas falha de forma intermitente.
_DRIVE_API_LOCK = threading.Lock()


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
        
    return build("drive", "v3", credentials=credentials, cache_discovery=False)


def list_image_files(folder_id: str) -> list[DriveFile]:
    """Lista imagens da pasta, sem duplicar por paginação."""
    query = f"'{folder_id}' in parents and mimeType contains 'image/' and trashed=false"

    files: list[DriveFile] = []
    page_token = None
    with _DRIVE_API_LOCK:
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

    return files


@lru_cache(maxsize=40)
def download_file(file_id: str) -> bytes:
    with _DRIVE_API_LOCK:
        client = _get_client()
        request = client.files().get_media(fileId=file_id)
        buffer = io.BytesIO()
        downloader = MediaIoBaseDownload(buffer, request)
        done = False
        while not done:
            _, done = downloader.next_chunk()
        return buffer.getvalue()
