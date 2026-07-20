from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.store import Store
from app.schemas.store import CategoryOut, StoreCreate, StoreOut
from app.services import nuvemshop_service

router = APIRouter(prefix="/stores", tags=["stores"])


def _get_store_or_404(store_id: int, db: Session) -> Store:
    store = db.get(Store, store_id)
    if store is None:
        raise HTTPException(status_code=404, detail="Loja não encontrada")
    return store


@router.get("", response_model=list[StoreOut])
def list_stores(db: Session = Depends(get_db)):
    return db.scalars(select(Store).order_by(Store.name)).all()


@router.post("", response_model=StoreOut, status_code=201)
def create_store(payload: StoreCreate, db: Session = Depends(get_db)):
    store = Store(**payload.model_dump())
    db.add(store)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Já existe uma loja cadastrada com esse ID da Nuvemshop")
    db.refresh(store)
    return store


@router.get("/{store_id}/categories", response_model=list[CategoryOut])
def get_categories(store_id: int, db: Session = Depends(get_db)):
    store = _get_store_or_404(store_id, db)
    return nuvemshop_service.get_categories(store)


@router.get("/{store_id}/collections", response_model=list[CategoryOut])
def get_collections(store_id: int, db: Session = Depends(get_db)):
    store = _get_store_or_404(store_id, db)
    return nuvemshop_service.get_collections(store, db)


@router.get("/{store_id}/brands", response_model=list[str])
def get_brands(store_id: int, db: Session = Depends(get_db)):
    store = _get_store_or_404(store_id, db)
    return nuvemshop_service.get_brands(store)
