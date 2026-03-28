from app.exceptions import base as err


class AppNotFound(err.NotFound):
    def __init__(self):
        super().__init__(msg="App not found.")
