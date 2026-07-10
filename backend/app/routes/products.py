import httpx
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.image import Image, ImageStatus
from app.models.product import Product
from app.models.store import Store
from app.schemas.product import NextSkuOut, ProductCreate, ProductOut
from app.services import google_drive_service, nuvemshop_service, sku_service

router = APIRouter(prefix="/products", tags=["products"])


@router.get("/next-sku", response_model=NextSkuOut)
def preview_next_sku(db: Session = Depends(get_db)):
    return NextSkuOut(sku=sku_service.peek_next_sku(db))


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
    return product
