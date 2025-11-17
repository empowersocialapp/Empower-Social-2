"""
Test mode routes for user profile and A/B testing
"""
from fastapi import APIRouter, HTTPException
from typing import Optional, List
from pydantic import BaseModel
from backend.infrastructure.database import Database
from backend.domain.user import User, ABTestResult, Location
from backend.recommendation.engine import RecommendationEngine
from backend.domain.personality import calculate_personality_scores
import uuid
from datetime import datetime

router = APIRouter()

class UserProfileRequest(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    zipcode: Optional[str] = None
    
    # Personality quiz (raw scores 1-7)
    q1: Optional[int] = None
    q6: Optional[int] = None
    q3: Optional[int] = None
    q8: Optional[int] = None
    q5: Optional[int] = None
    q10: Optional[int] = None
    
    # Social needs
    close_friends: Optional[int] = None
    loneliness: Optional[int] = None  # 1-5
    social_satisfaction: Optional[int] = None  # 1-7
    
    # Motivations (raw scores 1-5)
    m1: Optional[int] = None
    m2: Optional[int] = None
    m3: Optional[int] = None
    m4: Optional[int] = None
    m5: Optional[int] = None
    m6: Optional[int] = None
    
    # Interests
    interest_categories: Optional[List[str]] = None
    interests: Optional[List[str]] = None
    
    # Preferences
    free_time: Optional[str] = None
    travel_distance: Optional[str] = None
    activity_preferences: Optional[List[str]] = None
    
    # Affinity groups
    affinity_groups: Optional[dict] = None

class PersonalityQuizRequest(BaseModel):
    q1: int
    q6: int
    q3: int
    q8: int
    q5: int
    q10: int

class MotivationQuizRequest(BaseModel):
    m1: int
    m2: int
    m3: int
    m4: int
    m5: int
    m6: int

class ABTestRequest(BaseModel):
    user_id: str
    variant_a_group_id: str
    variant_b_group_id: str
    selected_variant: str  # 'A' or 'B'
    reasons: Optional[List[str]] = None  # List of reason codes

def calculate_motivation_scores(m1, m2, m3, m4, m5, m6):
    """Calculate motivation scores from raw quiz responses"""
    intrinsic = (m1 + m4) / 2.0
    social = (m2 + m5) / 2.0
    achievement = (m3 + m6) / 2.0
    return {
        'intrinsic': round(intrinsic, 2),
        'social': round(social, 2),
        'achievement': round(achievement, 2)
    }

def zipcode_to_city_state(zipcode: str) -> tuple:
    """Convert zipcode to city/state (simplified - would use real service in production)"""
    # For test mode, default to San Francisco
    # In production, use a zipcode lookup service
    return ("San Francisco", "CA")

@router.get("/user/{user_id}")
def get_user_profile(user_id: str):
    """Get user profile"""
    db = Database()
    db_user = db.get_user(user_id)
    
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": db_user.id,
        "name": db_user.name,
        "email": db_user.email,
        "age": db_user.preferences.get('age') if db_user.preferences else None,
        "gender": db_user.preferences.get('gender') if db_user.preferences else None,
        "zipcode": db_user.preferences.get('zipcode') if db_user.preferences else None,
        "personality_scores": db_user.personality_scores,
        "interests": db_user.interests,
        "interest_categories": db_user.preferences.get('interest_categories') if db_user.preferences else None,
        "location": {
            "city": db_user.city,
            "state": db_user.state
        },
        "social_needs": db_user.social_needs,
        "motivations": db_user.motivations,
        "affinity_groups": db_user.affinity_groups,
        "preferences": db_user.preferences
    }

