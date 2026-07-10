from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ProductCreate(BaseModel):
    store_id: int
    drive_file_id: str

    nome: str = Field(min_length=1, max_length=255)
    descricao: str | None = None
    preco: Decimal = Field(ge=0)
    preco_promocional: Decimal | None = Field(default=None, ge=0)
    estoque: int = Field(ge=0)
    peso: Decimal | None = Field(default=None, ge=0)
    comprimento: Decimal | None = Field(default=None, ge=0)
    largura: Decimal | None = Field(default=None, ge=0)
    altura: Decimal | None = Field(default=None, ge=0)

    categoria_id: int
    marca: str | None = None
    collection_id: int | None = None


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sku: str
    nome: str
    nuvemshop_product_id: str
    drive_file_id: str
    created_at: datetime


class NextSkuOut(BaseModel):
    sku: str
