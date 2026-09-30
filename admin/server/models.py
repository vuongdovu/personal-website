import os
import uuid
from datetime import date, datetime

from sqlalchemy import BigInteger, Date, DateTime, String, Text, create_engine, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.engine import URL
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, sessionmaker


class Base(DeclarativeBase):
    pass


class Photo(Base):
    __tablename__ = "photos"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    caption: Mapped[str] = mapped_column(Text, nullable=False, default="")
    taken_on: Mapped[date | None] = mapped_column(Date)
    tags: Mapped[list[str]] = mapped_column(ARRAY(Text), nullable=False, default=list)
    object_key: Mapped[str] = mapped_column(Text, nullable=False, unique=True)
    content_type: Mapped[str] = mapped_column(String(50), nullable=False)
    byte_size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


database_url = URL.create(
    "postgresql+psycopg",
    username=os.environ.get("DB_USER", "postgres"),
    password=os.environ.get("DB_PASSWORD"),
    host=os.environ.get("DB_HOST", "db"),
    port=int(os.environ.get("DB_PORT", "5432")),
    database=os.environ.get("DB_NAME", "postgres"),
)
engine = create_engine(database_url, pool_pre_ping=True)
SessionLocal = sessionmaker(bind=engine)
