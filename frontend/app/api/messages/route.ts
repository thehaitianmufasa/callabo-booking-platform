import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Twilio configuration (to be added to .env.local)
const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

// GET /api/messages - Get messages for a user
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const contactId = searchParams.get('contactId')
    
    let query = supabase
      .from('callabo_messages')
      .select('*')
      .order('created_at', { ascending: true })
    
    if (userId && contactId) {
      query = query.or(`and(sender_id.eq.${userId},recipient_id.eq.${contactId}),and(sender_id.eq.${contactId},recipient_id.eq.${userId})`)
    } else if (userId) {
      query = query.or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    }
    
    const { data: messages, error } = await query
    
    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }
    
    return NextResponse.json({ messages })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/messages - Send a new message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { sender_id, recipient_id, message, send_sms, recipient_phone } = body
    
    // Validate required fields
    if (!sender_id || !recipient_id || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    
    // Save message to database
    const { data: savedMessage, error } = await supabase
      .from('callabo_messages')
      .insert({
        sender_id,
        recipient_id,
        message,
        is_sms: send_sms || false,
        status: 'sent'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error saving message:', error)
      return NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
    }
    
    // Send SMS if requested
    if (send_sms && recipient_phone && twilioAccountSid && twilioAuthToken && twilioPhoneNumber) {
      try {
        const twilioClient = require('twilio')(twilioAccountSid, twilioAuthToken)
        
        const smsResult = await twilioClient.messages.create({
          body: `Callabo Message: ${message}`,
          from: twilioPhoneNumber,
          to: recipient_phone
        })
        
        // Update message status
        await supabase
          .from('callabo_messages')
          .update({ sms_id: smsResult.sid, status: 'delivered' })
          .eq('id', savedMessage.id)
          
      } catch (smsError) {
        console.error('SMS sending failed:', smsError)
        // Message saved but SMS failed - update status
        await supabase
          .from('callabo_messages')
          .update({ status: 'sms_failed' })
          .eq('id', savedMessage.id)
      }
    }
    
    return NextResponse.json({ 
      message: savedMessage,
      success: true 
    })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/messages/:id - Mark message as read
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { messageId, status } = body
    
    if (!messageId) {
      return NextResponse.json({ error: 'Message ID required' }, { status: 400 })
    }
    
    const { data, error } = await supabase
      .from('callabo_messages')
      .update({ 
        status: status || 'read',
        read_at: new Date().toISOString()
      })
      .eq('id', messageId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating message:', error)
      return NextResponse.json({ error: 'Failed to update message' }, { status: 500 })
    }
    
    return NextResponse.json({ message: data })
  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}