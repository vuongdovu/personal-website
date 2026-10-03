import logging
import os
import uuid
from datetime import date
from functools import lru_cache
from pathlib import Path
from urllib.parse import urlsplit

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from minio.error import S3Error
from pydantic import BaseModel, Field
from sqlalchemy import select
from fastapi.responses import FileResponse, JSONResponse, StreamingResponse
from minio import Minio
from PIL import Image, UnidentifiedImageError, JpegImagePlugin
from pillow_heif import register_heif_opener

from models import Photo, SessionLocal

logger = logging.getLogger(__name__)
app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
INDEX_PATH = Path(__file__).resolve().parents[1] / "frontend" / "html" / "index.html"
MAX_FILE_BYTES = 20 * 1024 * 1024
IMAGE_FORMATS = {
    "JPEG": ("jpg", "image/jpeg"),
    "PNG": ("png", "image/png"),
    "WEBP": ("webp", "image/webp"),
}
Image.MAX_IMAGE_PIXELS = 50_000_000
IMAGE_EXTENSIONS = (".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif")
IMAGE_MIME_TYPES = {
    ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png",
    ".webp": "image/webp", ".gif": "image/gif", ".avif": "image/avif",
}

JpegImagePlugin._getmp = lambda x: None
register_heif_opener()

@lru_cache
def minio_client() -> Minio:
    endpoint = os.environ.get("MINIO_ENDPOINT", "minio.tail877c9f.ts.net")
    if "://" in endpoint or "/" in endpoint:
        raise ValueError("MINIO_ENDPOINT must be a hostname, optionally followed by a port")
    return Minio(
        endpoint,
        access_key=os.environ["MINIO_ACCESS_KEY"],
        secret_key=os.environ["MINIO_SECRET_KEY"],
        secure=os.environ.get("MINIO_SECURE", "true").lower() == "true",
    )


@app.middleware("http")
async def limit_request_size(request: Request, call_next):
    if request.method == "POST":
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                size = int(content_length)
            except ValueError:
                return JSONResponse({"detail": "Invalid Content-Length"}, status_code=400)
            if size > MAX_FILE_BYTES + 1024 * 1024:
                return JSONResponse({"detail": "Image must be 20 MB or smaller"}, status_code=413)
    response = await call_next(request)
    response.headers["X-Archive-Admin"] = "1"
    return response

def process_and_convert_heic(photo) -> tuple[bool, int]:
    """
    Checks if an uploaded photo is a HEIC file. If so, converts it to JPEG in-memory.
    Returns a tuple: (was_converted: bool, correct_byte_size: int)
    """
    filename = getattr(photo, "filename", "").lower()
    
    if filename.endswith(".heic") or filename.endswith(".heif"):
        try:
            # Ensure we read from the beginning of the uploaded stream
            photo.file.seek(0)
            
            with Image.open(photo.file) as heic_image:
                if heic_image.mode != "RGB":
                    heic_image = heic_image.convert("RGB")
                
                converted_buffer = io.BytesIO()
                # Save into buffer; 90 quality matches your target balance
                heic_image.save(converted_buffer, format="JPEG", quality=90)
                
                # Get the size of the newly generated JPEG file
                byte_size = converted_buffer.tell()
                
                # Rewind and swap out the file reference
                converted_buffer.seek(0)
                photo.file = converted_buffer
                
                # Update filename extension safely
                if hasattr(photo, "filename") and photo.filename:
                    photo.filename = f"{photo.filename.rsplit('.', 1)[0]}.jpg"
                
                return True, byte_size
                
        except Exception as e:
            # Log the error safely if you have a logger initialized
            raise HTTPException(status_code=422, detail="Failed to process HEIC image") from e

    # If it wasn't a HEIC file, get the original file size safely
    photo.file.seek(0, os.SEEK_END)
    byte_size = photo.file.tell()
    photo.file.seek(0)
    return False, byte_size


@app.get("/", include_in_schema=False)
def index():
    return FileResponse(INDEX_PATH, headers={"Cache-Control": "no-store"})


def require_same_origin(request: Request) -> None:
    # Cross-origin forms can reach a private tailnet address from a browser.
    origin = request.headers.get("origin")
    parsed_origin = urlsplit(origin) if origin else None
    expected_host = request.headers.get("x-forwarded-host") or request.headers.get("host")
    if not parsed_origin or parsed_origin.scheme not in ("http", "https") or parsed_origin.netloc != expected_host:
        raise HTTPException(status_code=403, detail="Invalid request origin")


class DeletePhotoRequest(BaseModel):
    object_key: str = Field(min_length=1, max_length=1024)


@app.get("/photos")
def list_photos():
    bucket = os.environ.get("MINIO_BUCKET", "photos")
    try:
        objects = {
            item.object_name: item
            for item in minio_client().list_objects(bucket, recursive=True)
            if item.object_name and item.object_name.lower().endswith(IMAGE_EXTENSIONS)
        }
    except Exception:
        logger.exception("Could not list MinIO photos")
        raise HTTPException(status_code=502, detail="Could not list photos in MinIO") from None

    try:
        with SessionLocal() as session:
            records = session.scalars(select(Photo)).all()
    except Exception:
        logger.exception("Could not list photo metadata")
        raise HTTPException(status_code=500, detail="Could not list photo metadata") from None

    metadata = {record.object_key: record for record in records}
    live = []
    for key, item in objects.items():
        record = metadata.get(key)
        live.append({
            "object_key": key,
            "title": record.title if record else key.rsplit("/", 1)[-1],
            "caption": record.caption if record else "",
            "taken_on": record.taken_on.isoformat() if record and record.taken_on else None,
            "created_at": record.created_at.isoformat() if record else item.last_modified.isoformat(),
            "has_metadata": record is not None,
        })
    live.sort(key=lambda photo: photo["taken_on"] or photo["created_at"], reverse=True)

    missing = [{
        "object_key": record.object_key,
        "title": record.title,
        "taken_on": record.taken_on.isoformat() if record.taken_on else None,
        "created_at": record.created_at.isoformat(),
    } for record in records if record.object_key not in objects]
    missing.sort(key=lambda photo: photo["taken_on"] or photo["created_at"], reverse=True)
    return {"live": live, "missing": missing}


