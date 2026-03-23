from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.task import Task


def create(db: Session, task: Task) -> Task:
    db.add(task)
    db.flush()
    db.refresh(task)
    return task


def get_by_id(db: Session, user_id: str, id: str) -> Optional[Task]:
    return db.query(Task).filter(Task.user_id == user_id, Task.id == id).first()


def get_paginated(
    db: Session, user_id: str, page: int, size: int
) -> tuple[List[Task], int]:
    skip = (page - 1) * size
    query = db.query(Task).filter(Task.user_id == user_id)
    return (
        query.order_by(Task.created_at.desc()).offset(skip).limit(size).all(),
        query.count(),
    )


def update(db: Session, task: Task) -> Task:
    db.add(task)
    db.flush()
    db.refresh(task)
    return task


def delete_by_id(db: Session, user_id: str, id: str) -> None:
    task = db.query(Task).filter(Task.user_id == user_id, Task.id == id).first()
    if task:
        db.delete(task)
