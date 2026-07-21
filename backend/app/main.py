import os
from contextlib import asynccontextmanager
from urllib.parse import urlparse

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.database import Base, SessionLocal, engine
from app.routes import auth, images, products, stores
from app.services import google_drive_service, sku_service
from app.services.scheduler import start_scheduler, stop_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    sku_service.ensure_sequence_exists(engine)
    start_scheduler(SessionLocal)
    yield
    stop_scheduler()


settings = get_settings()

app = FastAPI(title="Prime Importa Produto", lifespan=lifespan)

_origins = [origin.strip() for origin in settings.frontend_origin.split(",") if origin.strip()]
_expanded_origins = list(_origins)

for origin in _origins:
    parsed = urlparse(origin)
    if parsed.scheme and parsed.hostname in {"localhost", "127.0.0.1", "::1", "[::1]"}:
        port_suffix = f":{parsed.port}" if parsed.port is not None else ""
        for hostname in ("localhost", "127.0.0.1", "::1"):
            local_origin = f"{parsed.scheme}://{hostname}{port_suffix}"
            if local_origin not in _expanded_origins:
                _expanded_origins.append(local_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_expanded_origins,
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(stores.router)
app.include_router(images.router)
app.include_router(products.router)


@app.get("/version")
def version():
    # Permite confirmar de fora qual commit está realmente no ar, sem depender
    # de olhar o dashboard do Render (RENDER_GIT_COMMIT é preenchido automaticamente).
    return {"commit": os.environ.get("RENDER_GIT_COMMIT", "unknown")}


@app.get("/debug/drive-folder")
def debug_drive_folder():
    """Diagnóstico temporário: mostra tudo que existe na pasta configurada do
    Drive (inclusive subpastas e arquivos sem checksum), pra confirmar se a
    sincronização normal (que ignora os dois) está deixando fotos de fora."""
    raw = google_drive_service.debug_list_folder_raw(settings.google_drive_folder_id)
    folders = [f for f in raw if f.get("mimeType") == "application/vnd.google-apps.folder"]
    images_ok = [f for f in raw if f.get("mimeType", "").startswith("image/") and f.get("md5Checksum")]
    images_no_checksum = [f for f in raw if f.get("mimeType", "").startswith("image/") and not f.get("md5Checksum")]
    other = [
        f for f in raw
        if f not in folders and f not in images_ok and f not in images_no_checksum
    ]
    return {
        "total_items_na_raiz": len(raw),
        "subpastas": [{"id": f["id"], "name": f["name"]} for f in folders],
        "imagens_ok_sincronizaveis": len(images_ok),
        "imagens_SEM_checksum_ignoradas": [f["name"] for f in images_no_checksum],
        "outros_tipos_de_arquivo": [{"name": f["name"], "mimeType": f.get("mimeType")} for f in other],
    }
