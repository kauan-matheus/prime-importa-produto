import mimetypes
import io

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.image import Image, ImageStatus
from app.schemas.image import ImageOut
from app.services import google_drive_service

router = APIRouter(prefix="/images", tags=["images"])


@router.get("", response_model=list[ImageOut])
def list_images(
    status: ImageStatus | None = Query(default=None),
    limit: int = Query(default=1000, le=2000),
    db: Session = Depends(get_db),
):
    query = select(Image)
    if status is not None:
        query = query.where(Image.status == status)

    images = db.scalars(query.order_by(Image.created_at.asc(), Image.id.asc()).limit(limit)).all()
    return [ImageOut.from_image(image) for image in images]


@router.get("/{image_id}/content")
def get_image_content(image_id: int, db: Session = Depends(get_db)):
    image = db.get(Image, image_id)
    if image is None:
        raise HTTPException(status_code=404, detail="Imagem não encontrada")

    content = google_drive_service.download_file(image.drive_file_id)
    media_type = mimetypes.guess_type(image.file_name)[0] or "application/octet-stream"
    return StreamingResponse(io.BytesIO(content), media_type=media_type)
