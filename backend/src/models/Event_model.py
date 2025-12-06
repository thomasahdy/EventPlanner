from pydantic import BaseModel, Field
from bson import ObjectId
from typing import List, Optional
from datetime import datetime

class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, field=None):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return str(v)

class EventParticipant(BaseModel):
    user_id: str
    role: str  # "organizer" or "attendee"
    status: Optional[str] = None  # "Going", "Maybe", "Not Going"
    email: Optional[str] = None  # User email for display

class EventIn(BaseModel):
    title: str
    description: str
    date: datetime
    location: str
    organizer_id: str
    participants: List[EventParticipant] = []

class EventOut(EventIn):
    id: PyObjectId = Field(default_factory=lambda: PyObjectId(""), alias="_id")
    
    class Config:
        allow_population_by_field_name = True
        json_encoders = {ObjectId: str}
    
    def dict(self, **kwargs):
        """Override dict to ensure both id and _id are present"""
        data = super().dict(**kwargs)
        
        if "id" in data and "_id" not in data:
            data["_id"] = data["id"]
        elif "_id" in data and "id" not in data:
            data["id"] = data["_id"]
        return data