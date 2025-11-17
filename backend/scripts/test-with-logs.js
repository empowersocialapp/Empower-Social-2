require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const { generateRecommendationsV2 } = require('../services/recommendations-v2');
const { createUser, createSurveyResponse, createCalculatedScores } = require('../services/airtable');

async function testWithLogs() {
  try {
    console.log('=== Creating test user ===');
    const userResult = await createUser({
      name: 'Log Test User',
      email: 'log-test@example.com',
      age: 30,
      gender: 'Other',
      zipcode: '94109'
    });
    
    if (!userResult.success) {
      console.error('Failed to create user:', userResult.error);
      return;
    }
    
    const userId = userResult.data.userId;
    console.log('✅ User created:', userId);
    
    console.log('\n=== Creating survey response ===');
    const testSurveyData = {
      personality: { q1: 5, q6: 3, q3: 6, q8: 2, q5: 4, q10: 3 },
      motivation: { m1: 4, m2: 5, m3: 3, m4: 4, m5: 5, m6: 3 },
      social: {
        closeFriends: '6-10',
        satisfaction: 'Neutral (4)',
        loneliness: 'Sometimes (3)',
        lookingFor: []
      },
      interests: {
        categories: ['sports', 'social', 'outdoor'],
        specific: 'Running, hiking, social events'
      },
      preferences: {
        freeTime: '5-10 hours',
        travelDistance: '5-15 miles',
        indoor: true,
        outdoor: true,
        physical: true,
        relaxed: false,
        structured: true,
        spontaneous: false
      },
      affinityGroups: {
        faith: [],
        lgbtq: [],
        cultural: [],
        womens: [],
        youngProf: [],
        international: []
      }
    };
    
    const surveyResult = await createSurveyResponse(testSurveyData, userId);
    if (!surveyResult.success) {
      console.error('Failed to create survey response:', surveyResult.error);
      return;
    }
    
    const surveyResponseId = surveyResult.data.surveyResponseId;
    console.log('✅ Survey response created:', surveyResponseId);
    
    console.log('\n=== Creating calculated scores ===');
    const scoresResult = await createCalculatedScores(userId, surveyResponseId);
    if (!scoresResult.success) {
      console.error('Failed to create calculated scores:', scoresResult.error);
      return;
    }
    
    const calculatedScoresId = scoresResult.data.calculatedScoresId;
    console.log('✅ Calculated scores created:', calculatedScoresId);
    
    console.log('\n=== Generating recommendations (this will show save logs) ===');
    console.log('Watch for:');
    console.log('  - "Attempting to save recommendations to Airtable..."');
    console.log('  - "Successfully saved recommendations to Airtable. Prompt ID: ..."');
    console.log('  - OR any error messages\n');
    
    const recommendationsResult = await generateRecommendationsV2(
      userId, 
      surveyResponseId, 
      calculatedScoresId, 
      null, 
      { singleMatchMode: true }
    );
    
    console.log('\n=== Result ===');
    if (recommendationsResult.success) {
      console.log('✅ Recommendations generated successfully');
      console.log('   Prompt ID:', recommendationsResult.data.promptId);
      console.log('   Recommendations count:', recommendationsResult.data.recommendations.length);
      console.log('   Pool size:', recommendationsResult.data.recommendationsPool?.length || 0);
      console.log('   Warning:', recommendationsResult.data.warning || 'None');
      
      if (recommendationsResult.data.warning) {
        console.log('\n⚠️  WARNING: There was an issue saving to Airtable!');
        console.log('   This means the GPT_Prompts record may not have been created.');
      } else {
        console.log('\n✅ No warnings - record should be saved!');
      }
    } else {
      console.error('❌ Failed to generate recommendations:', recommendationsResult.error);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.error(error.stack);
  }
}

testWithLogs();


