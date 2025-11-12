#!/usr/bin/env node

/**
 * Empower Social - GPT Prompt Test Script
 * Tests the recommendation prompt with OpenAI API
 */

const fs = require('fs');
const https = require('https');

// Load the test prompt
const prompt = fs.readFileSync('./TEST_USER_PROMPT.txt', 'utf8');

// OpenAI API configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY environment variable not set');
  console.log('\nUsage: OPENAI_API_KEY=your_key_here node test_gpt_prompt.js');
  process.exit(1);
}

const requestBody = JSON.stringify({
  model: 'gpt-4-turbo',
  messages: [
    {
      role: 'system',
      content: 'You are an expert social activity recommendation engine for Empower Social.'
    },
    {
      role: 'user',
      content: prompt
    }
  ],
  temperature: 0.7,
  max_tokens: 3000
});

const options = {
  hostname: 'api.openai.com',
  path: '/v1/chat/completions',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OPENAI_API_KEY}`,
    'Content-Length': Buffer.byteLength(requestBody)
  }
};

console.log('🚀 Sending prompt to OpenAI GPT-4-turbo...\n');
console.log('⏳ This may take 30-60 seconds...\n');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      if (response.error) {
        console.error('❌ OpenAI API Error:', response.error.message);
        process.exit(1);
      }
      
      const recommendations = response.choices[0].message.content;
      const usage = response.usage;
      
      console.log('✅ Success! Here are your recommendations:\n');
      console.log('='.repeat(80));
      console.log(recommendations);
      console.log('='.repeat(80));
      console.log('\n📊 Usage Stats:');
      console.log(`   Prompt tokens: ${usage.prompt_tokens}`);
      console.log(`   Completion tokens: ${usage.completion_tokens}`);
      console.log(`   Total tokens: ${usage.total_tokens}`);
      console.log(`   Estimated cost: $${((usage.prompt_tokens * 0.01 + usage.completion_tokens * 0.03) / 1000).toFixed(4)}`);
      
      // Save recommendations to file
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `recommendations_${timestamp}.txt`;
      fs.writeFileSync(filename, recommendations);
      console.log(`\n💾 Saved to: ${filename}`);
      
    } catch (error) {
      console.error('❌ Error parsing response:', error.message);
      console.error('Raw response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  process.exit(1);
});

req.write(requestBody);
req.end();
