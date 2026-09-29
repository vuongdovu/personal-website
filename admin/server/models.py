from sqlalchemy.orm import DeclarativeBase

class Base (DeclarativeBase):
    pass

class Photos(Base):
    __tablename__ = "photos"
    
    id: Mapped[uuid.UUID] = mapped_column(Uuid, primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(30))
    caption: Mapped[str] = mapped_column(String(30))
    created_at: 
    updated_at:
    tags:
    s3_url:
    folder_id:

