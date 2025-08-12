'use client'

import { useState, useEffect } from 'react'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth } from 'date-fns'

interface CalendarProps {
  onDateSelect: (date: Date) => void
  bookings: Array<{
    id: string
    start_date: string
    end_date: string
    guest_name: string
    booking_type: string
    amount: number
    notes?: string
  }>
}

export default function Calendar({ onDateSelect, bookings }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Debug: Log what bookings we receive
  console.log('📅 Calendar received bookings:', bookings?.length, bookings)


  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const isBooked = (date: Date) => {
    const result = bookings.some(booking => {
      const start = new Date(booking.start_date)
      const end = new Date(booking.end_date)
      
      // Set all dates to same time (noon) to avoid timezone issues
      const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0)
      const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 12, 0, 0)
      const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 12, 0, 0)
      
      const isInRange = checkDate >= startDate && checkDate <= endDate
      
      // Debug logging for specific dates we're testing
      if (date.getDate() === 12 || date.getDate() === 13 || date.getDate() === 16 || date.getDate() === 30 || date.getDate() === 31) {
        console.log(`🔍 Checking date ${date.getDate()}: ${isInRange} (${booking.guest_name}, ${booking.start_date} - ${booking.end_date})`)
      }
      
      return isInRange
    })
    return result
  }

  const getBookingForDate = (date: Date) => {
    return bookings.find(booking => {
      const start = new Date(booking.start_date)
      const end = new Date(booking.end_date)
      
      // Set all dates to same time (noon) to avoid timezone issues
      const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12, 0, 0)
      const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 12, 0, 0)
      const endDate = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 12, 0, 0)
      
      return checkDate >= startDate && checkDate <= endDate
    })
  }

  const handleDateClick = (date: Date) => {
    const booking = getBookingForDate(date)
    
    if (booking) {
      // Show booking details for booked dates
      const bookingTypeLabel = {
        'investor': 'Personal Use',
        'friend': 'Friend/Family',
        'guest': 'Paying Client'
      }[booking.booking_type] || booking.booking_type
      
      alert(`📅 ${format(date, 'MMMM d, yyyy')} - BOOKED\n\n` +
            `👤 Guest: ${booking.guest_name}\n` +
            `📋 Type: ${bookingTypeLabel}\n` +
            `💰 Amount: $${booking.amount}\n` +
            `📝 Notes: ${booking.notes || 'None'}\n` +
            `📆 Duration: ${format(new Date(booking.start_date), 'MMM d')} - ${format(new Date(booking.end_date), 'MMM d')}`)
    } else {
      // Handle available date selection
      setSelectedDate(date)
      onDateSelect(date)
    }
  }

  // Get all days for the calendar grid including previous/next month days
  const startDate = new Date(monthStart)
  startDate.setDate(startDate.getDate() - monthStart.getDay()) // Start from Sunday of first week
  
  const endDate = new Date(monthEnd)
  endDate.setDate(endDate.getDate() + (6 - monthEnd.getDay())) // End on Saturday of last week
  
  const allDays = eachDayOfInterval({ start: startDate, end: endDate })

  return (
    <div style={{padding: '30px'}}>
      {/* Calendar Header */}
      <div style={{
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between', 
        marginBottom: '30px'
      }}>
        <button
          onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1))}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#764ba2',
            padding: '10px',
            borderRadius: '50%',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#f8f9ff'
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'none'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          ‹
        </button>
        
        <h2 style={{
          fontSize: '24px',
          fontWeight: '600',
          color: '#333',
          margin: 0
        }}>
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        
        <button
          onClick={() => setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1))}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            color: '#764ba2',
            padding: '10px',
            borderRadius: '50%',
            transition: 'all 0.3s ease'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#f8f9ff'
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'none'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          ›
        </button>
      </div>

      {/* Calendar Table */}
      <table style={{
        width: '100%',
        borderCollapse: 'collapse'
      }}>
        <thead>
          <tr>
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
              <th key={day} style={{
                padding: '15px 10px',
                textAlign: 'center',
                fontWeight: '600',
                color: '#666',
                fontSize: '14px',
                borderBottom: '2px solid #f0f0f0'
              }}>
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: Math.ceil(allDays.length / 7) }, (_, weekIndex) => (
            <tr key={weekIndex}>
              {allDays.slice(weekIndex * 7, (weekIndex + 1) * 7).map(day => {
                const booked = isBooked(day)
                const booking = getBookingForDate(day)
                const selected = selectedDate && day.toDateString() === selectedDate.toDateString()
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const isAvailable = !booked && isCurrentMonth
                
                // Determine booking type for color coding
                const bookingType = booking?.booking_type
                const isFriendsFamily = bookingType === 'friend'
                const isPersonalUse = bookingType === 'investor'
                const isPayingClient = bookingType === 'guest'
                
                return (
                  <td key={day.toISOString()} style={{padding: 0, textAlign: 'center', position: 'relative'}}>
                    <button
                      onClick={() => handleDateClick(day)}
                      disabled={!isCurrentMonth}
                      style={{
                        width: '100%',
                        height: '60px',
                        border: 'none',
                        background: selected 
                          ? 'linear-gradient(135deg, #667eea, #764ba2)'
                          : isAvailable 
                            ? 'linear-gradient(135deg, #4ade80, #22c55e)'
                            : booked
                              ? isFriendsFamily 
                                ? '#fef3c7'  // Yellow for Friends & Family
                                : isPersonalUse 
                                  ? '#e0e7ff'  // Light blue for Personal Use
                                  : isPayingClient 
                                    ? '#fee2e2'  // Light red for Paying Clients
                                    : '#f3f4f6'  // Gray fallback
                              : !isCurrentMonth
                                ? '#f9f9f9'
                                : 'none',
                        fontSize: '16px',
                        fontWeight: '500',
                        cursor: !isCurrentMonth ? 'not-allowed' : 'pointer',
                        borderRadius: '12px',
                        margin: '4px',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: selected
                          ? 'white'
                          : isAvailable
                            ? 'white'
                            : booked
                              ? isFriendsFamily 
                                ? '#d97706'  // Orange text for Friends & Family
                                : isPersonalUse 
                                  ? '#4338ca'  // Blue text for Personal Use
                                  : isPayingClient 
                                    ? '#dc2626'  // Red text for Paying Clients
                                    : '#374151'  // Gray text fallback
                              : !isCurrentMonth
                                ? '#ccc'
                                : '#333',
                        boxShadow: selected
                          ? '0 6px 20px rgba(102, 126, 234, 0.4)'
                          : isAvailable
                            ? '0 4px 15px rgba(34, 197, 94, 0.3)'
                            : 'none'
                      }}
                      onMouseOver={(e) => {
                        if (isCurrentMonth) {
                          e.currentTarget.style.transform = 'translateY(-2px)'
                          if (selected) {
                            e.currentTarget.style.boxShadow = '0 8px 25px rgba(102, 126, 234, 0.5)'
                          } else if (isAvailable) {
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(34, 197, 94, 0.4)'
                            e.currentTarget.style.transform = 'translateY(-3px)'
                          } else if (booked) {
                            if (isFriendsFamily) {
                              e.currentTarget.style.background = '#fde68a'  // Darker yellow on hover
                              e.currentTarget.style.boxShadow = '0 4px 15px rgba(217, 119, 6, 0.3)'
                            } else if (isPersonalUse) {
                              e.currentTarget.style.background = '#c7d2fe'  // Darker blue on hover
                              e.currentTarget.style.boxShadow = '0 4px 15px rgba(67, 56, 202, 0.3)'
                            } else {
                              e.currentTarget.style.background = '#fecaca'  // Red for paying clients
                              e.currentTarget.style.boxShadow = '0 4px 15px rgba(220, 38, 38, 0.3)'
                            }
                          } else {
                            e.currentTarget.style.background = 'linear-gradient(135deg, #667eea20, #764ba220)'
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.2)'
                          }
                        }
                      }}
                      onMouseOut={(e) => {
                        if (isCurrentMonth) {
                          e.currentTarget.style.transform = 'translateY(0)'
                          if (selected) {
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)'
                          } else if (isAvailable) {
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(34, 197, 94, 0.3)'
                          } else if (booked) {
                            if (isFriendsFamily) {
                              e.currentTarget.style.background = '#fef3c7'  // Yellow for Friends & Family
                            } else if (isPersonalUse) {
                              e.currentTarget.style.background = '#e0e7ff'  // Light blue for Personal Use
                            } else {
                              e.currentTarget.style.background = '#fee2e2'  // Light red for Paying Clients
                            }
                            e.currentTarget.style.boxShadow = 'none'
                          } else {
                            e.currentTarget.style.background = 'none'
                            e.currentTarget.style.boxShadow = 'none'
                          }
                        }
                      }}
                    >
                      {format(day, 'd')}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Booking Type Legend */}
      <div style={{
        marginTop: '20px',
        padding: '16px',
        background: '#f8f9ff',
        borderRadius: '12px',
        display: 'flex',
        justifyContent: 'center',
        gap: '24px',
        flexWrap: 'wrap'
      }}>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <div style={{
            width: '16px',
            height: '16px',
            background: 'linear-gradient(135deg, #4ade80, #22c55e)',
            borderRadius: '4px'
          }}></div>
          <span style={{fontSize: '14px', color: '#374151'}}>Available</span>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <div style={{
            width: '16px',
            height: '16px',
            background: '#e0e7ff',
            borderRadius: '4px'
          }}></div>
          <span style={{fontSize: '14px', color: '#374151'}}>Personal Use</span>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <div style={{
            width: '16px',
            height: '16px',
            background: '#fef3c7',
            borderRadius: '4px'
          }}></div>
          <span style={{fontSize: '14px', color: '#374151'}}>Friends & Family</span>
        </div>
        <div style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
          <div style={{
            width: '16px',
            height: '16px',
            background: '#fee2e2',
            borderRadius: '4px'
          }}></div>
          <span style={{fontSize: '14px', color: '#374151'}}>Paying Client</span>
        </div>
      </div>
    </div>
  )
}