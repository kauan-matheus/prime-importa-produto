import logging

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.models.image import Image
from app.services import google_drive_service

logger = logging.getLogger(__name__)


def sync_pending_images(db: Session) -> int:
    """Descobre arquivos novos na pasta do Drive e insere como 'pending'.

    Dedupe em três camadas: drive_file_id (mesmo arquivo), hash/md5Checksum
    (mesmo conteúdo enviado sob outro nome/arquivo) e file_name (mesmo nome
    de foto reenviado/duplicado na pasta do Drive).
    """
    settings = get_settings()
    drive_files = google_drive_service.list_image_files(settings.google_drive_folder_id)

    known_ids = set(db.scalars(select(Image.drive_file_id)))
    known_hashes = set(db.scalars(select(Image.hash)))
    known_names = set(db.scalars(select(Image.file_name)))

    inserted = 0
    for drive_file in drive_files:
        if (
            drive_file.id in known_ids
            or drive_file.md5_checksum in known_hashes
            or drive_file.name in known_names
        ):
            logger.warning("Imagem duplicada ignorada (id/hash/nome já conhecido): %s", drive_file.name)
            continue

        image = Image(drive_file_id=drive_file.id, file_name=drive_file.name, hash=drive_file.md5_checksum)
        db.add(image)
        try:
            db.commit()
        except IntegrityError:
            db.rollback()
            logger.warning("Imagem duplicada ignorada: %s", drive_file.id)
            continue

        known_ids.add(drive_file.id)
        known_hashes.add(drive_file.md5_checksum)
        known_names.add(drive_file.name)
        inserted += 1

    return inserted
