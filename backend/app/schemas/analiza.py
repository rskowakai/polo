from pydantic import BaseModel
from typing import Optional, Any

from .opcja import Opcja


# Shared properties
class AnalizaBase(BaseModel):
    summary: Optional[str] = None
    internal_notes: Optional[str] = None
    attachments: Optional[list[Any]] = None


# Properties to receive on creation
class AnalizaCreate(AnalizaBase):
    pismo_id: int


# Properties to receive on update
class AnalizaUpdate(AnalizaBase):
    pass


# Properties shared by models in DB
class AnalizaInDBBase(AnalizaBase):
    id: int
    pismo_id: int
    admin_id: int

    class Config:
        orm_mode = True


# Properties to return to client
class Analiza(AnalizaInDBBase):
    opcje: list[Opcja] = []


# Properties stored in DB
class AnalizaInDB(AnalizaInDBBase):
    pass
