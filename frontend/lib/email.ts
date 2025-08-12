import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface BookingEmailData {
  to: string
  guestName: string
  startDate: string
  endDate: string
  bookingType: string
  amount: number
  contact: string
  notes?: string
  startTime?: string
  endTime?: string
}

export async function sendBookingConfirmation(data: BookingEmailData) {
  try {
    console.log('📧 Sending booking confirmation email to:', data.to)
    
    // Format booking type for display
    const bookingTypeLabel = {
      'investor': 'Personal Use',
      'friend': 'Friends & Family',
      'guest': 'Paying Client'
    }[data.bookingType] || data.bookingType

    // Format time display
    let timeDisplay = ''
    if (data.startTime && data.endTime) {
      timeDisplay = `<p><strong>Time:</strong> ${data.startTime} - ${data.endTime}</p>`
    }

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9ff;">
        <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 30px; border-radius: 12px; text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 28px;">🎉 Booking Confirmed!</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Callabo Creative Space</p>
        </div>
        
        <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-top: 0;">Booking Details</h2>
          
          <div style="background: #f8f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #667eea; margin: 20px 0;">
            <p style="margin: 0 0 10px 0;"><strong>Guest:</strong> ${data.guestName}</p>
            <p style="margin: 0 0 10px 0;"><strong>Dates:</strong> ${data.startDate} to ${data.endDate}</p>
            ${timeDisplay}
            <p style="margin: 0 0 10px 0;"><strong>Type:</strong> ${bookingTypeLabel}</p>
            <p style="margin: 0 0 10px 0;"><strong>Amount:</strong> $${data.amount}</p>
            <p style="margin: 0 0 10px 0;"><strong>Contact:</strong> ${data.contact}</p>
            ${data.notes ? `<p style="margin: 0;"><strong>Notes:</strong> ${data.notes}</p>` : ''}
          </div>
          
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #15803d; margin: 0 0 10px 0;">📍 Location</h3>
            <p style="margin: 0; color: #374151;">Callabo Creative Space<br>Hapeville, GA</p>
          </div>
          
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #d97706; margin: 0 0 10px 0;">ℹ️ Important</h3>
            <p style="margin: 0; color: #374151;">Please save this confirmation email for your records. For any changes or questions, contact us at support@callabo.app</p>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; color: #666; font-size: 14px;">
          <p>Thank you for choosing Callabo Creative Space!</p>
          <p>📞 Questions? Email us at support@callabo.app</p>
        </div>
      </div>
    `

    const { data: result, error } = await resend.emails.send({
      from: 'Callabo Creative Space <onboarding@resend.dev>',
      to: [data.to],
      subject: `🎉 Booking Confirmed - ${data.startDate}${data.endDate !== data.startDate ? ` to ${data.endDate}` : ''}`,
      html: htmlContent,
    })

    if (error) {
      console.error('❌ Email sending failed:', error)
      throw error
    }

    console.log('✅ Email sent successfully:', result?.id)
    return { success: true, id: result?.id }

  } catch (error) {
    console.error('❌ Email service error:', error)
    
    // Fallback: Log email content if sending fails
    console.log('📧 EMAIL NOTIFICATION (FALLBACK):', {
      to: data.to,
      subject: `🎉 Booking Confirmed - ${data.startDate}`,
      guestName: data.guestName,
      bookingType: data.bookingType,
      amount: data.amount
    })
    
    return { success: false, error }
  }
}