@router.post("/user")
def create_user(request: UserProfileRequest):
    """Create user profile"""
    db = Database()
    
    # Generate user ID for new users
    user_id = str(uuid.uuid4())
    
    # Calculate personality scores if quiz provided
    personality_scores = None
    if request.q1 and request.q6 and request.q3 and request.q8 and request.q5 and request.q10:
        quiz = {
            'q1': request.q1,
            'q6': request.q6,
            'q3': request.q3,
            'q8': request.q8,
            'q5': request.q5,
            'q10': request.q10
        }
        personality_scores = calculate_personality_scores(quiz)
    
    # Calculate motivation scores if quiz provided
    motivations = None
    if request.m1 and request.m2 and request.m3 and request.m4 and request.m5 and request.m6:
        motivations = calculate_motivation_scores(
            request.m1, request.m2, request.m3,
            request.m4, request.m5, request.m6
        )
    
    # Determine location
    city = "San Francisco"
    state = "CA"
    if request.zipcode:
        city, state = zipcode_to_city_state(request.zipcode)
    
    # Build preferences dict
    preferences = {}
    if request.age:
        preferences['age'] = request.age
    if request.gender:
        preferences['gender'] = request.gender
    if request.zipcode:
        preferences['zipcode'] = request.zipcode
    if request.free_time:
        preferences['free_time'] = request.free_time
    if request.travel_distance:
        preferences['travel_distance'] = request.travel_distance
    if request.activity_preferences:
        preferences['activity_preferences'] = request.activity_preferences
    if request.interest_categories:
        preferences['interest_categories'] = request.interest_categories
    
    # Build social needs
    social_needs = None
    if request.close_friends is not None or request.loneliness is not None or request.social_satisfaction is not None:
        social_needs = {
            'close_friends_count': request.close_friends,
            'loneliness_frequency': request.loneliness,
            'social_satisfaction': request.social_satisfaction
        }
    
    user = User(
        id=user_id,
        name=request.name,
        email=request.email,
        personality_scores=personality_scores,
        interests=request.interests or [],
        location=Location(city=city, state=state),
        social_needs=social_needs,
        motivations=motivations,
        affinity_groups=request.affinity_groups,
        preferences=preferences
    )
    
    if db.save_user(user):
        return {
            "success": True,
            "user_id": user_id,
            "message": "User profile saved"
        }
    else:
        raise HTTPException(status_code=500, detail="Failed to save user profile")

