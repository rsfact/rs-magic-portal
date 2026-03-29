from datetime import datetime, timezone
import uuid

from sqlalchemy import Column, String, ForeignKey, Boolean, Integer, DateTime
from sqlalchemy.orm import relationship

from app.models.base import Base


class App(Base):
    __tablename__ = "apps"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    name = Column(String(255), nullable=False)
    description = Column(String(512), nullable=False)
    url = Column(String(1024), nullable=False)
    fa_icon = Column(String, nullable=True)
    is_send_token_enabled = Column(Boolean, default=False, nullable=False)
    # is_locked = Column(Boolean, default=False, nullable=False)
    # price = Column(Integer, default=0, nullable=False)
    position = Column(Integer, nullable=False)
    tenant_id = Column(String(36), ForeignKey("tenants.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)

    user = relationship("User", back_populates="apps")
    tenant = relationship("Tenant", back_populates="apps")
