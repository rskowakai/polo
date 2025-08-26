import enum
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Enum,
    ForeignKey,
    TIMESTAMP,
    func,
)
from sqlalchemy.orm import relationship

from app.core.database import Base


class PismoStatus(str, enum.Enum):
    NOWE = "NOWE"
    W_ANALIZIE = "W ANALIZIE"
    OCZEKUJE_NA_DECYZJE = "OCZEKUJE NA DECYZJE"
    REALIZOWANE = "REALIZOWANE"
    ZAKONCZONE = "ZAKOŃCZONE"
    ANULOWANE = "ANULOWANE"


class Pismo(Base):
    __tablename__ = "pisma"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    status = Column(Enum(PismoStatus), nullable=False, default=PismoStatus.NOWE)
    user_comments = Column(Text, nullable=True)

    created_at = Column(
        TIMESTAMP(timezone=True), nullable=False, server_default=func.now()
    )
    updated_at = Column(
        TIMESTAMP(timezone=True),
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    owner = relationship("User")

    analizy = relationship("Analiza", back_populates="pismo", cascade="all, delete-orphan")
