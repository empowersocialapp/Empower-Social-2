from sqlalchemy import create_engine, Column, String, Integer, Text, Float, Boolean, DateTime, JSON
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timezone
from typing import List, Optional
from backend.domain.models import Group, Location, GroupType

Base = declarative_base()

class GroupModel(Base):
    __tablename__ = 'groups'
    
    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)
    description = Column(Text)
    member_count = Column(Integer)
    group_type = Column(String)
    city = Column(String)
    state = Column(String)
    source = Column(String)
    url = Column(String)
    
    # Personality-matching fields
    group_size_category = Column(String)
    structure_level = Column(String)
    atmosphere = Column(String)
    newcomer_friendly = Column(Boolean)
    meeting_frequency = Column(String)
    
    # Embeddings
    embedding = Column(JSON)
    topics = Column(JSON)
    
    # Health
    health_score = Column(Integer)
    last_event_date = Column(DateTime)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class UserModel(Base):
    __tablename__ = 'users'
    
    id = Column(String, primary_key=True)
    name = Column(String)
    email = Column(String)
    
    # Personality scores (JSON)
    personality_scores = Column(JSON)
    
    # Interests (JSON array)
    interests = Column(JSON)
    
    # Location
    city = Column(String)
    state = Column(String)
    
    # Social needs (JSON)
    social_needs = Column(JSON)
    
    # Motivations (JSON)
    motivations = Column(JSON)
    
    # Affinity groups (JSON array)
    affinity_groups = Column(JSON)
    
    # Preferences (JSON)
    preferences = Column(JSON)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

class ABTestResultModel(Base):
    __tablename__ = 'ab_test_results'
    
    id = Column(String, primary_key=True)
    user_id = Column(String, nullable=False)
    test_id = Column(String, nullable=False)
    variant_a_group_id = Column(String, nullable=False)
    variant_b_group_id = Column(String, nullable=False)
    selected_variant = Column(String, nullable=False)  # 'A' or 'B'
    reason = Column(Text)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

class Database:
    def __init__(self, db_url: str = None):
        from backend.config.settings import settings
        self.db_url = db_url or settings.database_url
        self.engine = create_engine(self.db_url)
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
    
    def save_group(self, group: Group) -> bool:
        """Convert domain Group to DB model and save"""
        session = self.Session()
        try:
            db_group = GroupModel(
                id=group.id,
                name=group.name,
                description=group.description,
                member_count=group.member_count,
                group_type=group.group_type.value,
                city=group.location.city,
                state=group.location.state,
                source=group.source,
                url=group.url,
                group_size_category=group.group_size_category,
                structure_level=group.structure_level,
                atmosphere=group.atmosphere,
                newcomer_friendly=group.newcomer_friendly,
                meeting_frequency=group.meeting_frequency,
                embedding=group.embedding,
                topics=group.topics,
                health_score=group.health_score,
                last_event_date=group.last_event_date
            )
            session.merge(db_group)  # Use merge to handle updates
            session.commit()
            return True
        except Exception as e:
            session.rollback()
            print(f"Error saving group: {e}")
            return False
        finally:
            session.close()
    
    def get_groups_by_city(self, city: str) -> List[GroupModel]:
        """Get all groups for a city"""
        session = self.Session()
        try:
            return session.query(GroupModel).filter(GroupModel.city == city).all()
        finally:
            session.close()
    
    def get_group_by_id(self, group_id: str) -> Optional[GroupModel]:
        """Get a specific group by ID"""
        session = self.Session()
        try:
            return session.query(GroupModel).filter(GroupModel.id == group_id).first()
        finally:
            session.close()
    
    def save_user(self, user) -> bool:
        """Save user profile"""
        from backend.domain.user import User
        session = self.Session()
        try:
            db_user = UserModel(
                id=user.id,
                name=user.name,
                email=user.email,
                personality_scores=user.personality_scores,
                interests=user.interests,
                city=user.location.city if user.location else None,
                state=user.location.state if user.location else None,
                social_needs=user.social_needs,
                motivations=user.motivations,
                affinity_groups=user.affinity_groups,
                preferences=user.preferences
            )
            session.merge(db_user)
            session.commit()
            return True
        except Exception as e:
            session.rollback()
            print(f"Error saving user: {e}")
            return False
        finally:
            session.close()
    
    def get_user(self, user_id: str) -> Optional[UserModel]:
        """Get user by ID"""
        session = self.Session()
        try:
            return session.query(UserModel).filter(UserModel.id == user_id).first()
        finally:
            session.close()
    
    def save_ab_test_result(self, ab_result) -> bool:
        """Save A/B test result"""
        import uuid
        session = self.Session()
        try:
            db_result = ABTestResultModel(
                id=str(uuid.uuid4()),
                user_id=ab_result.user_id,
                test_id=ab_result.test_id,
                variant_a_group_id=ab_result.variant_a_group_id,
                variant_b_group_id=ab_result.variant_b_group_id,
                selected_variant=ab_result.selected_variant,
                reason=ab_result.reason
            )
            session.add(db_result)
            session.commit()
            return True
        except Exception as e:
            session.rollback()
            print(f"Error saving AB test result: {e}")
            return False
        finally:
            session.close()
    
    def get_ab_test_results(self, user_id: str = None) -> List[ABTestResultModel]:
        """Get A/B test results, optionally filtered by user"""
        session = self.Session()
        try:
            query = session.query(ABTestResultModel)
            if user_id:
                query = query.filter(ABTestResultModel.user_id == user_id)
            return query.order_by(ABTestResultModel.created_at.desc()).all()
        finally:
            session.close()
    
    def db_to_domain(self, db_group: GroupModel) -> Group:
        """Convert DB model to domain model"""
        return Group(
            id=db_group.id,
            name=db_group.name,
            description=db_group.description or "",
            member_count=db_group.member_count or 0,
            group_type=GroupType(db_group.group_type) if db_group.group_type else GroupType.SOCIAL,
            location=Location(city=db_group.city, state=db_group.state),
            source=db_group.source or "unknown",
            url=db_group.url or "",
            group_size_category=db_group.group_size_category,
            structure_level=db_group.structure_level,
            atmosphere=db_group.atmosphere,
            newcomer_friendly=db_group.newcomer_friendly,
            meeting_frequency=db_group.meeting_frequency,
            embedding=db_group.embedding,
            topics=db_group.topics,
            health_score=db_group.health_score,
            last_event_date=db_group.last_event_date
        )

