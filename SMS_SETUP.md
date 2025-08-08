# SMS Integration Setup for Callabo

## Overview
The Callabo platform now includes SMS messaging capabilities that allow users to send text messages directly from the platform to other users' phones.

## Features Implemented

### 1. **User Profile Enhancement**
- Added phone number field to user profiles
- Editable profile information including name, email, and phone
- Visual stats display for nights used and total bookings

### 2. **Messaging Panel**
- Real-time messaging interface within the platform
- Contact list with unread message indicators
- Message history view with timestamps
- SMS toggle option for each message

### 3. **SMS Integration**
- API endpoint for sending messages (`/api/messages`)
- Database table for message storage and history
- Twilio integration ready for SMS delivery
- Message status tracking (sent, delivered, read, failed)

## Database Schema

### Messages Table (`callabo_messages`)
```sql
- id: UUID (Primary Key)
- sender_id: UUID (References callabo_investors)
- recipient_id: UUID (References callabo_investors)
- message: TEXT
- is_sms: BOOLEAN
- sms_id: TEXT (Twilio message ID)
- status: TEXT (sent, delivered, read, failed, sms_failed)
- read_at: TIMESTAMP
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

## Setup Instructions

### 1. **Twilio Configuration**
Add the following environment variables to your `/frontend/.env.local` file:

```env
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### 2. **Install Twilio SDK**
```bash
cd frontend
npm install twilio
```

### 3. **Database Migration**
The messages table migration has been created and should be automatically applied. If needed, run:
```bash
SUPABASE_ACCESS_TOKEN="sbp_0a9932aed71424e8c035d584a76a1e6cb6e84b25" ./supabase-cli db push
```

## API Endpoints

### Send Message
```
POST /api/messages
{
  "sender_id": "uuid",
  "recipient_id": "uuid",
  "message": "Your message here",
  "send_sms": true,
  "recipient_phone": "+15551234567"
}
```

### Get Messages
```
GET /api/messages?userId=uuid&contactId=uuid
```

### Mark Message as Read
```
PUT /api/messages
{
  "messageId": "uuid",
  "status": "read"
}
```

## Usage

1. **From the Dashboard:**
   - Click on a contact in the Messages panel
   - Type your message
   - Toggle "SMS" checkbox to also send as text message
   - Click Send

2. **Phone Number Requirements:**
   - Users must add their phone numbers in their profile
   - Phone numbers should be in E.164 format (+1XXXXXXXXXX)

## Security Features

- Row Level Security (RLS) ensures users can only see their own messages
- Messages are stored encrypted in the database
- SMS delivery status is tracked and logged
- Failed SMS attempts are marked but message is still saved in platform

## Next Steps

1. Add push notifications for new messages
2. Implement message threading/replies
3. Add file/image sharing capabilities
4. Create mobile app for better SMS integration
5. Add group messaging functionality

## Troubleshooting

- **SMS not sending:** Check Twilio credentials in .env.local
- **Phone validation errors:** Ensure phone numbers are in correct format
- **Message not appearing:** Check browser console for API errors
- **Database errors:** Verify messages table exists with proper columns

---

**Note:** The SMS feature requires a valid Twilio account with SMS capabilities enabled and sufficient balance for sending messages.