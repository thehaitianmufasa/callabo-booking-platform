import { format } from 'date-fns'

interface BookingDetailsProps {
  date: Date
  investors: Array<{
    id: string
    name: string
    nights_used: number
  }>
}

interface TimeSlot {
  time: string
  description: string
  available: boolean
  startTime?: string
  endTime?: string
}

export default function BookingDetails({ date, investors }: BookingDetailsProps) {
  // Generate available booking time slots for the selected date
  const getAvailableSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = [
      { time: 'All Day', description: 'Full day access (24 hours)', available: true, startTime: '00:00', endTime: '23:59' },
      { time: 'Morning', description: '6:00 AM - 12:00 PM', available: true, startTime: '06:00', endTime: '12:00' },
      { time: 'Afternoon', description: '12:00 PM - 6:00 PM', available: true, startTime: '12:00', endTime: '18:00' },
      { time: 'Evening', description: '6:00 PM - 12:00 AM', available: true, startTime: '18:00', endTime: '24:00' },
    ]
    return slots
  }

  const availableSlots = getAvailableSlots()

  const handleQuickBook = (slot: TimeSlot) => {
    // Create booking data for the selected time slot
    const bookingData = {
      start_date: format(date, 'yyyy-MM-dd'),
      end_date: format(date, 'yyyy-MM-dd'), // Same day booking
      booking_type: 'investor', // Default to personal use
      guest_name: `Quick Booking - ${slot.time}`,
      guest_contact: 'booking@callabo.com',
      notes: `Quick booked for ${slot.time} (${slot.description})`,
      time_slot: `${slot.startTime}-${slot.endTime}`
    }

    // Navigate to booking page with pre-filled data
    const params = new URLSearchParams(bookingData).toString()
    window.location.href = `/bookings/new?${params}`
  }

  const handleCustomTime = () => {
    // Navigate to booking page for custom time selection
    const bookingData = {
      start_date: format(date, 'yyyy-MM-dd'),
      end_date: format(date, 'yyyy-MM-dd'),
      custom_time: 'true'
    }
    const params = new URLSearchParams(bookingData).toString()
    window.location.href = `/bookings/new?${params}`
  }

  return (
    <div style={{
      padding: '30px', 
      borderTop: '1px solid #f0f0f0'
    }}>
      <h3 style={{
        fontWeight: '700', 
        marginBottom: '24px',
        fontSize: '20px',
        margin: '0 0 24px 0',
        color: '#333'
      }}>
        {format(date, 'MMMM d')} - Available Time Slots
      </h3>
      
      {/* Available Time Slots */}
      <div style={{
        display: 'flex', 
        flexDirection: 'column', 
        gap: '12px',
        marginBottom: '24px'
      }}>
        {availableSlots.map((slot, index) => (
          <div key={index} style={{
            display: 'flex', 
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px',
            borderRadius: '12px',
            background: '#f8f9ff',
            border: '1px solid #e8e9ff',
            transition: 'all 0.3s ease',
            cursor: slot.available ? 'pointer' : 'not-allowed'
          }}
          onClick={() => slot.available && handleQuickBook(slot)}
          onMouseOver={(e) => {
            if (slot.available) {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.2)'
              e.currentTarget.style.background = '#eef2ff'
            }
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
            e.currentTarget.style.background = '#f8f9ff'
          }}
          >
            <div>
              <div style={{
                fontWeight: '600',
                fontSize: '16px',
                color: '#333',
                marginBottom: '4px'
              }}>
                {slot.time}
              </div>
              <div style={{
                fontSize: '14px',
                color: '#666',
                opacity: 0.8
              }}>
                {slot.description}
              </div>
            </div>
            
            <div style={{
              padding: '6px 12px',
              borderRadius: '20px',
              background: slot.available ? '#dcfce7' : '#fee2e2',
              color: slot.available ? '#16a34a' : '#dc2626',
              fontSize: '12px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              {slot.available ? 'Quick Book' : 'Booked'}
            </div>
          </div>
        ))}
        
        {/* Custom Time Slot Option */}
        <div style={{
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          borderRadius: '12px',
          background: 'linear-gradient(135deg, #f8f9ff, #ffffff)',
          border: '2px dashed #667eea',
          transition: 'all 0.3s ease',
          cursor: 'pointer'
        }}
        onClick={handleCustomTime}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'translateY(-2px)'
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.3)'
          e.currentTarget.style.borderColor = '#764ba2'
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
          e.currentTarget.style.borderColor = '#667eea'
        }}
        >
          <div>
            <div style={{
              fontWeight: '600',
              fontSize: '16px',
              color: '#667eea',
              marginBottom: '4px'
            }}>
              Custom Time
            </div>
            <div style={{
              fontSize: '14px',
              color: '#666',
              opacity: 0.8
            }}>
              Set your own start and end times
            </div>
          </div>
          
          <div style={{
            padding: '6px 12px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #667eea, #764ba2)',
            color: 'white',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            Customize
          </div>
        </div>
      </div>
      
      {/* Friend/Family Rate Section */}
      <div style={{
        padding: '20px',
        borderRadius: '16px',
        background: 'linear-gradient(135deg, #f8f9ff, #ffffff)',
        border: '2px solid #e8e9ff',
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center'
      }}>
        <div>
          <div style={{
            fontWeight: '600',
            fontSize: '16px',
            color: '#333',
            marginBottom: '4px'
          }}>
            Friend/Family Rate
          </div>
          <div style={{
            fontSize: '14px',
            color: '#666',
            opacity: 0.8
          }}>
            For non-investor guests
          </div>
        </div>
        <div style={{
          fontSize: '24px',
          fontWeight: '700',
          color: '#667eea',
          display: 'flex',
          alignItems: 'baseline',
          gap: '4px'
        }}>
          $50<span style={{fontSize: '14px', color: '#666'}}>/night</span>
        </div>
      </div>
    </div>
  )
}