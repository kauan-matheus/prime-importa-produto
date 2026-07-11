from contextlib import asynccontextmanager

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

# Permite múltiplos origins separados por vírgula no .env e garante suporte a localhost, 127.0.0.1 e [::1] com qualquer porta
import urllib.parse

origins = [origin.strip() for origin in settings.frontend_origin.split(",")]
extended_origins = list(origins)
for origin in origins:
    try:
        parsed = urllib.parse.urlparse(origin)
        hostname = parsed.hostname
        if hostname in ("localhost", "127.0.0.1", "[::1]", "::1"):
            port_suffix = f":{parsed.port}" if parsed.port is not None else ""
            scheme = parsed.scheme
            for h in ("localhost", "127.0.0.1", "[::1]"):
                local_url = f"{scheme}://{h}{port_suffix}"
                if local_url not in extended_origins:
                    extended_origins.append(local_url)
    except Exception:
        pass
origins = extended_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(stores.router)
app.include_router(images.router)
app.include_router(products.router)
