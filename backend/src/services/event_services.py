from ..db import events_collection, users_collection
from ..models.Event_model import EventIn, EventOut, EventParticipant
from bson import ObjectId
from typing import List, Dict
from datetime import datetime
import re

async def enrich_event_with_emails(event: EventOut) -> EventOut:
    """Enrich event participants with their email addresses"""
    try:
        if not event or not event.participants:
            return event
        
        # Get all unique user IDs and convert to ObjectIds
        user_object_ids = []
        user_id_map = {}  # Maps ObjectId back to string user_id
        
        for participant in event.participants:
            if ObjectId.is_valid(participant.user_id):
                obj_id = ObjectId(participant.user_id)
                user_object_ids.append(obj_id)
                user_id_map[str(obj_id)] = participant.user_id
        
        # Fetch all users at once using $in query
        user_emails: Dict[str, str] = {}
        if user_object_ids:
            async for user in users_collection.find({"_id": {"$in": user_object_ids}}):
                user_id_str = str(user["_id"])
                original_user_id = user_id_map.get(user_id_str, user_id_str)
                user_emails[original_user_id] = user.get("email", "Unknown")
        
        # Enrich participants with emails
        enriched_participants = []
        for participant in event.participants:
            participant_dict = participant.dict()
            participant_dict["email"] = user_emails.get(participant.user_id, "Unknown")
            enriched_participants.append(EventParticipant(**participant_dict))
        
        # Create new event with enriched participants
        event_dict = event.dict(by_alias=False)  # Get field names (id) not aliases (_id)
        event_dict["participants"] = [p.dict() for p in enriched_participants]
        # Ensure both id and _id are present for frontend compatibility
        if "id" in event_dict:
            event_dict["_id"] = event_dict["id"]
        elif "_id" in event_dict:
            event_dict["id"] = event_dict["_id"]
        return EventOut(**event_dict)
    except Exception as e:
        # If enrichment fails, return the original event without emails
        # This ensures the event retrieval doesn't break
        print(f"Warning: Failed to enrich event with emails: {e}")
        return event

async def create_event(event_data: dict, user_id: str) -> EventOut:
    # Add organizer as participant with organizer role
    participant = EventParticipant(
        user_id=user_id,
        role="organizer"
    )
    
    event_dict = event_data.dict()
    event_dict["organizer_id"] = user_id
    event_dict["participants"] = [participant.dict()]
    
    result = await events_collection.insert_one(event_dict)
    event_dict["_id"] = str(result.inserted_id)
    event_dict["id"] = str(result.inserted_id)  # Also set id for frontend compatibility
    
    return EventOut(**event_dict)

async def get_events_by_organizer(user_id: str) -> List[EventOut]:
    events = []
    try:
        cursor = events_collection.find({"organizer_id": user_id})
        async for event in cursor:
            try:
                event["_id"] = str(event["_id"])
                event_obj = EventOut(**event)
                events.append(await enrich_event_with_emails(event_obj))
            except Exception as e:
                print(f"Error processing event in get_events_by_organizer: {e}")
                continue
    except Exception as e:
        print(f"Error in get_events_by_organizer: {e}")
    return events

async def get_events_by_participant(user_id: str) -> List[EventOut]:
    events = []
    try:
        cursor = events_collection.find({"participants.user_id": user_id})
        async for event in cursor:
            try:
                event["_id"] = str(event["_id"])
                event_obj = EventOut(**event)
                events.append(await enrich_event_with_emails(event_obj))
            except Exception as e:
                print(f"Error processing event in get_events_by_participant: {e}")
                continue
    except Exception as e:
        print(f"Error in get_events_by_participant: {e}")
    return events

async def get_event_by_id(event_id: str) -> EventOut:
    if not ObjectId.is_valid(event_id):
        return None
    try:
        event = await events_collection.find_one({"_id": ObjectId(event_id)})
        if event:
            event["_id"] = str(event["_id"])
            event_obj = EventOut(**event)
            return await enrich_event_with_emails(event_obj)
        return None
    except Exception as e:
        print(f"Error getting event by ID {event_id}: {e}")
        return None

