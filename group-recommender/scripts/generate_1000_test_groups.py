#!/usr/bin/env python3
"""
Generate 1000 diverse test groups for robust testing
Creates groups with varied personality-matching characteristics
"""
import sys
import random
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.infrastructure.database import Database
from backend.domain.models import Group, Location, GroupType
from backend.config.settings import settings
from backend.recommendation.embeddings import EmbeddingService

# Diverse group characteristics for testing
GROUP_SIZES = ['small', 'medium', 'large']
STRUCTURE_LEVELS = ['structured', 'semi-structured', 'flexible']
ATMOSPHERES = ['energetic', 'relaxed', 'intimate', 'welcoming']
MEETING_FREQUENCIES = ['weekly', 'biweekly', 'monthly']
GROUP_TYPES = list(GroupType)

# Interest categories and activities
ACTIVITY_TEMPLATES = {
    'sports': [
        '{city} {activity} Club', '{city} {activity} Group', '{city} {activity} League',
        '{city} {activity} Team', '{city} {activity} Community'
    ],
    'outdoor': [
        '{city} {activity} Group', '{city} {activity} Club', '{city} {activity} Society',
        '{city} {activity} Explorers', '{city} {activity} Enthusiasts'
    ],
    'arts': [
        '{city} {activity} Collective', '{city} {activity} Studio', '{city} {activity} Workshop',
        '{city} {activity} Circle', '{city} {activity} Guild'
    ],
    'music': [
        '{city} {activity} Group', '{city} {activity} Ensemble', '{city} {activity} Society',
        '{city} {activity} Collective', '{city} {activity} Circle'
    ],
    'food': [
        '{city} {activity} Club', '{city} {activity} Society', '{city} {activity} Group',
        '{city} {activity} Collective', '{city} {activity} Enthusiasts'
    ],
    'learning': [
        '{city} {activity} Group', '{city} {activity} Circle', '{city} {activity} Society',
        '{city} {activity} Club', '{city} {activity} Workshop'
    ],
    'social': [
        '{city} {activity} Network', '{city} {activity} Social', '{city} {activity} Meetup',
        '{city} {activity} Group', '{city} {activity} Community'
    ],
    'games': [
        '{city} {activity} Club', '{city} {activity} Group', '{city} {activity} Society',
        '{city} {activity} Guild', '{city} {activity} League'
    ],
    'wellness': [
        '{city} {activity} Circle', '{city} {activity} Group', '{city} {activity} Community',
        '{city} {activity} Collective', '{city} {activity} Studio'
    ],
    'community': [
        '{city} {activity} Volunteers', '{city} {activity} Network', '{city} {activity} Action',
        '{city} {activity} Collective', '{city} {activity} Initiative'
    ]
}

