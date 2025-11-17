require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const Airtable = require('airtable');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

async function testSave() {
  try {
    // Get a recent user
    const users = await base('Users')
      .select({ maxRecords: 5 })
      .all();
    
    // Sort by createdTime in JavaScript
    users.sort((a, b) => {
      const timeA = new Date(a._rawJson?.createdTime || a.createdTime || 0).getTime();
      const timeB = new Date(b._rawJson?.createdTime || b.createdTime || 0).getTime();
      return timeB - timeA;
    });
    
    if (users.length === 0) {
      console.error('No users found');
      return;
    }
    
    const user = users[0];
    console.log('Using user:', user.id, user.fields.Name);
    
    // Try to find survey response using different methods
    let surveyResponse = null;
    
    // Method 1: Direct link
    try {
      const surveyResponses = await base('Survey_Responses')
        .select({
          filterByFormula: `{User} = '${user.id}'`,
          maxRecords: 1
        })
        .all();
      if (surveyResponses.length > 0) {
        surveyResponse = surveyResponses[0];
        console.log('Found survey response (method 1):', surveyResponse.id);
      }
    } catch (e) {
      console.log('Method 1 failed:', e.message);
    }
    
    // Method 2: FIND
    if (!surveyResponse) {
      try {
        const surveyResponses = await base('Survey_Responses')
          .select({
            filterByFormula: `FIND('${user.id}', ARRAYJOIN({User}))`,
            maxRecords: 1
          })
          .all();
        if (surveyResponses.length > 0) {
          surveyResponse = surveyResponses[0];
          console.log('Found survey response (method 2):', surveyResponse.id);
        }
      } catch (e) {
        console.log('Method 2 failed:', e.message);
      }
    }
    
    // Method 3: Get all and filter
    if (!surveyResponse) {
      try {
        const allSurveys = await base('Survey_Responses')
          .select({ maxRecords: 100 })
          .all();
        surveyResponse = allSurveys.find(s => {
          const userLinks = s.fields.User || [];
          return Array.isArray(userLinks) && userLinks.includes(user.id);
        });
        if (surveyResponse) {
          console.log('Found survey response (method 3):', surveyResponse.id);
        }
      } catch (e) {
        console.log('Method 3 failed:', e.message);
      }
    }
    
    if (!surveyResponse) {
      console.error('No survey response found for user');
      return;
    }
    
    // Find calculated scores
    let calculatedScores = null;
    try {
      const scores = await base('Calculated_Scores')
        .select({
          filterByFormula: `FIND('${user.id}', ARRAYJOIN({User}))`,
          maxRecords: 1
        })
        .all();
      if (scores.length > 0) {
        calculatedScores = scores[0];
        console.log('Found calculated scores:', calculatedScores.id);
      }
    } catch (e) {
      console.log('Failed to find calculated scores:', e.message);
    }
    
    if (!calculatedScores) {
      console.error('No calculated scores found');
      return;
    }
    
    // Try to create GPT_Prompts record
    console.log('\n=== Attempting to create GPT_Prompts record ===');
    const fields = {
      User: [user.id],
      'Survey Response': [surveyResponse.id],
      'Calculated Scores': [calculatedScores.id],
      Prompt_Text: 'Test prompt',
      Recommendations_Generated: 'Test Event\nWhy it matches\nTBD TBD at TBD\nhttps://example.com'
    };
    
    console.log('Fields to save:', JSON.stringify({
      User: fields.User,
      'Survey Response': fields['Survey Response'],
      'Calculated Scores': fields['Calculated Scores'],
      Prompt_Text: '[truncated]',
      Recommendations_Generated: fields.Recommendations_Generated.substring(0, 50) + '...'
    }, null, 2));
    
    try {
      const record = await base('GPT_Prompts').create([{ fields }]);
      console.log('✅ SUCCESS! Created GPT_Prompts record:', record[0].id);
      
      // Verify we can find it
      const found = await base('GPT_Prompts').find(record[0].id);
      console.log('✅ Verified record exists:', found.id);
      
      // Clean up
      await base('GPT_Prompts').destroy([record[0].id]);
      console.log('✅ Cleaned up test record');
      
    } catch (error) {
      console.error('❌ ERROR creating record:', error.message);
      if (error.error) {
        console.error('Airtable error details:', JSON.stringify(error.error, null, 2));
      }
      console.error('Stack:', error.stack);
    }
    
  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    console.error(error.stack);
  }
}

testSave();

