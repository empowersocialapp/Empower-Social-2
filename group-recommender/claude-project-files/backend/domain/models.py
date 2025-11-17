from dataclasses import dataclass
from typing import Optional, List, Dict, Any
from datetime import datetime
from enum import Enum

class GroupType(Enum):
    SOCIAL = "social"
    PROFESSIONAL = "professional"
    HOBBY = "hobby"
    SPORT = "sport"
    VOLUNTEER = "volunteer"
    EDUCATIONAL = "educational"

@dataclass
class Location:
    city: str
    state: str
    coordinates: Optional[tuple] = None  # (lat, lng)
    venue_name: Optional[str] = None
    
    @classmethod
    def from_city_name(cls, city_name: str) -> 'Location':
        """Create Location from just city name"""
        from backend.config.settings import settings
        state = settings._get_state_for_city(city_name)
        return cls(city=city_name, state=state)
    
    @classmethod
    def default(cls) -> 'Location':
        """Get default location from settings"""
        from backend.config.settings import settings
        return cls(
            city=settings.active_city,
            state=settings.active_state
        )

@dataclass
class Group:
    id: str
    name: str
    description: str
    member_count: int
    group_type: GroupType
    location: Location
    source: str  # 'meetup', 'facebook', etc
    url: str
    
    # Personality-matching fields (from your learnings)
    group_size_category: Optional[str] = None  # 'small', 'medium', 'large'
    structure_level: Optional[str] = None      # 'structured', 'flexible', 'semi-structured'
    atmosphere: Optional[str] = None            # 'energetic', 'relaxed', 'intimate'
    newcomer_friendly: Optional[bool] = None
    meeting_frequency: Optional[str] = None     # 'weekly', 'monthly', 'biweekly'
    
    # For embeddings
    embedding: Optional[List[float]] = None
    topics: Optional[List[str]] = None
    
    # Health indicators
    health_score: Optional[int] = None
    last_event_date: Optional[datetime] = None

@dataclass
class UserProfile:
    # Core (from PRD)
    personality_scores: Dict[str, float]  # {'extraversion': 8, 'conscientiousness': 12, ...}
    interests: List[str]
    location: Location
    
    # Enhanced (from your system - optional for MVP)
    motivations: Optional[Dict[str, float]] = None
    social_needs: Optional[Dict[str, Any]] = None
    affinity_groups: Optional[List[str]] = None

# City registry for easy switching
SUPPORTED_CITIES = {
    "sf": {"city": "San Francisco", "state": "CA"},
    "denver": {"city": "Denver", "state": "CO"},
    "dc": {"city": "Washington", "state": "DC"},
    "washington": {"city": "Washington", "state": "DC"},
    "austin": {"city": "Austin", "state": "TX"},
    "nyc": {"city": "New York", "state": "NY"},
}

def get_city_info(city_key: str) -> dict:
    """Get city info by key (sf, denver, dc, etc)"""
    return SUPPORTED_CITIES.get(city_key.lower(), SUPPORTED_CITIES["sf"])

