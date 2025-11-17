"""
Clean, organized interest inventory for group recommendations
All interests are social/group-oriented activities
"""

INTEREST_CATEGORIES = {
    "sports": {
        "label": "Sports & Fitness",
        "icon": "🏃",
        "interests": [
            "running",
            "cycling",
            "yoga",
            "tennis",
            "basketball",
            "soccer",
            "swimming",
            "martial arts",
            "dance fitness",
            "boxing",
            "volleyball"
        ]
    },
    "outdoor": {
        "label": "Outdoor & Nature",
        "icon": "🌲",
        "interests": [
            "hiking",
            "biking",
            "rock climbing",
            "kayaking",
            "gardening",
            "walking tours",
            "park activities"
        ]
    },
    "arts": {
        "label": "Arts & Culture",
        "icon": "🎨",
        "interests": [
            "painting",
            "photography",
            "pottery",
            "crafts",
            "writing",
            "theater",
            "museums",
            "film"
        ]
    },
    "music": {
        "label": "Music & Performance",
        "icon": "🎵",
        "interests": [
            "concerts",
            "live music",
            "singing",
            "playing instruments",
            "music festivals",
            "open mic",
            "jazz"
        ]
    },
    "food": {
        "label": "Food & Dining",
        "icon": "🍽️",
        "interests": [
            "cooking classes",
            "wine tasting",
            "food tours",
            "restaurants",
            "baking",
            "coffee",
            "breweries"
        ]
    },
    "learning": {
        "label": "Learning & Development",
        "icon": "📚",
        "interests": [
            "book clubs",
            "workshops",
            "lectures",
            "language exchange",
            "tech meetups",
            "professional development",
            "science"
        ]
    },
    "social": {
        "label": "Social & Networking",
        "icon": "🎉",
        "interests": [
            "networking",
            "social mixers",
            "trivia",
            "comedy",
            "happy hours",
            "bars",
            "events"
        ]
    },
    "games": {
        "label": "Games & Hobbies",
        "icon": "🎮",
        "interests": [
            "board games",
            "card games",
            "chess",
            "puzzles",
            "video games",
            "dnd"
        ]
    },
    "wellness": {
        "label": "Wellness & Mindfulness",
        "icon": "🧘",
        "interests": [
            "meditation",
            "mindfulness",
            "yoga",
            "tai chi",
            "wellness workshops",
            "therapy groups"
        ]
    },
    "community": {
        "label": "Volunteering & Community",
        "icon": "🤝",
        "interests": [
            "volunteering",
            "charity",
            "environmental",
            "mentoring",
            "community organizing",
            "activism"
        ]
    }
}

def get_all_interests():
    """Get a flat list of all interests"""
    all_interests = []
    for category in INTEREST_CATEGORIES.values():
        all_interests.extend(category["interests"])
    return sorted(set(all_interests))

def get_interests_by_category(category_key):
    """Get interests for a specific category"""
    if category_key in INTEREST_CATEGORIES:
        return INTEREST_CATEGORIES[category_key]["interests"]
    return []