ACTIVITIES = {
    'sports': ['Running', 'Cycling', 'Yoga', 'Tennis', 'Basketball', 'Soccer', 'Swimming', 
               'Martial Arts', 'Dance Fitness', 'Boxing', 'Volleyball', 'CrossFit', 'Pilates',
               'Rock Climbing', 'Hiking', 'Biking', 'Surfing', 'Tennis', 'Pickleball'],
    'outdoor': ['Hiking', 'Biking', 'Rock Climbing', 'Kayaking', 'Gardening', 'Walking Tours',
                'Park Activities', 'Urban Exploration', 'Nature Photography', 'Bird Watching',
                'Trail Running', 'Outdoor Yoga', 'Beach Activities'],
    'arts': ['Painting', 'Photography', 'Pottery', 'Crafts', 'Writing', 'Theater', 'Museums',
             'Film', 'Drawing', 'Sculpture', 'Printmaking', 'Textile Arts', 'Digital Art'],
    'music': ['Concerts', 'Live Music', 'Singing', 'Playing Instruments', 'Music Festivals',
              'Open Mic', 'Jazz', 'Classical Music', 'Folk Music', 'Electronic Music', 'Choir'],
    'food': ['Cooking Classes', 'Wine Tasting', 'Food Tours', 'Restaurants', 'Baking',
             'Coffee', 'Breweries', 'Farmers Markets', 'Food Festivals', 'Culinary Adventures'],
    'learning': ['Book Clubs', 'Workshops', 'Lectures', 'Language Exchange', 'Tech Meetups',
                 'Professional Development', 'Science', 'History', 'Philosophy', 'Literature'],
    'social': ['Networking', 'Social Mixers', 'Trivia', 'Comedy', 'Happy Hours', 'Bars',
               'Events', 'Speed Dating', 'Rooftop Events', 'Community Gatherings'],
    'games': ['Board Games', 'Card Games', 'Chess', 'Puzzles', 'Video Games', 'DND',
              'RPG', 'Escape Rooms', 'Game Tournaments', 'Strategy Games'],
    'wellness': ['Meditation', 'Mindfulness', 'Yoga', 'Tai Chi', 'Wellness Workshops',
                 'Therapy Groups', 'Sound Healing', 'Breathwork', 'Wellness Retreats'],
    'community': ['Volunteering', 'Charity', 'Environmental', 'Mentoring', 'Community Organizing',
                  'Activism', 'Neighborhood Events', 'Civic Engagement', 'Social Justice']
}

DESCRIPTION_TEMPLATES = {
    'sports': [
        'Join our {frequency} {activity} group for all skill levels. Build fitness and friendships in a supportive community.',
        'Active {activity} community meeting {frequency}. Perfect for staying fit while connecting with like-minded people.',
        'Welcoming {activity} group that meets {frequency}. Great for beginners and experienced participants alike.',
        'Community-focused {activity} sessions {frequency}. Emphasis on fun, fitness, and social connection.',
        'Structured {activity} program meeting {frequency}. Learn new skills and meet active people in {city}.'
    ],
    'outdoor': [
        'Explore {city} and surrounding areas with our {frequency} {activity} group. All experience levels welcome.',
        'Connect with nature and people through {frequency} {activity} outings. Beautiful locations and great company.',
        'Active {activity} community meeting {frequency}. Discover new trails, parks, and outdoor spaces together.',
        'Outdoor {activity} adventures {frequency}. Perfect for nature lovers who want to stay active and social.',
        'Join us for {frequency} {activity} sessions. Experience the outdoors while building lasting friendships.'
    ],
    'arts': [
        'Creative {activity} community meeting {frequency}. Express yourself and connect with fellow artists.',
        'Welcoming {activity} group for all skill levels. Learn, create, and share in a supportive environment.',
        'Join our {frequency} {activity} sessions. Explore your creativity while meeting like-minded people.',
        'Artistic {activity} collective meeting {frequency}. Share ideas, techniques, and inspiration with others.',
        'Community {activity} group that meets {frequency}. Perfect for creative individuals seeking connection.'
    ],
    'music': [
        'Music lovers unite! {Frequency} {activity} sessions for all experience levels. Share your passion with others.',
        'Join our {frequency} {activity} community. Play, listen, and connect through the power of music.',
        'Active {activity} group meeting {frequency}. Whether you play or just love music, you\'re welcome here.',
        'Musical {activity} collective that meets {frequency}. Connect with fellow music enthusiasts in {city}.',
        'Community {activity} sessions {frequency}. Experience live music and build friendships with music lovers.'
    ],
    'food': [
        'Food enthusiasts welcome! {Frequency} {activity} events exploring {city}\'s culinary scene together.',
        'Join our {frequency} {activity} group. Discover new flavors, restaurants, and food experiences.',
        'Culinary {activity} community meeting {frequency}. Perfect for food lovers who enjoy social dining.',
        'Explore {city}\'s food culture through {frequency} {activity} outings. Great food and great company.',
        'Food-focused {activity} group that meets {frequency}. Share meals, recipes, and culinary adventures.'
    ],
    'learning': [
        'Curious minds unite! {Frequency} {activity} sessions for lifelong learners seeking intellectual connection.',
        'Join our {frequency} {activity} community. Learn, discuss, and grow together in a supportive environment.',
        'Educational {activity} group meeting {frequency}. Expand your knowledge while meeting interesting people.',
        'Intellectual {activity} circle that meets {frequency}. Engage in meaningful discussions and learning.',
        'Community {activity} sessions {frequency}. Share knowledge, ideas, and perspectives with others.'
    ],
    'social': [
        'Social {activity} events {frequency}. Meet new people, have fun, and build connections in {city}.',
        'Join our {frequency} {activity} group. Perfect for people looking to expand their social circle.',
        'Welcoming {activity} community meeting {frequency}. Great for networking and making new friends.',
        'Fun {activity} gatherings {frequency}. Connect with others through shared interests and activities.',
        'Social {activity} group that meets {frequency}. Build friendships while enjoying great experiences.'
    ],
    'games': [
        'Game enthusiasts welcome! {Frequency} {activity} sessions for all skill levels. Fun and friendly competition.',
        'Join our {frequency} {activity} community. Play, learn, and connect with fellow game lovers.',
        'Active {activity} group meeting {frequency}. Perfect for people who love games and socializing.',
        'Gaming {activity} collective that meets {frequency}. Share strategies, play together, and make friends.',
        'Community {activity} sessions {frequency}. Enjoy games while building lasting friendships.'
    ],
    'wellness': [
        'Wellness-focused {activity} group meeting {frequency}. Prioritize your mental and physical health together.',
        'Join our {frequency} {activity} community. Practice mindfulness and self-care in a supportive group.',
        'Holistic {activity} sessions {frequency}. Connect with others on your wellness journey.',
        'Wellness {activity} circle that meets {frequency}. Share practices, support each other, and grow together.',
        'Community {activity} group meeting {frequency}. Focus on wellness while building meaningful connections.'
    ],
    'community': [
        'Make a difference together! {Frequency} {activity} opportunities to give back to the {city} community.',
        'Join our {frequency} {activity} group. Volunteer, connect, and create positive change in your city.',
        'Community-focused {activity} sessions {frequency}. Help others while building friendships.',
        'Activist {activity} collective meeting {frequency}. Work together to make {city} a better place.',
        'Volunteer {activity} group that meets {frequency}. Serve the community while meeting like-minded people.'
    ]
}

