import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.image import Image, ImageStatus
from app.models.product import Product
from app.models.store import Store
from app.schemas.product import NextSkuOut, ProductCreate, ProductOut, ProductUpdate
from app.services import google_drive_service, nuvemshop_service, sku_service

router = APIRouter(prefix="/products", tags=["products"])


def _content_url(db: Session, drive_file_id: str) -> str | None:
    image = db.scalars(select(Image).where(Image.drive_file_id == drive_file_id)).first()
    return f"/images/{image.id}/content" if image else None


@router.get("/next-sku", response_model=NextSkuOut)
def preview_next_sku(db: Session = Depends(get_db)):
    return NextSkuOut(sku=sku_service.peek_next_sku(db))


@router.get("", response_model=list[ProductOut])
def list_products(store_id: int | None = Query(default=None), db: Session = Depends(get_db)):
    query = select(Product, Image.id).outerjoin(Image, Image.drive_file_id == Product.drive_file_id)
    if store_id is not None:
        query = query.where(Product.store_id == store_id)

    rows = db.execute(query.order_by(Product.created_at.desc())).all()
    return [
        ProductOut.from_product(product, content_url=f"/images/{image_id}/content" if image_id else None)
        for product, image_id in rows
    ]


@router.post("", response_model=ProductOut, status_code=201)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)):
    image = db.scalars(select(Image).where(Image.drive_file_id == payload.drive_file_id)).first()
    if image is None:
        raise HTTPException(status_code=404, detail="Imagem não encontrada")
    if image.status == ImageStatus.completed:
        raise HTTPException(status_code=409, detail="Imagem já processada")

    store = db.get(Store, payload.store_id)
    if store is None:
        raise HTTPException(status_code=404, detail="Loja não encontrada")

    sku = sku_service.generate_next_sku(db)

    try:
        image_bytes = google_drive_service.download_file(image.drive_file_id)
        nuvemshop_product = nuvemshop_service.create_product(store, {**payload.model_dump(), "sku": sku})
        nuvemshop_service.add_product_image(
            store, nuvemshop_product["id"], image_bytes, image.file_name
        )
    except httpx.HTTPStatusError as exc:
        image.status = ImageStatus.error
        db.commit()
        raise HTTPException(
            status_code=502, detail=f"Falha ao criar produto na Nuvemshop: {exc.response.text}"
        ) from exc
    except Exception as exc:
        image.status = ImageStatus.error
        db.commit()
        raise HTTPException(status_code=502, detail=f"Falha ao criar produto: {exc}") from exc

    product = Product(
        sku=sku,
        nome=payload.nome,
        descricao=payload.descricao,
        preco=payload.preco,
        preco_promocional=payload.preco_promocional,
        estoque=payload.estoque,
        peso=payload.peso,
        comprimento=payload.comprimento,
        largura=payload.largura,
        altura=payload.altura,
        categoria_id=payload.categoria_id,
        marca=payload.marca,
        collection_id=payload.collection_id,
        store_id=store.id,
        drive_file_id=image.drive_file_id,
        nuvemshop_product_id=str(nuvemshop_product["id"]),
    )
    image.status = ImageStatus.completed
    db.add(product)
    db.commit()
    db.refresh(product)
    return ProductOut.from_product(product, content_url=f"/images/{image.id}/content")


@router.patch("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, payload: ProductUpdate, db: Session = Depends(get_db)):
    product = db.get(Product, product_id)
    if product is None:
        raise HTTPException(status_code=404, detail="Produto não encontrado")

    store = db.get(Store, product.store_id)
    if store is None:
        raise HTTPException(status_code=404, detail="Loja não encontrada")

    merged = {
        "nome": product.nome,
        "descricao": product.descricao,
        "preco": product.preco,
        "preco_promocional": product.preco_promocional,
        "estoque": product.estoque,
        "peso": product.peso,
        "comprimento": product.comprimento,
        "largura": product.largura,
        "altura": product.altura,
        "categoria_id": product.categoria_id,
        "marca": product.marca,
        "collection_id": product.collection_id,
    }
    merged.update(payload.model_dump(exclude_unset=True))

    try:
        nuvemshop_service.update_product(store, product.nuvemshop_product_id, merged)
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=502, detail=f"Falha ao atualizar produto na Nuvemshop: {exc.response.text}"
        ) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Falha ao atualizar produto: {exc}") from exc

    for field, value in merged.items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)

    return ProductOut.from_product(product, content_url=_content_url(db, product.drive_file_id))
