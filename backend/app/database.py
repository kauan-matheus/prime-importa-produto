from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import get_settings

settings = get_settings()

# Normaliza a URL do banco para garantir compatibilidade com o driver psycopg2 no SQLAlchemy (Neon, Render, Heroku)
db_url = settings.database_url
if db_url.startswith("postgres://"):
    db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
elif db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)

# Log seguro do host de conexão do banco para depuração
try:
    db_host = db_url.split("@")[-1].split("/")[0]
    print(f"INFO: Tentando conectar ao banco de dados no host: {db_host}")
except Exception:
    pass

engine = create_engine(db_url, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
