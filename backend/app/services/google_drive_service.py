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
    settings = get_settings()
    
    try:
        with open(settings.google_service_account_file, "r", encoding="utf-8") as f:
            info = json.load(f)
        
        # Corrige automaticamente problemas comuns de escape da chave privada ao copiar/colar em formulários web
        if "private_key" in info and isinstance(info["private_key"], str):
            pk = info["private_key"]
            if "\\n" in pk:
                info["private_key"] = pk.replace("\\n", "\n")
            # Remove possíveis aspas duplicadas ou espaços extras nas pontas
            info["private_key"] = info["private_key"].strip().strip('"').strip("'")
            
        credentials = service_account.Credentials.from_service_account_info(
            info, scopes=SCOPES
        )
    except Exception:
        # Fallback para o método padrão caso falte o arquivo ou ocorra algum erro na leitura manual
        credentials = service_account.Credentials.from_service_account_file(
            settings.google_service_account_file, scopes=SCOPES
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
