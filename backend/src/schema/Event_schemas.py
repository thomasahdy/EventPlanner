from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime

class EventCreateSchema(BaseModel):
    title: str
    description: str
    date: datetime
    location: str

class EventInviteSchema(BaseModel):
    email: EmailStr

class EventResponseSchema(BaseModel):
    status: str  # "Going", "Maybe", "Not Going"

class EventSearchSchema(BaseModel):
    keyword: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    role: Optional[str] = None  # "organizer" or "attendee"