@router.put("/user/{user_id}")
def update_user(user_id: str, request: UserProfileRequest):
    """Update existing user profile"""
    db = Database()
    
    # Check if user exists
    existing = db.get_user(user_id)
    if not existing:
        # Create new user if doesn't exist
        user = User(
            id=user_id,
            name=request.name,
            email=request.email,
            personality_scores=None,
            interests=request.interests or [],
            location=Location(city="San Francisco", state="CA"),
            social_needs=None,
            motivations=None,
            affinity_groups=request.affinity_groups,
            preferences={}
        )
        if db.save_user(user):
            return {
                "success": True,
                "user_id": user_id,
                "message": "User profile created"
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to create user profile")
    
    # Calculate personality scores if quiz provided
    personality_scores = existing.personality_scores
    if request.q1 and request.q6 and request.q3 and request.q8 and request.q5 and request.q10:
        quiz = {
            'q1': request.q1,
            'q6': request.q6,
            'q3': request.q3,
            'q8': request.q8,
            'q5': request.q5,
            'q10': request.q10
        }
        personality_scores = calculate_personality_scores(quiz)
    
    # Calculate motivation scores if quiz provided
    motivations = existing.motivations
    if request.m1 and request.m2 and request.m3 and request.m4 and request.m5 and request.m6:
        motivations = calculate_motivation_scores(
            request.m1, request.m2, request.m3,
            request.m4, request.m5, request.m6
        )
    
    # Determine location
    city = existing.city or "San Francisco"
    state = existing.state or "CA"
    if request.zipcode:
        city, state = zipcode_to_city_state(request.zipcode)
    
    # Merge preferences
    preferences = existing.preferences or {}
    if request.age is not None:
        preferences['age'] = request.age
    if request.gender:
        preferences['gender'] = request.gender
    if request.zipcode:
        preferences['zipcode'] = request.zipcode
    if request.free_time:
        preferences['free_time'] = request.free_time
    if request.travel_distance:
        preferences['travel_distance'] = request.travel_distance
    if request.activity_preferences:
        preferences['activity_preferences'] = request.activity_preferences
    if request.interest_categories:
        preferences['interest_categories'] = request.interest_categories
    
    # Merge social needs
    social_needs = existing.social_needs or {}
    if request.close_friends is not None:
        social_needs['close_friends_count'] = request.close_friends
    if request.loneliness is not None:
        social_needs['loneliness_frequency'] = request.loneliness
    if request.social_satisfaction is not None:
        social_needs['social_satisfaction'] = request.social_satisfaction
    
    user = User(
        id=user_id,
        name=request.name if request.name else existing.name,
        email=request.email if request.email else existing.email,
        personality_scores=personality_scores,
        interests=request.interests if request.interests else (existing.interests or []),
        location=Location(city=city, state=state),
        social_needs=social_needs if social_needs else None,
        motivations=motivations,
        affinity_groups=request.affinity_groups if request.affinity_groups else existing.affinity_groups,
        preferences=preferences
    )
    
    if db.save_user(user):
        return {
            "success": True,
            "user_id": user_id,
            "message": "User profile updated"
        }
    else:
        raise HTTPException(status_code=500, detail="Failed to update user profile")

@router.post("/personality-quiz")
def calculate_personality_from_quiz(request: PersonalityQuizRequest):
    """Calculate personality scores from quiz"""
    quiz = {
        'q1': request.q1,
        'q6': request.q6,
        'q3': request.q3,
        'q8': request.q8,
        'q5': request.q5,
        'q10': request.q10
    }
    
    scores = calculate_personality_scores(quiz)
    
    return {
        "success": True,
        "personality_scores": scores
    }

@router.post("/motivation-quiz")
def calculate_motivation_from_quiz(request: MotivationQuizRequest):
    """Calculate motivation scores from quiz"""
    scores = calculate_motivation_scores(
        request.m1, request.m2, request.m3,
        request.m4, request.m5, request.m6
    )
    
    return {
        "success": True,
        "motivation_scores": scores
    }

@router.get("/recommendations/{user_id}")
def get_recommendations_for_ab_test(user_id: str, count: int = 2):
    """
    Get recommendations for A/B testing
    Returns pairs of recommendations for comparison
    """
    db = Database()
    engine = RecommendationEngine()
    
    # Get user profile
    db_user = db.get_user(user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found. Please create a profile first.")
    
    # Convert to UserProfile
    from backend.domain.models import UserProfile
    user_profile = UserProfile(
        personality_scores=db_user.personality_scores or {'extraversion': 10, 'conscientiousness': 10, 'openness': 8},
        interests=db_user.interests or [],
        location=Location(city=db_user.city or "San Francisco", state=db_user.state or "CA"),
        social_needs=db_user.social_needs,
        motivations=db_user.motivations
    )
    
    # Get recommendations (pass user_id for learning)
    all_recs = engine.recommend(user_profile, top_k=count * 2, user_id=user_id)
    
    # Get learned weights for display
    learned_weights = engine.learning.get_learned_weights(user_id)
    
    # Pair them for A/B testing
    ab_pairs = []
    for i in range(0, min(len(all_recs), count * 2), 2):
        if i + 1 < len(all_recs):
            # Use actual weights from the recommendation (which may be learned)
            weights_a = all_recs[i].get('weights_used', learned_weights)
            weights_b = all_recs[i + 1].get('weights_used', learned_weights)
            
            pair = {
                "test_id": str(uuid.uuid4()),
                "variant_a": {
                    "group_id": all_recs[i]['group'].id,
                    "name": all_recs[i]['group'].name,
                    "description": all_recs[i]['group'].description,
                    "member_count": all_recs[i]['group'].member_count,
                    "group_size_category": all_recs[i]['group'].group_size_category,
                    "structure_level": all_recs[i]['group'].structure_level,
                    "atmosphere": all_recs[i]['group'].atmosphere,
                    "newcomer_friendly": all_recs[i]['group'].newcomer_friendly,
                    "meeting_frequency": all_recs[i]['group'].meeting_frequency,
                    "scores": {
                        "final": round(all_recs[i]['final_score'], 4),
                        "personality": {
                            "overall": round(all_recs[i]['personality_score'], 4),
                            "components": {
                                "extraversion": round(all_recs[i]['personality_components'].get('extraversion', 0.5), 4),
                                "conscientiousness": round(all_recs[i]['personality_components'].get('conscientiousness', 0.5), 4),
                                "openness": round(all_recs[i]['personality_components'].get('openness', 0.5), 4),
                                "social_needs": round(all_recs[i]['personality_components'].get('social_needs', 0.5), 4),
                                "motivations": round(all_recs[i]['personality_components'].get('motivations', 0.5), 4)
                            }
                        },
                        "interest": round(all_recs[i]['interest_score'], 4),
                        "social_needs": round(all_recs[i]['social_needs_score'], 4),
                        "motivations": round(all_recs[i]['motivations_score'], 4),
                        "breakdown": {
                            "personality_weighted": round(all_recs[i]['personality_score'] * weights_a['personality'], 4),
                            "interest_weighted": round(all_recs[i]['interest_score'] * weights_a['interest'], 4),
                            "social_needs_weighted": round(all_recs[i]['social_needs_score'] * weights_a['social_needs'], 4),
                            "motivations_weighted": round(all_recs[i]['motivations_score'] * weights_a['motivations'], 4)
                        },
                        "weights_used": weights_a
                    }
                },
                "variant_b": {
                    "group_id": all_recs[i + 1]['group'].id,
                    "name": all_recs[i + 1]['group'].name,
                    "description": all_recs[i + 1]['group'].description,
                    "member_count": all_recs[i + 1]['group'].member_count,
                    "group_size_category": all_recs[i + 1]['group'].group_size_category,
                    "structure_level": all_recs[i + 1]['group'].structure_level,
                    "atmosphere": all_recs[i + 1]['group'].atmosphere,
                    "newcomer_friendly": all_recs[i + 1]['group'].newcomer_friendly,
                    "meeting_frequency": all_recs[i + 1]['group'].meeting_frequency,
                    "scores": {
                        "final": round(all_recs[i + 1]['final_score'], 4),
                        "personality": {
                            "overall": round(all_recs[i + 1]['personality_score'], 4),
                            "components": {
                                "extraversion": round(all_recs[i + 1]['personality_components'].get('extraversion', 0.5), 4),
                                "conscientiousness": round(all_recs[i + 1]['personality_components'].get('conscientiousness', 0.5), 4),
                                "openness": round(all_recs[i + 1]['personality_components'].get('openness', 0.5), 4),
                                "social_needs": round(all_recs[i + 1]['personality_components'].get('social_needs', 0.5), 4),
                                "motivations": round(all_recs[i + 1]['personality_components'].get('motivations', 0.5), 4)
                            }
                        },
                        "interest": round(all_recs[i + 1]['interest_score'], 4),
                        "social_needs": round(all_recs[i + 1]['social_needs_score'], 4),
                        "motivations": round(all_recs[i + 1]['motivations_score'], 4),
                        "breakdown": {
                            "personality_weighted": round(all_recs[i + 1]['personality_score'] * weights_b['personality'], 4),
                            "interest_weighted": round(all_recs[i + 1]['interest_score'] * weights_b['interest'], 4),
                            "social_needs_weighted": round(all_recs[i + 1]['social_needs_score'] * weights_b['social_needs'], 4),
                            "motivations_weighted": round(all_recs[i + 1]['motivations_score'] * weights_b['motivations'], 4)
                        },
                        "weights_used": weights_b
                    }
                }
            }
            ab_pairs.append(pair)
    
    # Get feedback summary for display
    feedback_summary = engine.learning.get_feedback_summary(user_id)
    
    # Get excluded count from metadata (if any)
    excluded_count = 0
    if all_recs and len(all_recs) > 0 and '_metadata' in all_recs[0]:
        excluded_count = all_recs[0]['_metadata'].get('excluded_count', 0)
    
    return {
        "user_id": user_id,
        "pairs": ab_pairs,
        "count": len(ab_pairs),
        "excluded_groups_count": excluded_count,
        "learning": {
            "has_learned_weights": feedback_summary['has_learned_weights'],
            "learned_weights": learned_weights,
            "default_weights": feedback_summary['default_weights'],
            "total_feedback": feedback_summary['total_feedback'],
            "with_reasons": feedback_summary['with_reasons']
        }
    }

@router.post("/ab-test")
def save_ab_test_result(request: ABTestRequest):
    """Save A/B test result for learning"""
    import json
    db = Database()
    
    # Store reasons as JSON string if provided
    reason_str = None
    if request.reasons and len(request.reasons) > 0:
        reason_str = json.dumps(request.reasons)
    
    ab_result = ABTestResult(
        user_id=request.user_id,
        test_id=str(uuid.uuid4()),
        variant_a_group_id=request.variant_a_group_id,
        variant_b_group_id=request.variant_b_group_id,
        selected_variant=request.selected_variant.upper(),
        reason=reason_str,
        timestamp=datetime.now()
    )
    
    if db.save_ab_test_result(ab_result):
        return {
            "success": True,
            "test_id": ab_result.test_id,
            "message": "A/B test result saved"
        }
    else:
        raise HTTPException(status_code=500, detail="Failed to save A/B test result")

@router.get("/ab-test/results")
def get_ab_test_results(user_id: Optional[str] = None):
    """Get A/B test results for analysis"""
    import json
    db = Database()
    results = db.get_ab_test_results(user_id=user_id)
    
    # Parse reasons from JSON string back to list
    parsed_results = []
    for result in results:
        reasons = None
        if result.reason:
            try:
                reasons = json.loads(result.reason)
            except:
                # Legacy: if it's not JSON, treat as single string
                reasons = [result.reason] if result.reason else None
        
        parsed_results.append({
            "id": result.id,
            "user_id": result.user_id,
            "test_id": result.test_id,
            "variant_a_group_id": result.variant_a_group_id,
            "variant_b_group_id": result.variant_b_group_id,
            "selected_variant": result.selected_variant,
            "reasons": reasons,
            "created_at": result.created_at.isoformat() if result.created_at else None
        })
    
    return {
        "count": len(parsed_results),
        "results": parsed_results
    }
