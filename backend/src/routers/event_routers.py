from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from ..schema.Event_schemas import EventCreateSchema, EventInviteSchema, EventResponseSchema, EventSearchSchema
from ..services.event_services import (
    create_event, get_events_by_organizer, get_events_by_participant, 
    get_event_by_id, delete_event, invite_user_to_event, 
    update_attendance_status, search_events, join_event
)
from ..services.user__services import decode_token
from ..db import users_collection
from typing import List

router = APIRouter(prefix="/api/events")
security = HTTPBearer()

# Helper function to get user from token
async def get_current_user_id(credentials: HTTPAuthorizationCredentials = Depends(security)) -> str:
    token = credentials.credentials
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_new_event(event: EventCreateSchema, user_id: str = Depends(get_current_user_id)):
    try:
        new_event = await create_event(event, user_id)
        return {"event": new_event, "message": "Event created successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/organized")
async def get_organized_events(user_id: str = Depends(get_current_user_id)):
    try:
        events = await get_events_by_organizer(user_id)
        return {"events": events}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/invited")
async def get_invited_events(user_id: str = Depends(get_current_user_id)):
    try:
        events = await get_events_by_participant(user_id)
        return {"events": events}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{event_id}")
async def get_single_event(event_id: str, user_id: str = Depends(get_current_user_id)):
    try:
        event = await get_event_by_id(event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Allow public viewing - users can see event details even if not participants
        # This enables search functionality where users can discover and join events
        return {"event": event}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{event_id}")
async def delete_existing_event(event_id: str, user_id: str = Depends(get_current_user_id)):
    try:
        deleted = await delete_event(event_id, user_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Event not found or you don't have permission to delete it")
        return {"message": "Event deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{event_id}/invite")
async def invite_user(event_id: str, invite_data: EventInviteSchema, user_id: str = Depends(get_current_user_id)):
    try:
        # First check if the event exists and user has permission to invite
        event = await get_event_by_id(event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        # Check if current user is the organizer
        if event.organizer_id != user_id:
            raise HTTPException(status_code=403, detail="Only organizers can invite users")
        
        updated_event = await invite_user_to_event(event_id, invite_data.email)
        if not updated_event:
            raise HTTPException(status_code=400, detail="User not found or already invited")
            
        return {"event": updated_event, "message": "User invited successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{event_id}/join")
async def join_event_endpoint(event_id: str, user_id: str = Depends(get_current_user_id)):
    """Allow a user to join an event as an attendee"""
    try:
        event = await get_event_by_id(event_id)
        if not event:
            raise HTTPException(status_code=404, detail="Event not found")
        
        updated_event = await join_event(event_id, user_id)
        if not updated_event:
            raise HTTPException(status_code=400, detail="Failed to join event")
        
        return {"event": updated_event, "message": "Successfully joined event"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{event_id}/response")
async def update_response(event_id: str, response: EventResponseSchema, user_id: str = Depends(get_current_user_id)):
    try:
        updated_event = await update_attendance_status(event_id, user_id, response.status)
        if not updated_event:
            raise HTTPException(status_code=404, detail="Event not found or you're not a participant")
        return {"event": updated_event, "message": "Response updated successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/search")
async def search_events_endpoint(search_params: EventSearchSchema, user_id: str = Depends(get_current_user_id)):
    try:
        events = await search_events(
            user_id=user_id,
            keyword=search_params.keyword,
            start_date=search_params.start_date,
            end_date=search_params.end_date,
            role=search_params.role
        )
        return {"events": events}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))