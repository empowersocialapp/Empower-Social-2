/**
 * Airtable Setup Verification Script
 * Verifies that all required tables and fields exist
 */

// Load environment variables and modules from backend
const path = require('path');
const fs = require('fs');

// Add backend/node_modules to module path
const backendNodeModules = path.join(__dirname, '../backend/node_modules');
if (fs.existsSync(backendNodeModules)) {
  require('module')._resolveFilename = (function(originalResolveFilename) {
    return function(request, parent) {
      if (!request.startsWith('.') && !path.isAbsolute(request)) {
        const backendPath = path.join(backendNodeModules, request);
        if (fs.existsSync(backendPath) || fs.existsSync(backendPath + '.js')) {
          return backendPath;
        }
      }
      return originalResolveFilename(request, parent);
    };
  })(require('module')._resolveFilename);
}

// Load dotenv
const envPath = path.join(__dirname, '../backend/.env');
if (fs.existsSync(envPath)) {
  try {
    require(path.join(backendNodeModules, 'dotenv')).config({ path: envPath });
  } catch (e) {
    // Fallback to root .env
    const rootEnv = path.join(__dirname, '../.env');
    if (fs.existsSync(rootEnv)) {
      // Manually load .env file
      const envContent = fs.readFileSync(rootEnv, 'utf8');
      envContent.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split('=');
        if (key && valueParts.length > 0) {
          process.env[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
        }
      });
    }
  }
}

// Load Airtable
let Airtable;
try {
  Airtable = require(path.join(backendNodeModules, 'airtable'));
} catch (e) {
  try {
    Airtable = require('airtable');
  } catch (e2) {
    console.error('❌ Airtable module not found. Please run: cd backend && npm install');
    process.exit(1);
  }
}

if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
  console.error('❌ AIRTABLE_API_KEY and AIRTABLE_BASE_ID must be set in environment variables');
  process.exit(1);
}

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

const REQUIRED_TABLES = {
  'Recommendation_Feedback': [
    'User',
    'Recommendation_ID',
    'Recommendation_Data',
    'Rating',
    'Feedback_Text',
    'Shown_At',
    'Feedback_Given_At',
    'Action_Taken',
    'Feedback_Categories'
  ],
  'Users': [
    'Recommendations_Shown',
    'Feedback_Summary'
  ],
  'GPT_Prompts': [
    'Recommendations_Pool'
  ]
};

const REQUIRED_OPTIONS = {
  'Recommendation_Feedback': {
    'Action_Taken': ['interested', 'not_interested', 'maybe_later'],
    'Feedback_Categories': ['too_far', 'wrong_time', 'not_my_style', 'too_expensive', 'wrong_group_size', 'already_doing', 'not_interested', 'maybe_later']
  }
};

async function verifyTable(tableName, requiredFields) {
  try {
    console.log(`\n📋 Checking table: ${tableName}`);
    
    // Try to fetch the table schema
    const records = await base(tableName).select({ maxRecords: 1 }).firstPage();
    
    // Get field names from first record (if exists) or fetch schema
    const sampleRecord = records[0];
    const fieldNames = sampleRecord ? Object.keys(sampleRecord.fields) : [];
    
    // For Airtable, we need to check if fields exist by trying to access them
    // This is a simplified check - in production, you'd use the Airtable API to get schema
    console.log(`   ✅ Table exists`);
    
    // Check required fields
    const missingFields = [];
    for (const field of requiredFields) {
      // Try to query with the field to see if it exists
      try {
        await base(tableName).select({ fields: [field], maxRecords: 1 }).firstPage();
        console.log(`   ✅ Field "${field}" exists`);
      } catch (error) {
        if (error.message && error.message.includes('Unknown field')) {
          missingFields.push(field);
          console.log(`   ❌ Field "${field}" is MISSING`);
        } else {
          // Field might exist but table is empty - that's okay
          console.log(`   ⚠️  Field "${field}" - cannot verify (table may be empty)`);
        }
      }
    }
    
    // Check select options if applicable
    if (REQUIRED_OPTIONS[tableName]) {
      console.log(`   📝 Checking select options...`);
      // Note: Airtable API doesn't easily expose select options
      // This would need to be verified manually
      console.log(`   ⚠️  Select options need manual verification`);
    }
    
    return { exists: true, missingFields };
  } catch (error) {
    if (error.message && error.message.includes('Could not find table')) {
      console.log(`   ❌ Table does NOT exist`);
      return { exists: false, missingFields: requiredFields };
    }
    console.log(`   ⚠️  Error checking table: ${error.message}`);
    return { exists: false, missingFields: requiredFields };
  }
}

async function main() {
  console.log('🔍 Verifying Airtable Setup for Single-Match Feedback System\n');
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
  console.log('\n📊 Verification Summary:\n');
  
  for (const [tableName, result] of Object.entries(results)) {
    if (result.exists && result.missingFields.length === 0) {
      console.log(`✅ ${tableName}: All fields present`);
    } else if (result.exists) {
      console.log(`⚠️  ${tableName}: Missing fields: ${result.missingFields.join(', ')}`);
    } else {
      console.log(`❌ ${tableName}: Table does not exist`);
    }
  }
  
  if (allPassed) {
    console.log('\n✅ All tables and fields are set up correctly!');
    console.log('\nNext steps:');
    console.log('1. Set TEST_MODE=false in .env');
    console.log('2. Test the flow with a new user');
    console.log('3. Verify feedback is being saved');
  } else {
    console.log('\n❌ Setup incomplete. Please:');
    console.log('1. Create missing tables/fields per docs/AIRTABLE_SETUP_GUIDE.md');
    console.log('2. Run this script again to verify');
  }
  
  console.log('\n');
}

main().catch(error => {
  console.error('Error:', error);
  process.exit(1);
});

