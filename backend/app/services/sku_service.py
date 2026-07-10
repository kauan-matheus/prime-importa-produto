from sqlalchemy import text
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session

SEQUENCE_NAME = "product_sku_seq"


def ensure_sequence_exists(engine: Engine) -> None:
    with engine.begin() as conn:
        conn.execute(text(f"CREATE SEQUENCE IF NOT EXISTS {SEQUENCE_NAME} START WITH 1"))


def _format(value: int) -> str:
    return f"PROD-{value:06d}"


def generate_next_sku(db: Session) -> str:
    """Consome a sequence de forma atômica. Nunca repete, mesmo sob concorrência."""
    value = db.execute(text(f"SELECT nextval('{SEQUENCE_NAME}')")).scalar_one()
    return _format(value)


def peek_next_sku(db: Session) -> str:
    """Apenas para exibir na tela antes de salvar — não reserva o valor."""
    row = db.execute(text(f"SELECT last_value, is_called FROM {SEQUENCE_NAME}")).one()
    last_value, is_called = row
    next_value = last_value + 1 if is_called else last_value
    return _format(next_value)