async def update_event(event_id: str, event_data: dict) -> EventOut:
    if not ObjectId.is_valid(event_id):
        return None
    result = await events_collection.update_one(
        {"_id": ObjectId(event_id)},
        {"$set": event_data}
    )
    
    if result.modified_count > 0:
        return await get_event_by_id(event_id)
    return None

async def delete_event(event_id: str, user_id: str) -> bool:
    # Check if user is the organizer
    if not ObjectId.is_valid(event_id):
        return False
    event = await events_collection.find_one({
        "_id": ObjectId(event_id),
        "organizer_id": user_id
    })
    
    if event:
        result = await events_collection.delete_one({"_id": ObjectId(event_id)})
        return result.deleted_count > 0
    return False

async def invite_user_to_event(event_id: str, email: str) -> EventOut:
    # First, find the user by email
    user = await users_collection.find_one({"email": email})
    if not user:
        return None
    
    user_id = str(user["_id"])
    
    # Check if user is already invited
    if not ObjectId.is_valid(event_id):
        return None
    event = await events_collection.find_one({
        "_id": ObjectId(event_id),
        "participants.user_id": user_id
    })
    
    if not event:
        # Add user as attendee
        participant = EventParticipant(
            user_id=user_id,
            role="attendee"
        )
        
        result = await events_collection.update_one(
            {"_id": ObjectId(event_id)},
            {"$push": {"participants": participant.dict()}}
        )
        
        if result.modified_count > 0:
            return await get_event_by_id(event_id)
    
    return None

async def join_event(event_id: str, user_id: str) -> EventOut:
    """Allow a user to join an event as an attendee"""
    if not ObjectId.is_valid(event_id):
        return None
    
    # Check if user is already a participant
    event = await events_collection.find_one({
        "_id": ObjectId(event_id),
        "participants.user_id": user_id
    })
    
    if event:
        # User is already a participant
        return await get_event_by_id(event_id)
    
    # Add user as attendee
    participant = EventParticipant(
        user_id=user_id,
        role="attendee"
    )
    
    result = await events_collection.update_one(
        {"_id": ObjectId(event_id)},
        {"$push": {"participants": participant.dict()}}
    )
    
    if result.modified_count > 0:
        return await get_event_by_id(event_id)
    return None

async def update_attendance_status(event_id: str, user_id: str, status: str) -> EventOut:
    if not ObjectId.is_valid(event_id):
        return None
    result = await events_collection.update_one(
        {"_id": ObjectId(event_id), "participants.user_id": user_id},
        {"$set": {"participants.$.status": status}}
    )
    
    if result.modified_count > 0:
        return await get_event_by_id(event_id)
    return None

async def search_events(user_id: str, keyword: str = None, start_date: datetime = None, 
                       end_date: datetime = None, role: str = None) -> List[EventOut]:
    # Build query for all events (not restricted to user participation)
    query = {}
    
    # Add keyword search for both event names and descriptions
    if keyword:
        # Use regex for case-insensitive partial matching
        regex_pattern = re.compile(f".*{re.escape(keyword)}.*", re.IGNORECASE)
        query["$or"] = [
            {"title": {"$regex": regex_pattern}},
            {"description": {"$regex": regex_pattern}}
        ]
    
    # Add date range filters
    date_filter = {}
    if start_date:
        date_filter["$gte"] = start_date
    if end_date:
        date_filter["$lte"] = end_date
    
    if date_filter:
        query["date"] = date_filter
    
    # Add role filter (filter by participant role)
    if role:
        query["participants.role"] = role
    
    events = []
    try:
        cursor = events_collection.find(query).sort("date", 1)  # Sort by date ascending
        async for event in cursor:
            try:
                event["_id"] = str(event["_id"])
                event_obj = EventOut(**event)
                events.append(await enrich_event_with_emails(event_obj))
            except Exception as e:
                print(f"Error processing event in search_events: {e}")
                continue
    except Exception as e:
        print(f"Error in search_events: {e}")
    return events