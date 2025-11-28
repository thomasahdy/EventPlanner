from pydantic import BaseModel, Field, EmailStr
from bson import ObjectId

class PyObjectId(str):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, field=None):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return str(v)

class UserIn(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    id: PyObjectId = Field(default_factory=lambda: PyObjectId(""), alias="_id")
    email: EmailStr

    class Config:
        allow_population_by_field_name = True
        json_encoders = {ObjectId: str}