def generate_group_description(category, activity, frequency, city, size_category, structure, atmosphere):
    """Generate a realistic group description"""
    templates = DESCRIPTION_TEMPLATES.get(category, DESCRIPTION_TEMPLATES['social'])
    template = random.choice(templates)
    
    # Format template with lowercase frequency
    frequency_lower = frequency.lower()
    
    # Add personality-relevant keywords based on characteristics
    keywords = []
    if size_category == 'large':
        keywords.append('large community')
    elif size_category == 'small':
        keywords.append('intimate group')
    
    if structure == 'structured':
        keywords.append('organized program')
    elif structure == 'flexible':
        keywords.append('casual and flexible')
    
    if atmosphere == 'energetic':
        keywords.append('vibrant and active')
    elif atmosphere == 'relaxed':
        keywords.append('laid-back and friendly')
    elif atmosphere == 'intimate':
        keywords.append('close-knit community')
    
    # Format the template - handle both {frequency} and {Frequency}
    description = template.replace('{frequency}', frequency_lower).replace('{Frequency}', frequency.capitalize())
    description = description.format(activity=activity.lower(), city=city)
    
    if keywords:
        description += f' Our {", ".join(keywords)} makes this perfect for people seeking connection.'
    
    return description

def determine_member_count(size_category):
    """Determine member count based on size category"""
    if size_category == 'small':
        return random.randint(10, 50)
    elif size_category == 'medium':
        return random.randint(51, 200)
    else:  # large
        return random.randint(201, 1000)

