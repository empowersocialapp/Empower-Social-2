require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const Airtable = require('airtable');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

async function findPrompt(promptId) {
  try {
    console.log(`Looking for GPT_Prompts record: ${promptId}`);

    // Try to find it directly
    try {
      const record = await base('GPT_Prompts').find(promptId);
      console.log('✅ Found record directly!');
      console.log('   ID:', record.id);
      console.log('   User field:', record.fields.User);
      console.log('   Has Recommendations_Generated:', !!record.fields.Recommendations_Generated);
      console.log('   Has Recommendations_Pool:', !!record.fields.Recommendations_Pool);
      console.log('   Created:', record._rawJson?.createdTime || record.createdTime);
      return;
    } catch (findError) {
      console.log('❌ Could not find by ID:', findError.message);
    }

    // Try to find all recent records
    console.log('\nTrying to find all recent GPT_Prompts records...');
    const allRecords = await base('GPT_Prompts')
      .select({ maxRecords: 10 })
      .all();

    console.log(`Found ${allRecords.length} total GPT_Prompts records`);

    if (allRecords.length > 0) {
      // Sort by created time
      allRecords.sort((a, b) => {
        const timeA = new Date(a._rawJson?.createdTime || a.createdTime || 0).getTime();
        const timeB = new Date(b._rawJson?.createdTime || b.createdTime || 0).getTime();
        return timeB - timeA;
      });

      console.log('\nMost recent records:');
      allRecords.slice(0, 5).forEach((rec, idx) => {
        console.log(`\n${idx + 1}. ID: ${rec.id}`);
        console.log('   User:', rec.fields.User);
        console.log('   Created:', rec._rawJson?.createdTime || rec.createdTime);
        console.log('   Has Recommendations_Generated:', !!rec.fields.Recommendations_Generated);
        console.log('   Has Recommendations_Pool:', !!rec.fields.Recommendations_Pool);

        if (rec.id === promptId) {
          console.log('   ✅ THIS IS THE RECORD WE\'RE LOOKING FOR!');
        }
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
  }
}

const promptId = process.argv[2] || 'rec9ydL9tGQhYqhRt';
findPrompt(promptId);

