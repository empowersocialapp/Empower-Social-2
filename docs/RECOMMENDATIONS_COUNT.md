# Configuring Number of Recommendations

## Overview

You can control how many recommendations the system generates. **Fewer recommendations = faster response time and lower cost.**

## Speed & Cost Impact

### Current Default: 10 recommendations
- **Response Time**: ~10-15 seconds
- **Cost**: ~$0.10 per user
- **Output Tokens**: ~2,500-3,000

### With 5 recommendations
- **Response Time**: ~6-8 seconds (40% faster)
- **Cost**: ~$0.05 per user (50% cheaper)
- **Output Tokens**: ~1,250-1,500

### With 7 recommendations
- **Response Time**: ~8-10 seconds (30% faster)
- **Cost**: ~$0.07 per user (30% cheaper)
- **Output Tokens**: ~1,750-2,100

## How to Change

### Option 1: Environment Variable (Recommended)

Add to your `backend/.env` file:

```env
# Generate 5 recommendations (faster, cheaper)
RECOMMENDATIONS_COUNT=5

# Or 7 recommendations (balanced)
RECOMMENDATIONS_COUNT=7

# Or keep default 10
# (don't set the variable, or set to 10)
```

Then restart your server.

### Option 2: Code Change

Edit `backend/services/openai.js` and change the default:

```javascript
const recommendationsCount = numRecommendations || parseInt(process.env.RECOMMENDATIONS_COUNT) || 5; // Changed from 10 to 5
```

## What Gets Adjusted Automatically

When you change the count, the system automatically:

1. **Adjusts max_tokens**: 
   - Formula: `count * 300 + 500`
   - 5 recommendations: ~2,000 tokens
   - 7 recommendations: ~2,600 tokens
   - 10 recommendations: ~3,500 tokens

2. **Updates the GPT prompt**: 
   - Changes "recommend 10" to "recommend X"
   - Adjusts the 50/50 split calculation
   - Updates all references in the prompt

3. **Maintains quality**: 
   - Still follows all personality matching rules
   - Still maintains 50/50 recurring/one-time split
   - Still includes URLs for each recommendation

## Recommendations

- **For Testing/Development**: Use 5 recommendations (faster iteration)
- **For Production (MVP)**: Use 7 recommendations (good balance)
- **For Full Production**: Use 10 recommendations (more options for users)

## Testing

After changing the count, test by:

1. Restarting the server
2. Submitting a survey
3. Checking console logs: `Generating X recommendations (max_tokens: Y)`
4. Verifying the output has the correct number of recommendations

## Notes

- The 50/50 split (recurring/one-time) is automatically rounded
  - 5 recommendations: 2 recurring, 3 one-time
  - 7 recommendations: 3 recurring, 4 one-time
  - 10 recommendations: 5 recurring, 5 one-time

- Event fetching is NOT affected by recommendation count (still fetches same number of events)

- Airtable operations are NOT affected (same data stored regardless)


