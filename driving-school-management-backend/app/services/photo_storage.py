"""Photo upload/download helpers."""
import os
import uuid

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings

ALLOWED_PHOTO_EXTS = {".jpg", ".jpeg", ".png"}


def save_photo(photo: UploadFile) -> str:
    """Save an uploaded photo and return its relative path.

    The path returned is relative to the project root (e.g. ``uploads/photos/abc.png``)
    so it can be served by the static mount and stored in the database.
    """
    ext = os.path.splitext(photo.filename or "")[1].lower()
    if ext not in ALLOWED_PHOTO_EXTS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only JPG and PNG images are allowed.",
        )

    os.makedirs(settings.PHOTO_DIR, exist_ok=True)
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(settings.PHOTO_DIR, filename)

    content = photo.file.read()
    if len(content) > settings.MAX_PHOTO_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Photo exceeds max size of {settings.MAX_PHOTO_SIZE_BYTES // (1024 * 1024)} MB.",
        )
    with open(filepath, "wb") as f:
        f.write(content)
    return filepath


def delete_photo(photo_path: str | None) -> None:
    """Remove a photo file from disk if it exists."""
    if not photo_path:
        return
    if os.path.exists(photo_path):
        try:
            os.remove(photo_path)
        except OSError:
            pass
