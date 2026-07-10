import base64

import httpx
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.store import Store

COLLECTIONS_ROOT_NAME = "Coleções"


def _client(store: Store) -> httpx.Client:
    settings = get_settings()
    return httpx.Client(
        base_url=f"{settings.nuvemshop_api_base}/{store.nuvemshop_store_id}",
        headers={
            "Authentication": f"bearer {store.access_token}",
            "User-Agent": settings.nuvemshop_user_agent,
            "Content-Type": "application/json",
        },
        timeout=30.0,
    )


def _category_name(raw: dict | str) -> str:
    if isinstance(raw, dict):
        return raw.get("pt") or next(iter(raw.values()), "")
    return raw


def _list_all_categories(store: Store) -> list[dict]:
    categories: list[dict] = []
    with _client(store) as client:
        page = 1
        while True:
            response = client.get("/categories", params={"per_page": 200, "page": page})
            if response.status_code == 404:
                break
            response.raise_for_status()
            batch = response.json()
            if not batch:
                break
            categories.extend(batch)
            page += 1
    return categories


def get_categories(store: Store) -> list[dict]:
    """Categorias de nível raiz (parent nulo ou 0), exclui a raiz reservada de Coleções."""
    all_categories = _list_all_categories(store)
    return [
        {"id": c["id"], "name": _category_name(c["name"])}
        for c in all_categories
        if c.get("parent") in (None, 0) and _category_name(c["name"]) != COLLECTIONS_ROOT_NAME
    ]


def get_collections(store: Store, db: Session) -> list[dict]:
    """Subcategorias da categoria-pai 'Coleções', criando a raiz se ainda não existir."""
    all_categories = _list_all_categories(store)

    root = next(
        (c for c in all_categories if c.get("parent") in (None, 0) and _category_name(c["name"]) == COLLECTIONS_ROOT_NAME),
        None,
    )

    if root is None:
        with _client(store) as client:
            response = client.post("/categories", json={"name": {"pt": COLLECTIONS_ROOT_NAME}})
            response.raise_for_status()
            root = response.json()

    if store.collections_root_category_id != root["id"]:
        store.collections_root_category_id = root["id"]
        db.add(store)
        db.commit()

    return [
        {"id": c["id"], "name": _category_name(c["name"])}
        for c in all_categories
        if c.get("parent") == root["id"]
    ]


def get_brands(store: Store) -> list[str]:
    """Marcas distintas já usadas nos produtos existentes da loja."""
    brands: set[str] = set()
    with _client(store) as client:
        page = 1
        while True:
            response = client.get("/products", params={"fields": "id,brand", "per_page": 200, "page": page})
            if response.status_code == 404:
                break
            response.raise_for_status()
            batch = response.json()
            if not batch:
                break
            for product in batch:
                if product.get("brand"):
                    brands.add(product["brand"])
            page += 1
    return sorted(brands)


def create_product(store: Store, data: dict) -> dict:
    category_ids = [cid for cid in (data.get("categoria_id"), data.get("collection_id")) if cid is not None]

    payload = {
        "name": {"pt": data["nome"]},
        "description": {"pt": data.get("descricao") or ""},
        "brand": data.get("marca") or "",
        "categories": category_ids,
        "variants": [
            {
                "price": str(data["preco"]),
                "promotional_price": str(data["preco_promocional"]) if data.get("preco_promocional") else None,
                "stock": data["estoque"],
                "stock_management": True,
                "weight": str(data["peso"]) if data.get("peso") else None,
                "width": str(data["largura"]) if data.get("largura") else None,
                "height": str(data["altura"]) if data.get("altura") else None,
                "depth": str(data["comprimento"]) if data.get("comprimento") else None,
                "sku": data["sku"],
            }
        ],
    }

    with _client(store) as client:
        response = client.post("/products", json=payload)
        response.raise_for_status()
        return response.json()


def add_product_image(store: Store, nuvemshop_product_id: str, image_bytes: bytes, filename: str) -> dict:
    payload = {
        "attachment": base64.b64encode(image_bytes).decode("ascii"),
        "filename": filename,
    }
    with _client(store) as client:
        response = client.post(f"/products/{nuvemshop_product_id}/images", json=payload)
        response.raise_for_status()
        return response.json()
