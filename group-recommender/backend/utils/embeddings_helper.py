"""
Helper utilities for generating embeddings for existing groups
"""
from backend.infrastructure.database import Database
from backend.recommendation.embeddings import EmbeddingService

def generate_embeddings_for_all_groups(city: str = None):
    """
    Generate embeddings for all groups in the database
    Useful for updating existing groups with embeddings
    
    Args:
        city: Optional city filter. If None, processes all groups
    """
    db = Database()
    embedding_service = EmbeddingService()
    
    if city:
        db_groups = db.get_groups_by_city(city)
    else:
        # Get all groups (would need to add this method to Database)
        # For now, process by city
        from backend.config.settings import settings
        cities = ["San Francisco", "Denver", "Washington", "Austin"]
        db_groups = []
        for c in cities:
            db_groups.extend(db.get_groups_by_city(c))
    
    updated_count = 0
    for db_group in db_groups:
        if not db_group.description:
            continue
        
        # Generate embedding
        embedding = embedding_service.generate_embedding(db_group.description)
        
        # Update group
        group = db.db_to_domain(db_group)
        group.embedding = embedding
        
        if db.save_group(group):
            updated_count += 1
            print(f"✅ Updated embedding for: {group.name}")
    
    print(f"\n✅ Generated embeddings for {updated_count} groups")
    return updated_count

