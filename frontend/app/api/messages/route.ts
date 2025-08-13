import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Email notification function
async function sendEmailNotification(params: {
  to: string
  recipientName: string
  senderName: string
  message: string
  messageId: string
}) {
  const { to, recipientName, senderName, message, messageId } = params
  
  // Create the respond URL
  const respondUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/?message_id=${messageId}&tab=messages`
  
  // Email HTML template
  const emailHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Message from ${senderName}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 30px; border-radius: 12px 12px 0 0; text-align: center; }
        .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
        .message-box { background: #f8f9ff; padding: 20px; border-radius: 12px; margin: 20px 0; border-left: 4px solid #667eea; }
        .respond-btn { display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2); color: white !important; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; }
        .footer { background: #f8f9ff; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 12px 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>CALLABO</h1>
          <p>New Message Received</p>
        </div>
        <div class="content">
          <h2>Hi ${recipientName}!</h2>
          <p>You received a new message from <strong>${senderName}</strong> on Callabo:</p>
          
          <div class="message-box">
            <strong>Message:</strong><br>
            "${message}"
          </div>
          
          <p>To respond to this message, click the button below:</p>
          <a href="${respondUrl}" class="respond-btn">Respond on Callabo</a>
          
          <p style="margin-top: 30px; font-size: 14px; color: #666;">
            This will take you directly to the conversation where you can reply.
          </p>
        </div>
        <div class="footer">
          <p>This email was sent from Callabo Creative Space</p>
          <p>Hapeville, GA</p>
        </div>
      </div>
    </body>
    </html>
  `
  
  // For now, log the email (in production, integrate with email service)
  console.log('📧 Email Notification:')
  console.log('To:', to)
  console.log('Subject: New Message from', senderName)
  console.log('Respond URL:', respondUrl)
  console.log('HTML Content:', emailHTML)
  
  // TODO: Replace with actual email service integration
  // Examples: SendGrid, Mailgun, AWS SES, etc.
  // For now, we'll simulate success
  return Promise.resolve(true)
}

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
      query = query.or(`and(from_user_id.eq.${userId},to_user_id.eq.${contactId}),and(from_user_id.eq.${contactId},to_user_id.eq.${userId})`)
    } else if (userId) {
      query = query.or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
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
    
    // Save message to database using correct column names
    const { data: savedMessage, error } = await supabase
      .from('callabo_messages')
      .insert({
        from_user_id: sender_id,
        to_user_id: recipient_id,
        message,
        is_incoming: false,
        is_read: false
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error saving message:', error)
      return NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
    }
    
    // Send email notification to recipient
    try {
      // Get sender and recipient info using investor IDs directly
      const { data: senderInfo } = await supabase
        .from('callabo_investors')
        .select('name, email')
        .eq('id', sender_id)
        .single()

      const { data: recipientInfo } = await supabase
        .from('callabo_investors')
        .select('name, email')
        .eq('id', recipient_id)
        .single()

      if (senderInfo && recipientInfo) {
        // Send email notification (using simple fetch to a webhook or email service)
        await sendEmailNotification({
          to: recipientInfo.email,
          recipientName: recipientInfo.name,
          senderName: senderInfo.name,
          message: message,
          messageId: savedMessage.id
        })
      }
    } catch (emailError) {
      console.error('Email notification failed:', emailError)
      // Continue - don't fail the message send if email fails
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