def determine_group_type(category):
    """Map category to GroupType"""
    mapping = {
        'sports': GroupType.SPORT,
        'outdoor': GroupType.SPORT,
        'arts': GroupType.HOBBY,
        'music': GroupType.HOBBY,
        'food': GroupType.SOCIAL,
        'learning': GroupType.EDUCATIONAL,
        'social': GroupType.SOCIAL,
        'games': GroupType.HOBBY,
        'wellness': GroupType.HOBBY,
        'community': GroupType.VOLUNTEER
    }
    return mapping.get(category, GroupType.SOCIAL)

def generate_1000_groups(city: str = None, state: str = None):
    """Generate 1000 diverse test groups"""
    db = Database()
    embedding_service = EmbeddingService()
    
    city = city or settings.active_city
    state = state or settings.active_state
    
    print(f"🚀 Generating 1000 test groups for {city}, {state}")
    print("This will take a few minutes...\n")
    
    generated = 0
    failed = 0
    
    # Generate groups across all categories
    for category_key, category_data in ACTIVITY_TEMPLATES.items():
        activities = ACTIVITIES.get(category_key, [])
        templates = category_data
        
        # Generate ~100 groups per category (to get to 1000 total)
        groups_per_category = 100
        
        for i in range(groups_per_category):
            try:
                # Randomly select characteristics
                activity = random.choice(activities)
                template = random.choice(templates)
                size_category = random.choice(GROUP_SIZES)
                structure = random.choice(STRUCTURE_LEVELS)
                atmosphere = random.choice(ATMOSPHERES)
                frequency = random.choice(MEETING_FREQUENCIES)
                group_type = determine_group_type(category_key)
                
                # Generate name
                name = template.format(city=city, activity=activity)
                # Add variety with numbers/descriptors
                if random.random() < 0.3:
                    descriptors = ['Active', 'Friendly', 'Welcoming', 'Vibrant', 'Community']
                    name = f"{random.choice(descriptors)} {name}"
                
                # Generate description
                description = generate_group_description(
                    category_key, activity, frequency, city,
                    size_category, structure, atmosphere
                )
                
                # Determine member count
                member_count = determine_member_count(size_category)
                
                # Generate unique ID
                group_id = f"{city.lower().replace(' ', '-')}-{category_key}-{i+1}-{random.randint(1000, 9999)}"
                
                # Create group
                group = Group(
                    id=group_id,
                    name=name,
                    description=description,
                    member_count=member_count,
                    group_type=group_type,
                    location=Location(city=city, state=state),
                    source="test_generated",
                    url=f"http://test.com/{group_id}",
                    group_size_category=size_category,
                    structure_level=structure,
                    atmosphere=atmosphere,
                    meeting_frequency=frequency,
                    newcomer_friendly=random.choice([True, False, None]),
                    health_score=random.randint(60, 100)  # All groups are healthy
                )
                
                # Generate embedding
                try:
                    group.embedding = embedding_service.generate_embedding(description)
                except Exception as e:
                    print(f"  ⚠️  Warning: Could not generate embedding for {name}: {e}")
                
                # Save to database
                if db.save_group(group):
                    generated += 1
                    if generated % 100 == 0:
                        print(f"  ✅ Generated {generated}/1000 groups...")
                else:
                    failed += 1
                    
            except Exception as e:
                failed += 1
                print(f"  ❌ Error generating group: {e}")
                continue
    
    print(f"\n✅ Generated {generated} groups successfully")
    if failed > 0:
        print(f"⚠️  {failed} groups failed to generate")
    
    # Verify
    db_groups = db.get_groups_by_city(city)
    print(f"\n📊 Total groups in database for {city}: {len(db_groups)}")
    
    return generated

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='Generate 1000 test groups')
    parser.add_argument('--city', type=str, help='City name (defaults to configured city)')
    parser.add_argument('--state', type=str, help='State abbreviation')
    
    args = parser.parse_args()
    
    generate_1000_groups(city=args.city, state=args.state)

