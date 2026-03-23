from sqlalchemy.orm import Session

from app.core import auth
from app.cruds import task as crud
from app.exceptions import task as err
from app.models.task import Task
from app.schemas import auth as auth_schema
from app.schemas import task as schema
from app.services import translate as translate_service


def create(req: schema.ReqCreate, user: auth_schema.ResUserGet, db: Session) -> schema.ResCreate:
    translated = translate_service.translate(q=req.content)

    task = Task(
        user_id=user.id,
        content=f"{req.content}\n{translated.text}"
    )

    task = crud.create(db, task)
    db.commit()
    db.refresh(task)

    return schema.ResCreate.model_validate(task)


def get(id: str, user: auth_schema.ResUserGet, db: Session) -> schema.ResGet:
    task = crud.get_by_id(db, user.id, id=id)
    if not task:
        raise err.TaskNotFound

    return schema.ResGet.model_validate(task)


def search(req: schema.ReqSearch, user: auth_schema.ResUserGet, db: Session) -> schema.ResSearch:
    tasks, total = crud.get_paginated(db, user.id, page=req.page, size=req.size)
    items = [schema.SearchItem.model_validate(task) for task in tasks]

    return schema.ResSearch.paginate(items=items, total=total, page=req.page, size=req.size)


def update(id: str, req: schema.ReqUpdate, user: auth_schema.ResUserGet, db: Session) -> schema.ResUpdate:
    task = crud.get_by_id(db, user.id, id=id)
    if not task:
        raise err.TaskNotFound

    if req.content is not None:
        task.content = req.content

    task = crud.update(db, task=task)
    db.commit()
    db.refresh(task)

    return schema.ResUpdate.model_validate(task)


def delete(id: str, user: auth_schema.ResUserGet, db: Session) -> schema.ResDelete:
    task = crud.get_by_id(db, user.id, id=id)
    if not task:
        raise err.TaskNotFound

    crud.delete_by_id(db, user.id, id=task.id)
    db.commit()

    return schema.ResDelete()
