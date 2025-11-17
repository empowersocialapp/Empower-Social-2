"""
User domain model for test mode
"""
from dataclasses import dataclass
from typing import Optional, Dict, List, Any
from datetime import datetime
from .models import Location

@dataclass
class User:
    id: str
    name: Optional[str] = None
    email: Optional[str] = None
    
    # Personality scores
    personality_scores: Optional[Dict[str, float]] = None
    
    # Interests
    interests: Optional[List[str]] = None
    
    # Location
    location: Optional[Location] = None
    
    # Social needs
    social_needs: Optional[Dict[str, Any]] = None
    
    # Motivations
    motivations: Optional[Dict[str, float]] = None
    
    # Affinity groups
    affinity_groups: Optional[List[str]] = None
    
    # Preferences
    preferences: Optional[Dict[str, Any]] = None
    
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

@dataclass
class ABTestResult:
    """A/B test result for learning"""
    user_id: str
    test_id: str
    variant_a_group_id: str
    variant_b_group_id: str
    selected_variant: str  # 'A' or 'B'
    reason: Optional[str] = None
    timestamp: Optional[datetime] = None

