#!/bin/bash
# Quick test script after adding Recommendations_Pool field
# Usage: ./scripts/test-after-setup.sh

echo "🧪 Testing Single-Match System"
echo "=============================="
echo ""

# Check if server is running
if ! curl -s http://localhost:3000/api/health > /dev/null; then
    echo "❌ Server not running. Starting server..."
    cd backend
    lsof -ti:3000 | xargs kill -9 2>/dev/null
    nohup npm start > ../backend.log 2>&1 &
    sleep 5
    cd ..
fi

echo "✅ Server is running"
echo ""

# Create test user
echo "📝 Creating test user..."
USER_RESPONSE=$(curl -s -X POST http://localhost:3000/api/test/create-test-user \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-'$(date +%s)'@example.com",
    "name": "Test User",
    "zipcode": "94109"
  }')

USER_ID=$(echo $USER_RESPONSE | jq -r '.data.userId')
HAS_POOL=$(echo $USER_RESPONSE | jq -r '.data.recommendationsPool != null')

echo "User ID: $USER_ID"
echo "Has Pool: $HAS_POOL"
echo ""

if [ "$HAS_POOL" != "true" ]; then
    echo "⏳ Waiting 45 seconds for recommendations to generate..."
    sleep 45
fi

# Test next endpoint
echo "🔍 Testing /next endpoint..."
NEXT_RESPONSE=$(curl -s "http://localhost:3000/api/recommendations/$USER_ID/next")
SUCCESS=$(echo $NEXT_RESPONSE | jq -r '.success')
HAS_REC=$(echo $NEXT_RESPONSE | jq -r '.data.recommendation != null')

echo "Success: $SUCCESS"
echo "Has Recommendation: $HAS_REC"

if [ "$HAS_REC" = "true" ]; then
    REC_NAME=$(echo $NEXT_RESPONSE | jq -r '.data.recommendation.name')
    REMAINING=$(echo $NEXT_RESPONSE | jq -r '.data.remaining')
    echo "✅ Match found: $REC_NAME"
    echo "   Remaining: $REMAINING"
    echo ""
    echo "🌐 Open in browser:"
    echo "   http://localhost:8080/profile/match.html?userId=$USER_ID"
else
    ERROR=$(echo $NEXT_RESPONSE | jq -r '.error')
    echo "❌ Error: $ERROR"
    echo ""
    echo "💡 Make sure:"
    echo "   1. Recommendations_Pool field exists in GPT_Prompts table"
    echo "   2. TEST_MODE=false in backend/.env"
    echo "   3. Recommendations have been generated"
fi

echo ""
echo "📊 Full response:"
echo "$NEXT_RESPONSE" | jq '.'

