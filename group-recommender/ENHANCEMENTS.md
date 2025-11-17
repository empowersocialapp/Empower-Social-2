# Step 2: Embeddings & Enhanced Personality Matching

## ✅ What Was Implemented

### 1. Embeddings System (`backend/recommendation/embeddings.py`)

**Features:**
- **EmbeddingService**: Generates semantic embeddings using sentence-transformers
- **Model**: Uses `all-MiniLM-L6-v2` (384-dimensional embeddings)
- **Cosine Similarity**: Calculates semantic similarity between user interests and group descriptions
- **Batch Processing**: Can generate embeddings for multiple texts efficiently
- **Lazy Loading**: Model loads only when first used

**How It Works:**
1. User interests are converted to embeddings
2. Group descriptions are converted to embeddings (or use pre-computed)
3. Cosine similarity calculates how well interests match descriptions
4. Returns a score from 0-1 (higher = better match)

**Example:**
```python
from backend.recommendation.embeddings import EmbeddingService

service = EmbeddingService()
# "running" and "jogging" will have high similarity
similarity = service.cosine_similarity(
    service.generate_embedding("running"),
    service.generate_embedding("jogging")
)
```

### 2. Enhanced Personality Matching (`backend/recommendation/personality.py`)

**New Matching Functions:**

#### Openness Matching
- **High Openness (11-14)**: Matches creative, diverse, experimental groups
- **Low Openness (2-6)**: Matches traditional, routine, established groups
- Uses keyword detection in descriptions

#### Social Needs Matching
- **Loneliness**: Prioritizes welcoming, active, recurring groups
- **Low Friend Count**: Prioritizes small, intimate groups
- **Social Satisfaction**: Prioritizes community-building groups

#### Motivation Matching
- **Intrinsic**: Matches fun, enjoyable activities
- **Social**: Matches connection-focused groups
- **Achievement**: Matches skill-building, professional groups

**Comprehensive Scoring:**
- Returns both overall fit and component breakdowns
- Weighted average of all dimensions
- Optional dimensions (social needs, motivations) don't penalize if missing

### 3. Enhanced Recommendation Engine (`backend/recommendation/engine.py`)

**New Scoring Weights:**
- **Personality Fit**: 40% (extraversion, conscientiousness, openness)
- **Interest Match (Embeddings)**: 35% (semantic similarity)
- **Social Needs**: 15% (loneliness, friend count, satisfaction)
- **Motivations**: 10% (intrinsic, social, achievement)

**Returns:**
- Final match score
- Individual component scores
- Personality breakdown (extraversion, conscientiousness, openness)
- All scores for transparency

### 4. Updated API (`backend/api/routes.py`)

**New Request Fields:**
```json
{
  "personality_scores": {...},
  "interests": [...],
  "city": "...",
  "social_needs": {
    "loneliness_frequency": 4,
    "close_friends_count": 2,
    "social_satisfaction": 3
  },
  "motivations": {
    "intrinsic": 4.5,
    "social": 4.0,
    "achievement": 3.5
  }
}
```

**Enhanced Response:**
```json
{
  "scores": {
    "personality": 0.85,
    "personality_components": {
      "extraversion": 0.9,
      "conscientiousness": 0.8,
      "openness": 0.85
    },
    "interest": 0.75,
    "social_needs": 0.9,
    "motivations": 0.7,
    "final": 0.82
  }
}
```

### 5. Test Data Enhancement (`scripts/create_test_data.py`)

- Automatically generates embeddings when creating test groups
- Stores embeddings in database for faster recommendations
- Can be disabled with `generate_embeddings=False`

### 6. Embedding Utilities (`backend/utils/embeddings_helper.py`)

- `generate_embeddings_for_all_groups()`: Regenerate embeddings for existing groups
- Useful when descriptions change or model is updated

## 🚀 How to Use

### 1. Create Test Data with Embeddings

```bash
cd /Users/brettgoerl/Projects/Empower-Social/group-recommender
source venv/bin/activate
python scripts/create_test_data.py
```

This will:
- Create test groups
- Generate embeddings for all descriptions
- Store embeddings in database

### 2. Regenerate Embeddings for Existing Groups

```bash
cd /Users/brettgoerl/Projects/Empower-Social/group-recommender
source venv/bin/activate
python scripts/regenerate_embeddings.py
# Or for a specific city:
python scripts/regenerate_embeddings.py --city "San Francisco"
```

### 3. Test Enhanced Recommendations

**Via API:**
```bash
curl -X POST http://localhost:8000/api/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "personality_scores": {
      "extraversion": 12,
      "conscientiousness": 10,
      "openness": 8
    },
    "interests": ["running", "fitness"],
    "city": "San Francisco",
    "social_needs": {
      "loneliness_frequency": 4,
      "close_friends_count": 2
    },
    "motivations": {
      "intrinsic": 4.5,
      "social": 4.0
    }
  }'
```

**Via Frontend:**
- Open http://localhost:8000/
- Use "Get Recommendations" tab
- See detailed score breakdowns

## 📊 Improvements

### Before (Simple Engine)
- Keyword-based interest matching
- Only extraversion and conscientiousness matching
- Simple weighted average

### After (Enhanced Engine)
- **Semantic interest matching** using embeddings
- **Full personality matching** (extraversion, conscientiousness, openness)
- **Social needs matching** (loneliness, friend count, satisfaction)
- **Motivation matching** (intrinsic, social, achievement)
- **Detailed score breakdowns** for transparency
- **Better recommendations** through multi-dimensional matching

## 🔧 Technical Details

### Embedding Model
- **Model**: `all-MiniLM-L6-v2`
- **Dimensions**: 384
- **Size**: ~80MB
- **Speed**: Fast inference (~100ms per text)
- **Quality**: Good for semantic similarity

### Performance
- Embeddings are cached in database
- First recommendation may be slower (model loading)
- Subsequent recommendations are fast
- Batch processing available for bulk operations

## 📝 Next Steps

Potential enhancements:
1. **Two-stage retrieval**: Use embeddings for initial candidate selection (top 200), then rank with personality
2. **Fine-tuned embeddings**: Train on group/activity-specific data
3. **Hybrid search**: Combine keyword + embedding search
4. **A/B testing**: Compare different scoring weights

## 🧪 Testing

All components tested and working:
- ✅ EmbeddingService generates embeddings
- ✅ Cosine similarity calculates correctly
- ✅ Personality matching works for all dimensions
- ✅ RecommendationEngine integrates everything
- ✅ API accepts new fields
- ✅ Frontend displays enhanced scores

