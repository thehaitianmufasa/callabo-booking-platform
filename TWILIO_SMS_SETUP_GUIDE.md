# Twilio SMS Setup Guide for Callabo Phone Authentication

## Status: Phone Authentication Enabled ✅
Phone authentication has been successfully enabled in your Supabase project. However, you still need to configure Twilio credentials to send SMS messages.

## Current Configuration
- **Phone Authentication**: ✅ Enabled
- **SMS Provider**: Twilio
- **OTP Length**: 6 digits
- **OTP Expiry**: 60 seconds
- **SMS Template**: "Your Callabo verification code is {{ .Code }}. Do not share this code with anyone."

## Required: Twilio Account Setup

### Step 1: Create Twilio Account
1. Go to [https://www.twilio.com/try-twilio](https://www.twilio.com/try-twilio)
2. Sign up for a free account (includes $15 trial credit)
3. Verify your phone number during signup

### Step 2: Get Twilio Credentials
After account creation, navigate to the Twilio Console Dashboard:

1. **Account SID**: Found on your dashboard main page
2. **Auth Token**: Click the "Show" button next to Auth Token on dashboard
3. **Phone Number**: Purchase or use trial phone number

### Step 3: Configure Twilio in Supabase
Once you have your Twilio credentials, run this command to complete the setup:

```bash
curl -X PATCH "https://api.supabase.com/v1/projects/xgfkhrxabdkjkzduvqnu/config/auth" \
  -H "Authorization: Bearer sbp_0a9932aed71424e8c035d584a76a1e6cb6e84b25" \
  -H "Content-Type: application/json" \
  -d '{
    "sms_twilio_account_sid": "YOUR_TWILIO_ACCOUNT_SID",
    "sms_twilio_auth_token": "YOUR_TWILIO_AUTH_TOKEN",
    "sms_twilio_message_service_sid": "YOUR_TWILIO_MESSAGE_SERVICE_SID"
  }'
```

**Replace the placeholders with your actual Twilio credentials:**
- `YOUR_TWILIO_ACCOUNT_SID`: Your Account SID from Twilio Console
- `YOUR_TWILIO_AUTH_TOKEN`: Your Auth Token from Twilio Console  
- `YOUR_TWILIO_MESSAGE_SERVICE_SID`: Your Messaging Service SID (optional but recommended)

### Alternative: Using Twilio Phone Number Directly
If you don't want to use a Messaging Service, you can configure a phone number directly:

```bash
curl -X PATCH "https://api.supabase.com/v1/projects/xgfkhrxabdkjkzduvqnu/config/auth" \
  -H "Authorization: Bearer sbp_0a9932aed71424e8c035d584a76a1e6cb6e84b25" \
  -H "Content-Type: application/json" \
  -d '{
    "sms_twilio_account_sid": "YOUR_TWILIO_ACCOUNT_SID",
    "sms_twilio_auth_token": "YOUR_TWILIO_AUTH_TOKEN"
  }'
```

## Testing Phone Authentication

### Frontend Implementation
Add phone authentication to your frontend code:

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://xgfkhrxabdkjkzduvqnu.supabase.co',
  'your-anon-key'
)

// Sign up with phone number
const signUpWithPhone = async (phone, password) => {
  const { data, error } = await supabase.auth.signUp({
    phone: phone,
    password: password,
  })
  return { data, error }
}

// Sign in with phone OTP (passwordless)
const signInWithOTP = async (phone) => {
  const { data, error } = await supabase.auth.signInWithOtp({
    phone: phone,
  })
  return { data, error }
}

// Verify OTP
const verifyOTP = async (phone, token) => {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: phone,
    token: token,
    type: 'sms',
  })
  return { data, error }
}
```

### Test Steps
1. Complete Twilio setup above
2. Implement phone auth in your frontend
3. Test with a valid phone number (include country code, e.g., +1234567890)
4. Verify you receive SMS with verification code
5. Confirm OTP verification works

## Troubleshooting

### Common Issues:
1. **"Unsupported phone provider" error**: Means Twilio credentials are not configured
2. **SMS not received**: Check phone number format (+country code + number)
3. **Invalid credentials**: Verify Account SID and Auth Token are correct
4. **Rate limiting**: Twilio trial accounts have sending limitations

### Error Codes:
- `422`: Invalid phone number format
- `401`: Invalid Twilio credentials
- `429`: Rate limit exceeded

## Cost Considerations
- **Twilio Trial**: $15 credit (good for ~500 SMS messages)
- **Production**: ~$0.0075 per SMS (varies by country)
- **Recommended**: Start with trial, upgrade for production

## Security Notes
- Store Twilio credentials securely
- Use Messaging Service SID for better deliverability
- Monitor SMS usage to avoid unexpected charges
- Consider implementing CAPTCHA to prevent SMS abuse

## Next Steps
1. Create Twilio account and get credentials
2. Run the configuration command above with your credentials
3. Test phone authentication
4. Monitor SMS delivery and costs
5. Consider upgrading Twilio account for production use

## Support
- Twilio Documentation: https://www.twilio.com/docs/sms
- Supabase Phone Auth Guide: https://supabase.com/docs/guides/auth/phone-login