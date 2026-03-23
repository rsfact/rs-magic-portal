""" RS Method - Logger v1.0.0"""
import logging
import os
import sys
from logging import Formatter, StreamHandler
from logging.handlers import RotatingFileHandler

from app.core.settings import settings


os.makedirs(settings.LOG_DIR, exist_ok=True)

LOG_FORMAT = (
    "%(asctime)s | %(levelname)-8s | %(filename)s.%(funcName)s:%(lineno)d | %(message)s"
)


def create_logger() -> logging.Logger:
    logger = logging.getLogger("logger")
    logger.setLevel(logging.DEBUG)

    console_handler = StreamHandler(sys.stdout)
    console_handler.setFormatter(Formatter(LOG_FORMAT))
    console_handler.setLevel(logging.INFO)

    file_handler = RotatingFileHandler(
        settings.LOG_FILE,
        maxBytes=10 * 1024 * 1024,
        backupCount=5,
        encoding="utf-8",
    )
    file_handler.setFormatter(Formatter(LOG_FORMAT))
    file_handler.setLevel(logging.DEBUG)

    logger.handlers.clear()
    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

    return logger


logger = create_logger()
