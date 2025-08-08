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

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const isBooked = (date: Date) => {
    return bookings.some(booking => {
      const start = new Date(booking.start_date)
      const end = new Date(booking.end_date)
      return date >= start && date <= end
    })
  }

  const getBookingForDate = (date: Date) => {
    return bookings.find(booking => {
      const start = new Date(booking.start_date)
      const end = new Date(booking.end_date)
      return date >= start && date <= end
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
                const selected = selectedDate && day.toDateString() === selectedDate.toDateString()
                const isCurrentMonth = isSameMonth(day, currentMonth)
                const isAvailable = !booked && isCurrentMonth
                
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
                              ? '#fee2e2'
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
                              ? '#dc2626'
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
                            e.currentTarget.style.background = '#fecaca'
                            e.currentTarget.style.boxShadow = '0 4px 15px rgba(220, 38, 38, 0.3)'
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
                            e.currentTarget.style.background = '#fee2e2'
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
    </div>
  )
}