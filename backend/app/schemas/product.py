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


class ProductUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=1, max_length=255)
    descricao: str | None = None
    preco: Decimal | None = Field(default=None, ge=0)
    preco_promocional: Decimal | None = Field(default=None, ge=0)
    estoque: int | None = Field(default=None, ge=0)
    peso: Decimal | None = Field(default=None, ge=0)
    comprimento: Decimal | None = Field(default=None, ge=0)
    largura: Decimal | None = Field(default=None, ge=0)
    altura: Decimal | None = Field(default=None, ge=0)

    categoria_id: int | None = None
    marca: str | None = None
    collection_id: int | None = None


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    sku: str
    nome: str
    descricao: str | None
    preco: Decimal
    preco_promocional: Decimal | None
    estoque: int
    peso: Decimal | None
    comprimento: Decimal | None
    largura: Decimal | None
    altura: Decimal | None
    categoria_id: int
    marca: str | None
    collection_id: int | None
    store_id: int
    nuvemshop_product_id: str
    drive_file_id: str
    created_at: datetime
    content_url: str | None = None

    @staticmethod
    def from_product(product, content_url: str | None = None) -> "ProductOut":
        return ProductOut(
            id=product.id,
            sku=product.sku,
            nome=product.nome,
            descricao=product.descricao,
            preco=product.preco,
            preco_promocional=product.preco_promocional,
            estoque=product.estoque,
            peso=product.peso,
            comprimento=product.comprimento,
            largura=product.largura,
            altura=product.altura,
            categoria_id=product.categoria_id,
            marca=product.marca,
            collection_id=product.collection_id,
            store_id=product.store_id,
            nuvemshop_product_id=product.nuvemshop_product_id,
            drive_file_id=product.drive_file_id,
            created_at=product.created_at,
            content_url=content_url,
        )


class NextSkuOut(BaseModel):
    sku: str
