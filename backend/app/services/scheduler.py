import logging

from apscheduler.schedulers.background import BackgroundScheduler

from app.core.config import get_settings
from app.services import drive_sync_service

logger = logging.getLogger(__name__)

_scheduler = BackgroundScheduler()


def _run_sync(session_factory) -> None:
    db = session_factory()
    try:
        inserted = drive_sync_service.sync_pending_images(db)
        if inserted:
            logger.info("Drive sync: %d imagem(ns) nova(s) marcada(s) como pending", inserted)
    except Exception:
        logger.exception("Falha ao sincronizar imagens do Drive")
    finally:
        db.close()


def start_scheduler(session_factory) -> None:
    settings = get_settings()
    _scheduler.add_job(
        _run_sync,
        "interval",
        seconds=settings.drive_poll_interval_seconds,
        args=[session_factory],
        id="drive_sync",
        replace_existing=True,
    )
    _scheduler.start()
    # roda uma vez de imediato, sem esperar o primeiro intervalo
    _run_sync(session_factory)


def stop_scheduler() -> None:
    if _scheduler.running:
        _scheduler.shutdown(wait=False)
