/**
 * Phone Authentication Test Script
 * 
 * Run this script after completing Twilio setup to verify phone authentication works
 * Usage: node test-phone-auth.js
 */

// Using built-in fetch (Node 18+) or https module for compatibility
const https = require('https');
const { URL } = require('url');

function fetchCompat(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = https.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            json: () => Promise.resolve(jsonData)
          });
        } catch (e) {
          resolve({
            ok: res.statusCode >= 200 && res.statusCode < 300,
            status: res.statusCode,
            text: () => Promise.resolve(data)
          });
        }
      });
    });

    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

const SUPABASE_URL = 'https://xgfkhrxabdkjkzduvqnu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhnZmtocnhhYmRramt6ZHV2cW51Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk5NDk0MjAsImV4cCI6MjA2NTUyNTQyMH0.kMrOOM8L76ENV6stIv0oqh4ayMjsQyMnF7DufdjXbPA';

async function testPhoneAuth() {
  console.log('🧪 Testing Phone Authentication Setup\n');

  // Test 1: Check auth configuration
  console.log('1. Checking auth configuration...');
  try {
    const response = await fetchCompat(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      }
    });
    
    const settings = await response.json();
    console.log('✅ Phone auth enabled:', settings.external_phone_enabled || false);
    console.log('✅ SMS provider:', settings.sms_provider || 'not configured');
    console.log('');
  } catch (error) {
    console.log('❌ Failed to get auth settings:', error.message);
    return;
  }

  // Test 2: Send OTP to test phone number
  console.log('2. Testing OTP sending...');
  const testPhone = process.argv[2] || '+1234567890'; // Use command line arg or default
  
  try {
    const response = await fetchCompat(`${SUPABASE_URL}/auth/v1/otp`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: testPhone
      })
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('✅ OTP sent successfully to:', testPhone);
      console.log('📱 Check your phone for verification code');
      console.log('');
      console.log('🎉 Phone authentication is working correctly!');
      console.log('');
      console.log('Next steps:');
      console.log('1. Test from your frontend application');
      console.log('2. Verify OTP with the code you received');
      console.log('3. Check Twilio console for delivery status');
    } else {
      console.log('❌ Failed to send OTP:', result.msg || result.error_description);
      console.log('');
      
      // Provide specific troubleshooting based on error
      if (result.msg === 'Unable to get SMS provider') {
        console.log('🔧 Troubleshooting:');
        console.log('- Twilio credentials are not configured');
        console.log('- Complete Twilio setup in TWILIO_SMS_SETUP_GUIDE.md');
        console.log('- Ensure Account SID and Auth Token are correct');
      } else if (result.msg === 'Unsupported phone provider') {
        console.log('🔧 Troubleshooting:');
        console.log('- Phone authentication not enabled');
        console.log('- Check Supabase dashboard Auth settings');
      } else if (result.error_code === 'invalid_phone') {
        console.log('🔧 Troubleshooting:');
        console.log('- Phone number format is invalid');
        console.log('- Use international format: +1234567890');
        console.log('- Include country code');
      }
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
  }
}

// Usage instructions
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Phone Authentication Test Script');
  console.log('');
  console.log('Usage:');
  console.log('  node test-phone-auth.js [phone_number]');
  console.log('');
  console.log('Examples:');
  console.log('  node test-phone-auth.js +1234567890');
  console.log('  node test-phone-auth.js +44123456789');
  console.log('');
  console.log('Note: Use a real phone number to test SMS delivery');
  process.exit(0);
}

testPhoneAuth().catch(console.error);