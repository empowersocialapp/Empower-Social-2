require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const Airtable = require('airtable');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

async function checkUserRecommendations(userId) {
  try {
    console.log(`\n🔍 Checking recommendations for user: ${userId}\n`);
    
    // Check user
    const user = await base('Users').find(userId);
    console.log('✅ User found:', user.fields.Name);
    console.log('   Recommendations_Shown:', user.fields.Recommendations_Shown || '(empty)');
    console.log('   Feedback_Summary:', user.fields.Feedback_Summary ? '(exists)' : '(empty)');
    
    // Check GPT_Prompts
    const prompts = await base('GPT_Prompts')
      .select({
        filterByFormula: `FIND('${userId}', ARRAYJOIN({User}))`,
        maxRecords: 10
      })
      .all();
    
    console.log(`\n📋 Found ${prompts.length} GPT_Prompts records`);
    
    if (prompts.length > 0) {
      prompts.sort((a, b) => {
        const timeA = new Date(a._rawJson?.createdTime || a.createdTime || 0).getTime();
        const timeB = new Date(b._rawJson?.createdTime || b.createdTime || 0).getTime();
        return timeB - timeA;
      });
      
      const latest = prompts[0];
      console.log('\n📌 Latest prompt record:');
      console.log('   ID:', latest.id);
      console.log('   Created:', latest._rawJson?.createdTime || latest.createdTime);
      console.log('   Has Recommendations_Pool:', !!latest.fields.Recommendations_Pool);
      
      if (latest.fields.Recommendations_Pool) {
        try {
          const pool = JSON.parse(latest.fields.Recommendations_Pool);
          console.log('   Pool size:', pool.length);
          if (pool.length > 0) {
            console.log('   First recommendation:', pool[0].name);
            console.log('   First recommendation ID:', pool[0].id);
          } else {
            console.log('   ⚠️  Pool is empty!');
          }
        } catch (e) {
          console.log('   ❌ Error parsing pool:', e.message);
        }
      } else {
        console.log('   ⚠️  No Recommendations_Pool field found');
      }
    } else {
      console.log('   ⚠️  No GPT_Prompts records found');
    }
    
    // Check survey response
    const surveyResponses = await base('Survey_Responses')
      .select({
        filterByFormula: `FIND('${userId}', ARRAYJOIN({User}))`,
        maxRecords: 1
      })
      .all();
    
    console.log(`\n📝 Survey responses: ${surveyResponses.length}`);
    
    // Check calculated scores
    const scores = await base('Calculated_Scores')
      .select({
        filterByFormula: `FIND('${userId}', ARRAYJOIN({User}))`,
        maxRecords: 1
      })
      .all();
    
    console.log(`📊 Calculated scores: ${scores.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

const userId = process.argv[2];
if (!userId) {
  console.error('Usage: node check-user-recommendations.js <userId>');
  process.exit(1);
}

checkUserRecommendations(userId);

