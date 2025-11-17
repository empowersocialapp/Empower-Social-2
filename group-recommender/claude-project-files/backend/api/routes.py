from fastapi import APIRouter, Query, HTTPException
from typing import Optional, List
from pydantic import BaseModel
from backend.config.settings import settings
from backend.infrastructure.database import Database
from backend.recommendation.engine import RecommendationEngine
from backend.domain.models import UserProfile, Location

router = APIRouter()

class PersonalityScores(BaseModel):
    extraversion: float
    conscientiousness: float
    openness: float

class SocialNeeds(BaseModel):
    loneliness_frequency: Optional[int] = None
    close_friends_count: Optional[int] = None
    social_satisfaction: Optional[int] = None

class Motivations(BaseModel):
    intrinsic: Optional[float] = None
    social: Optional[float] = None
    achievement: Optional[float] = None

class RecommendationRequest(BaseModel):
    personality_scores: PersonalityScores
    interests: List[str]
    city: Optional[str] = None
    social_needs: Optional[SocialNeeds] = None
    motivations: Optional[Motivations] = None

@router.get("/groups")
def list_groups(
    city: Optional[str] = Query(None, description="City name (defaults to configured city)")
):
    """
    List groups for a city
    
    Examples:
        /api/groups?city=San Francisco
        /api/groups?city=Denver
        /api/groups?city=Washington DC
    """
    db = Database()
    city = city or settings.active_city
    groups = db.get_groups_by_city(city)
    
    return {
        "city": city,
        "count": len(groups),
        "groups": [
            {
                "id": g.id,
                "name": g.name,
                "description": g.description[:100] + "..." if len(g.description) > 100 else g.description,
                "member_count": g.member_count,
                "group_type": g.group_type,
                "group_size_category": g.group_size_category,
                "url": g.url
            }
            for g in groups
        ]
    }

@router.get("/groups/{group_id}")
def get_group(group_id: str):
    """Get specific group details"""
    db = Database()
    db_group = db.get_group_by_id(group_id)
    
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")
    
    group = db.db_to_domain(db_group)
    
    return {
        "id": group.id,
        "name": group.name,
        "description": group.description,
        "member_count": group.member_count,
        "group_type": group.group_type.value,
        "location": {
            "city": group.location.city,
            "state": group.location.state
        },
        "group_size_category": group.group_size_category,
        "structure_level": group.structure_level,
        "atmosphere": group.atmosphere,
        "meeting_frequency": group.meeting_frequency,
        "newcomer_friendly": group.newcomer_friendly,
        "url": group.url
    }

@router.post("/recommend")
def recommend_groups(request: RecommendationRequest):
    """
    Get recommendations for any city
    
    Body:
        {
            "personality_scores": {"extraversion": 10, "conscientiousness": 12, "openness": 8},
            "interests": ["running", "fitness"],
            "city": "Denver"  # Optional
        }
    """
    engine = RecommendationEngine()
    city = request.city or settings.active_city
    state = settings._get_state_for_city(city)
    
    # Build social needs dict if provided
    social_needs = None
    if request.social_needs:
        social_needs = {
            'loneliness_frequency': request.social_needs.loneliness_frequency,
            'close_friends_count': request.social_needs.close_friends_count,
            'social_satisfaction': request.social_needs.social_satisfaction
        }
    
    # Build motivations dict if provided
    motivations = None
    if request.motivations:
        motivations = {
            'intrinsic': request.motivations.intrinsic,
            'social': request.motivations.social,
            'achievement': request.motivations.achievement
        }
    
    user_profile = UserProfile(
        personality_scores={
            'extraversion': request.personality_scores.extraversion,
            'conscientiousness': request.personality_scores.conscientiousness,
            'openness': request.personality_scores.openness
        },
        interests=request.interests,
        location=Location(city=city, state=state),
        social_needs=social_needs,
        motivations=motivations
    )
    
    recommendations = engine.recommend(user_profile, top_k=10)
    
    return {
        "city": city,
        "count": len(recommendations),
        "recommendations": [
            {
                "group": {
                    "id": r['group'].id,
                    "name": r['group'].name,
                    "description": r['group'].description,
                    "member_count": r['group'].member_count,
                    "url": r['group'].url
                },
                "scores": {
                    "personality": r['personality_score'],
                    "personality_components": r.get('personality_components', {}),
                    "interest": r['interest_score'],
                    "social_needs": r.get('social_needs_score', 0.5),
                    "motivations": r.get('motivations_score', 0.5),
                    "final": r['final_score']
                }
            }
            for r in recommendations
        ]
    }

@router.post("/personality-quiz")
def calculate_personality(quiz_responses: dict):
    """
    Calculate personality scores from quiz responses
    
    Body:
        {
            "q1": 5, "q6": 3,
            "q3": 6, "q8": 2,
            "q5": 7, "q10": 1
        }
    """
    from backend.domain.personality import calculate_personality_scores
    
    try:
        scores = calculate_personality_scores(quiz_responses)
        return {
            "success": True,
            "personality_scores": scores
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error calculating scores: {str(e)}")

