""" RS Method - Base Exception v1.0.0"""
import re


class Base(Exception):
    status_code: int
    def __init__(self, msg: str):
        self.msg = msg
        self.error_code = self._camel_to_snake()
        super().__init__(self.msg)

    def _camel_to_snake(self) -> str:
        code = re.sub(r'([A-Z]+)([A-Z][a-z])', r'\1_\2', self.__class__.__name__)
        code = re.sub(r'([a-z\d])([A-Z])', r'\1_\2', code)
        return code.upper()


class Internal(Base):
    status_code = 500


class NotFound(Base):
    status_code = 404


class Conflict(Base):
    status_code = 409


class Authentication(Base):
    status_code = 401


class Authorization(Base):
    status_code = 403


class Validation(Base):
    status_code = 400
