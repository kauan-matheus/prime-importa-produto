from datetime import datetime

from pydantic import BaseModel, ConfigDict


class StoreCreate(BaseModel):
    name: str
    nuvemshop_store_id: str
    access_token: str


class StoreOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    nuvemshop_store_id: str
    created_at: datetime


class CategoryOut(BaseModel):
    id: int
    name: str
