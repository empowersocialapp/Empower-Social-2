require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const Airtable = require('airtable');

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

async function testQueries(userId) {
  console.log(`Testing query formats for userId: ${userId}\n`);
  
  // Query 1: Direct equality
  try {
    const results1 = await base('GPT_Prompts')
      .select({
        filterByFormula: `{User} = '${userId}'`,
        maxRecords: 10
      })
      .all();
    console.log(`Query 1 ({User} = '${userId}'): Found ${results1.length} records`);
  } catch (e) {
    console.log(`Query 1 failed: ${e.message}`);
  }
  
  // Query 2: FIND with ARRAYJOIN
  try {
    const results2 = await base('GPT_Prompts')
      .select({
        filterByFormula: `FIND('${userId}', ARRAYJOIN({User}))`,
        maxRecords: 10
      })
      .all();
    console.log(`Query 2 (FIND with ARRAYJOIN): Found ${results2.length} records`);
  } catch (e) {
    console.log(`Query 2 failed: ${e.message}`);
  }
  
  // Query 3: SEARCH
  try {
    const results3 = await base('GPT_Prompts')
      .select({
        filterByFormula: `SEARCH('${userId}', ARRAYJOIN({User}))`,
        maxRecords: 10
      })
      .all();
    console.log(`Query 3 (SEARCH with ARRAYJOIN): Found ${results3.length} records`);
  } catch (e) {
    console.log(`Query 3 failed: ${e.message}`);
  }
  
  // Query 4: Get all and filter in JavaScript
  try {
    const allRecords = await base('GPT_Prompts')
      .select({ maxRecords: 100 })
      .all();
    
    const filtered = allRecords.filter(record => {
      const userLinks = record.fields.User || [];
      return Array.isArray(userLinks) && userLinks.includes(userId);
    });
    console.log(`Query 4 (fetch all and filter): Found ${filtered.length} records`);
    
    if (filtered.length > 0) {
      console.log(`   Latest record ID: ${filtered[0].id}`);
      console.log(`   User field value: ${JSON.stringify(filtered[0].fields.User)}`);
    }
  } catch (e) {
    console.log(`Query 4 failed: ${e.message}`);
  }
}

const userId = process.argv[2] || 'rec16gGxHetipPSbN';
testQueries(userId);


