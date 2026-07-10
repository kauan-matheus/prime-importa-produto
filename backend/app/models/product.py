from datetime import datetime
from decimal import Decimal

from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    sku: Mapped[str] = mapped_column(String(20), nullable=False, unique=True, index=True)
    nome: Mapped[str] = mapped_column(String(255), nullable=False)
    descricao: Mapped[str | None] = mapped_column(Text, nullable=True)
    preco: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    preco_promocional: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    estoque: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    peso: Mapped[Decimal | None] = mapped_column(Numeric(10, 3), nullable=True)
    comprimento: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    largura: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    altura: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)

    categoria_id: Mapped[int] = mapped_column(Integer, nullable=False)
    marca: Mapped[str | None] = mapped_column(String(255), nullable=True)
    collection_id: Mapped[int | None] = mapped_column(Integer, nullable=True)

    store_id: Mapped[int] = mapped_column(ForeignKey("stores.id"), nullable=False)
    drive_file_id: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    nuvemshop_product_id: Mapped[str] = mapped_column(String(50), nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
