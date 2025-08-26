from pydantic import BaseModel
from datetime import datetime
from typing import Optional

from .analiza import Analiza
from app.models.pismo import PismoStatus


# Shared properties
class PismoBase(BaseModel):
    title: str
    content: str
    user_comments: Optional[str] = None


# Properties to receive on creation
class PismoCreate(PismoBase):
    pass


# Properties to receive on update
class PismoUpdate(BaseModel):
    status: Optional[PismoStatus] = None
    user_comments: Optional[str] = None


# Properties shared by models in DB
class PismoInDBBase(PismoBase):
    id: int
    owner_id: int
    status: PismoStatus
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


# Properties to return to client
class Pismo(PismoInDBBase):
    analizy: list[Analiza] = []


# Properties stored in DB
class PismoInDB(PismoInDBBase):
    pass
