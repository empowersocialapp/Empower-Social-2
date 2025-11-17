require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const Airtable = require('airtable');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

async function testSave() {
  try {
    // First, get a test user
    const users = await base('Users').select({ maxRecords: 1 }).all();
    if (users.length === 0) {
      console.error('No users found');
      return;
    }
    
    const userId = users[0].id;
    console.log('Using user:', userId, users[0].fields.Name);
    
    // Get survey response
    const surveyResponses = await base('Survey_Responses')
      .select({
        filterByFormula: `FIND('${userId}', ARRAYJOIN({User}))`,
        maxRecords: 1
      })
      .all();
    
    if (surveyResponses.length === 0) {
      console.error('No survey responses found');
      return;
    }
    
    const surveyResponseId = surveyResponses[0].id;
    console.log('Using survey response:', surveyResponseId);
    
    // Get calculated scores
    const scores = await base('Calculated_Scores')
      .select({
        filterByFormula: `FIND('${userId}', ARRAYJOIN({User}))`,
        maxRecords: 1
      })
      .all();
    
    if (scores.length === 0) {
      console.error('No calculated scores found');
      return;
    }
    
    const calculatedScoresId = scores[0].id;
    console.log('Using calculated scores:', calculatedScoresId);
    
    // Try to create a GPT_Prompts record
    console.log('\nAttempting to create GPT_Prompts record...');
    const fields = {
      User: [userId],
      'Survey Response': [surveyResponseId],
      'Calculated Scores': [calculatedScoresId],
      Prompt_Text: 'Test prompt text',
      Recommendations_Generated: 'Test recommendation',
      Recommendations_Pool: JSON.stringify([{ id: 'test1', name: 'Test Event' }])
    };
    
    console.log('Fields:', JSON.stringify(fields, null, 2));
    
    const record = await base('GPT_Prompts').create([{ fields }]);
    console.log('✅ Success! Created record:', record[0].id);
    
    // Clean up
    await base('GPT_Prompts').destroy([record[0].id]);
    console.log('✅ Cleaned up test record');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.error) {
      console.error('Airtable error details:', JSON.stringify(error.error, null, 2));
    }
    console.error(error.stack);
  }
}

testSave();


