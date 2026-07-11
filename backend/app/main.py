from contextlib import asynccontextmanager
from urllib.parse import urlparse

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.database import Base, SessionLocal, engine
from app.routes import auth, images, products, stores
from app.services import sku_service
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
