from app.exceptions import base as err


class TaskNotFound(err.NotFound):
    def __init__(self):
        super().__init__(msg="Task not found.")
