from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.models.image import ImageStatus


class ImageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    drive_file_id: str
    file_name: str
    status: ImageStatus
    created_at: datetime
    content_url: str

    @staticmethod
    def from_image(image) -> "ImageOut":
        return ImageOut(
            id=image.id,
            drive_file_id=image.drive_file_id,
            file_name=image.file_name,
            status=image.status,
            created_at=image.created_at,
            content_url=f"/images/{image.id}/content",
        )