@app.get("/preview")
def preview_photo(object_key: str):
    extension = Path(object_key).suffix.lower()
    if extension not in IMAGE_MIME_TYPES:
        raise HTTPException(status_code=404, detail="Photo not found")

    try:
        image = minio_client().get_object(os.environ.get("MINIO_BUCKET", "photos"), object_key)
    except S3Error as error:
        if error.code in ("NoSuchKey", "NoSuchObject"):
            raise HTTPException(status_code=404, detail="Photo not found") from None
        logger.exception("Could not preview %s", object_key)
        raise HTTPException(status_code=502, detail="Could not load photo") from None

    def chunks():
        try:
            yield from image.stream(64 * 1024)
        finally:
            image.close()
            image.release_conn()

    return StreamingResponse(
        chunks(),
        media_type=IMAGE_MIME_TYPES[extension],
        headers={"Cache-Control": "no-store"},
    )


@app.post("/upload")
def upload_photo(
    request: Request,
    photo: UploadFile = File(...),
    title: str = Form(...),
    caption: str = Form(""),
    taken_on: date | None = Form(None),
    tags: str = Form(""),
):
    require_same_origin(request)

    title = title.strip()
    caption = caption.strip()
    parsed_tags = list(dict.fromkeys(tag.strip() for tag in tags.split(",") if tag.strip()))
    if not title or len(title) > 200:
        raise HTTPException(status_code=422, detail="Title must be 1 to 200 characters")
    if len(caption) > 2000:
        raise HTTPException(status_code=422, detail="Caption must be 2000 characters or shorter")
    if len(parsed_tags) > 20 or any(len(tag) > 50 for tag in parsed_tags):
        raise HTTPException(status_code=422, detail="Use at most 20 tags of 50 characters each")

    was_converted, byte_size = process_and_convert_heic(photo)
    
    if byte_size == 0 or byte_size > MAX_FILE_BYTES:
        raise HTTPException(status_code=413, detail="Image must be between 1 byte and 20 MB")
    try:
        with Image.open(photo.file) as image:
            image_format = image.format
            image.verify()
    except (UnidentifiedImageError, OSError, ValueError, Image.DecompressionBombError):
        raise HTTPException(status_code=422, detail="Invalid image") from None
    if image_format not in IMAGE_FORMATS:
        print(image_format)
        raise HTTPException(status_code=422, detail="Use a JPEG, PNG, or WebP image")
    photo.file.seek(0)

    extension, content_type = IMAGE_FORMATS[image_format]
    photo_id = uuid.uuid4()
    object_key = f"photos/{photo_id}.{extension}"
    bucket = os.environ.get("MINIO_BUCKET", "photos")
    client = minio_client()

    try:
        client.put_object(bucket, object_key, photo.file, byte_size, content_type=content_type)
    except Exception:
        logger.exception("Could not upload %s to MinIO", object_key)
        raise HTTPException(status_code=502, detail="Could not save image") from None

    try:
        with SessionLocal.begin() as session:
            session.add(Photo(
                id=photo_id,
                title=title,
                caption=caption,
                taken_on=taken_on,
                tags=parsed_tags,
                object_key=object_key,
                content_type=content_type,
                byte_size=byte_size,
            ))
    except Exception:
        logger.exception("Could not save metadata for %s", object_key)
        try:
            client.remove_object(bucket, object_key)
        except Exception:
            logger.exception("Could not remove orphaned MinIO object %s", object_key)
        raise HTTPException(status_code=500, detail="Could not save photo metadata") from None

    return {"id": str(photo_id), "title": title, "object_key": object_key}


@app.delete("/photos")
def delete_photo(request: Request, payload: DeletePhotoRequest):
    require_same_origin(request)
    key = payload.object_key
    if not key.lower().endswith(IMAGE_EXTENSIONS):
        raise HTTPException(status_code=422, detail="Object is not a gallery image")

    bucket = os.environ.get("MINIO_BUCKET", "photos")
    client = minio_client()
    image_removed = False
    try:
        with SessionLocal.begin() as session:
            record = session.scalar(select(Photo).where(Photo.object_key == key).with_for_update())
            try:
                client.stat_object(bucket, key)
                exists = True
            except S3Error as error:
                if error.code not in ("NoSuchKey", "NoSuchObject"):
                    raise
                exists = False

            if not exists and record is None:
                raise HTTPException(status_code=404, detail="Photo not found")
            if exists:
                client.remove_object(bucket, key)
                image_removed = True
            if record is not None:
                session.delete(record)
    except HTTPException:
        raise
    except S3Error:
        logger.exception("Could not delete %s from MinIO", key)
        raise HTTPException(status_code=502, detail="Could not delete image from MinIO") from None
    except Exception:
        logger.exception("Could not delete photo %s", key)
        detail = ("Image was removed, but database cleanup failed. Retry to remove its record."
                  if image_removed else "Could not delete photo")
        raise HTTPException(status_code=500, detail=detail) from None

    return {"deleted": True, "object_key": key}
