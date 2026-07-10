import io
from dataclasses import dataclass
from functools import lru_cache

from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload

from app.core.config import get_settings

SCOPES = ["https://www.googleapis.com/auth/drive.readonly"]


@dataclass
class DriveFile:
    id: str
    name: str
    md5_checksum: str


@lru_cache
def _get_client():
    import json
    import hashlib
    import os
    settings = get_settings()
    
    file_path = settings.google_service_account_file
    print(f"INFO-DEBUG: Carregando arquivo de credenciais de: {file_path}")
    
    if os.path.exists(file_path):
        try:
            with open(file_path, "rb") as f:
                content = f.read()
            size = len(content)
            md5_hash = hashlib.md5(content).hexdigest().upper()
            print(f"INFO-DEBUG: Tamanho do arquivo: {size} bytes | MD5: {md5_hash}")
        except Exception as e:
            print(f"INFO-DEBUG: Erro ao calcular hash do arquivo: {e}")
    else:
        print("INFO-DEBUG: Arquivo de credenciais NAO existe no caminho configurado!")
        
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            info = json.load(f)
        
        print(f"INFO-DEBUG: Chaves encontradas no JSON: {list(info.keys())}")
        
        if "private_key" in info and isinstance(info["private_key"], str):
            pk = info["private_key"]
            pk_len = len(pk)
            # Imprime os primeiros 30 e últimos 30 caracteres da chave privada com segurança (são apenas cabeçalhos)
            pk_start = pk[:30].replace("\n", "\\n")
            pk_end = pk[-30:].replace("\n", "\\n")
            print(f"INFO-DEBUG: Comprimento da private_key: {pk_len} caracteres")
            print(f"INFO-DEBUG: Inicio da chave: '{pk_start}' | Fim da chave: '{pk_end}'")
            
            if "\\n" in pk:
                print("INFO-DEBUG: Encontradas quebras de linha escapadas (\\\\n) na chave. Corrigindo...")
                info["private_key"] = pk.replace("\\n", "\n")
            
            info["private_key"] = info["private_key"].strip().strip('"').strip("'")
            
        credentials = service_account.Credentials.from_service_account_info(
            info, scopes=SCOPES
        )
    except Exception as e:
        print(f"INFO-DEBUG: Erro na leitura manual do JSON: {e}")
        # Fallback para o método padrão caso falte o arquivo ou ocorra algum erro na leitura manual
        credentials = service_account.Credentials.from_service_account_file(
            file_path, scopes=SCOPES
        )
        
    return build("drive", "v3", credentials=credentials, cache_discovery=False)


def list_webp_files(folder_id: str) -> list[DriveFile]:
    """Lista todos os .webp da pasta, sem duplicar por paginação."""
    client = _get_client()
    query = f"'{folder_id}' in parents and mimeType='image/webp' and trashed=false"

    files: list[DriveFile] = []
    page_token = None
    while True:
        response = (
            client.files()
            .list(
                q=query,
                fields="nextPageToken, files(id, name, md5Checksum)",
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


def download_file(file_id: str) -> bytes:
    client = _get_client()
    request = client.files().get_media(fileId=file_id)
    buffer = io.BytesIO()
    downloader = MediaIoBaseDownload(buffer, request)
    done = False
    while not done:
        _, done = downloader.next_chunk()
    return buffer.getvalue()
