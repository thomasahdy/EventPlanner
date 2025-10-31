from fastapi import APIRouter, HTTPException, status, Depends
from ..schema.User_schemas import SignupSchema, LoginSchema, Token
from ..db import users_collection
from ..services.user__services import hash_password, verify_password, create_access_token
from motor.motor_asyncio import AsyncIOMotorCollection
from pydantic import EmailStr

router = APIRouter()

@router.post("/signup", response_model=Token, status_code=status.HTTP_201_CREATED)
async def signup(user: SignupSchema):
    # check existing
    existing = await users_collection.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = hash_password(user.password)
    doc = {"email": user.email, "password": hashed, "created_at": None}
    res = await users_collection.insert_one(doc)
    token = create_access_token(str(res.inserted_id))
    return {"access_token": token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
async def login(credentials: LoginSchema):
    user = await users_collection.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(str(user["_id"]))
    return {"access_token": token, "token_type": "bearer"}
