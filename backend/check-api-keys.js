#!/usr/bin/env node

/**
 * Check which API keys are configured
 * Run with: node check-api-keys.js
 */

require('dotenv').config();

const keys = {
  required: {
    'OPENAI_API_KEY': 'OpenAI API (for GPT-4 recommendations)',
    'AIRTABLE_API_KEY': 'Airtable API (for data storage)',
    'AIRTABLE_BASE_ID': 'Airtable Base ID'
  }
};

console.log('\n🔍 Checking API Key Configuration\n');
console.log('='.repeat(60));

// Check required keys
console.log('\n✅ REQUIRED (System needs these to work):');
let requiredMissing = 0;
for (const [key, description] of Object.entries(keys.required)) {
  const value = process.env[key];
  if (value && value.length > 0) {
    const masked = key === 'AIRTABLE_BASE_ID'
      ? value.substring(0, 8) + '...' + value.substring(value.length - 4)
      : value.substring(0, 8) + '...' + value.substring(value.length - 4);
    console.log(`  ✅ ${key.padEnd(25)} ${description}`);
    console.log(`     Value: ${masked}`);
  } else {
    console.log(`  ❌ ${key.padEnd(25)} ${description} - MISSING`);
    requiredMissing++;
  }
}

// Summary
console.log('\n' + '='.repeat(60));
if (requiredMissing === 0) {
  console.log('\n✅ All required API keys are configured!');
  console.log('\n💡 Optional Configuration:');
  console.log('   - OPENAI_CONCEPT_MODEL: Model to use (default: gpt-4o)');
  console.log('   - TEST_MODE: Set to true for testing (default: false)');
  console.log('   - RECOMMENDATIONS_COUNT: Number of recommendations (default: 5)');
} else {
  console.log(`\n❌ ${requiredMissing} required API key(s) missing`);
  console.log('\n📝 Next Steps:');
  console.log('   1. See docs/API_SETUP_GUIDE.md for setup instructions');
  console.log('   2. Add missing keys to backend/.env');
  console.log('   3. Run this script again to verify');
  process.exit(1);
}

console.log('');
