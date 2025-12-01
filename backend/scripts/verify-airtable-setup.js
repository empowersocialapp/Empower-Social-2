/**
 * Airtable Setup Verification Script
 * Run from backend directory: node scripts/verify-airtable-setup.js
 */

require('dotenv').config();
const { base } = require('../services/airtable');

const REQUIRED_TABLES = {
  'Users': [
    'Name',
    'Email',
    'Age',
    'Gender',
    'Zipcode'
  ],
  'Survey_Responses': [
    'User',
    'Interest_Categories',
    'Specific_Interests',
    'Close_Friends_Count',
    'Social_Satisfaction',
    'Loneliness_Frequency',
    'Free_Time_Per_Week',
    'Travel_Distance_Willing'
  ],
  'Calculated_Scores': [
    'User',
    'Survey Response',
    'Extraversion_Raw',
    'Extraversion_Category',
    'Conscientiousness_Raw',
    'Conscientiousness_Category',
    'Openness_Raw',
    'Openness_Category',
    'Primary_Motivation',
    'Intrinsic_Motivation',
    'Social_Motivation',
    'Achievement_Motivation'
  ],
  'GPT_Prompts': [
    'User',
    'Survey Response',
    'Calculated Scores',
    'Prompt_Text',
    'Recommendations_Generated'
  ]
};

async function verifyTable(tableName, requiredFields) {
  try {
    console.log(`\n📋 Checking table: ${tableName}`);

    // Try to fetch a record to verify table exists
    const records = await base(tableName).select({ maxRecords: 1 }).all();
    console.log('   ✅ Table exists');

    // Check required fields by trying to query them
    const missingFields = [];
    const existingFields = [];

    for (const field of requiredFields) {
      try {
        // Try to select just this field
        await base(tableName).select({ fields: [field], maxRecords: 1 }).all();
        existingFields.push(field);
        console.log(`   ✅ Field "${field}" exists`);
      } catch (error) {
        if (error.message && error.message.includes('Unknown field')) {
          missingFields.push(field);
          console.log(`   ❌ Field "${field}" is MISSING`);
        } else {
          // Field might exist but there's another error
          existingFields.push(field);
          console.log(`   ⚠️  Field "${field}" - cannot verify (${error.message.substring(0, 50)})`);
        }
      }
    }

    return { exists: true, missingFields, existingFields };
  } catch (error) {
    if (error.message && error.message.includes('Could not find table')) {
      console.log('   ❌ Table does NOT exist');
      return { exists: false, missingFields: requiredFields, existingFields: [] };
    }
    console.log(`   ⚠️  Error checking table: ${error.message.substring(0, 100)}`);
    return { exists: false, missingFields: requiredFields, existingFields: [] };
  }
}

async function main() {
  console.log('🔍 Verifying Airtable Setup for Conceptual Recommendations System\n');
  console.log('='.repeat(60));

  let allPassed = true;
  const results = {};

  for (const [tableName, fields] of Object.entries(REQUIRED_TABLES)) {
    const result = await verifyTable(tableName, fields);
    results[tableName] = result;

    if (!result.exists || result.missingFields.length > 0) {
      allPassed = false;
    }
  }

  console.log('\n' + '='.repeat(60));

  if (allPassed) {
    console.log('\n✅ All tables and fields are set up correctly!');
    console.log('\n💡 Your Airtable base is ready for the conceptual recommendation system.');
  } else {
    console.log('\n❌ Some tables or fields are missing.');
    console.log('\n📝 Next Steps:');
    console.log('1. See docs/AIRTABLE_SETUP_GUIDE.md for setup instructions');
    console.log('2. Add missing tables/fields in Airtable');
    console.log('3. Run this script again: cd backend && node scripts/verify-airtable-setup.js');
    process.exit(1);
  }

  console.log('');
}

main().catch(error => {
  console.error('\n❌ Error:', error.message);
  process.exit(1);
});
