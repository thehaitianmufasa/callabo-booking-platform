import express from 'express';
import { requireAuth, extractUserInfo, ensureInvestor } from '../middleware/auth.js';
import { 
  getAvailability, 
  createBooking, 
  getInvestorNights,
  getInvestorBookings,
  updateBookingStatus,
  getSpaceAvailability
} from '../services/supabase.js';

const router = express.Router();

// Get availability for a month
router.get('/availability/:year/:month', async (req, res) => {
  try {
    const { year, month } = req.params;
    const bookings = await getAvailability(parseInt(month) - 1, parseInt(year)); // month is 0-indexed
    
    // Generate calendar data
    const daysInMonth = new Date(year, month, 0).getDate();
    const calendar = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dateStr = date.toISOString().split('T')[0];
      
      // Check if this date has any bookings
      const dayBookings = bookings.filter(booking => {
        const start = new Date(booking.start_date);
        const end = new Date(booking.end_date);
        return date >= start && date <= end;
      });
      
      calendar.push({
        date: dateStr,
        day,
        available: dayBookings.length === 0,
        bookings: dayBookings
      });
    }
    
    res.json({ 
      bookings,
      calendar,
      month: parseInt(month),
      year: parseInt(year)
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new booking (requires authentication)
router.post('/bookings', requireAuth, extractUserInfo, ensureInvestor, async (req, res) => {
  try {
    const { start_date, end_date, guest_name, guest_contact, booking_type, amount, notes } = req.body;
    
    // Validate required fields
    if (!start_date || !end_date || !guest_name || !guest_contact || !booking_type) {
      return res.status(400).json({ 
        error: 'Missing required fields: start_date, end_date, guest_name, guest_contact, booking_type' 
      });
    }
    
    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (startDate > endDate) {
      return res.status(400).json({ error: 'Start date must be before end date' });
    }
    
    if (startDate < new Date().setHours(0, 0, 0, 0)) {
      return res.status(400).json({ error: 'Cannot book dates in the past' });
    }
    
    // Check investor night limit if booking type is investor
    if (booking_type === 'investor') {
      const nights = await getInvestorNights(req.investor.id);
      const requestedNights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      
      if (nights.nightsRemaining < requestedNights) {
        return res.status(400).json({ 
          error: `Insufficient nights remaining. You have ${nights.nightsRemaining} nights available this quarter.`,
          nightsRemaining: nights.nightsRemaining,
          nightsRequested: requestedNights
        });
      }
    }
    
    const booking = await createBooking({
      investor_id: req.investor.id,
      start_date,
      end_date,
      guest_name,
      guest_contact,
      booking_type,
      amount: booking_type === 'guest' ? (amount || 0) : 0,
      status: 'pending',
      notes
    });
    
    res.json({ 
      success: true,
      booking,
      message: 'Booking created successfully'
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get investor's bookings
router.get('/bookings/mine', requireAuth, extractUserInfo, ensureInvestor, async (req, res) => {
  try {
    const bookings = await getInvestorBookings(req.investor.id);
    res.json({ bookings });
  } catch (error) {
    console.error('Error fetching investor bookings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get investor nights remaining
router.get('/investors/nights', requireAuth, extractUserInfo, ensureInvestor, async (req, res) => {
  try {
    const nights = await getInvestorNights(req.investor.id);
    res.json({
      ...nights,
      investorName: req.investor.name,
      investorEmail: req.investor.email
    });
  } catch (error) {
    console.error('Error fetching investor nights:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update booking status
router.patch('/bookings/:id/status', requireAuth, extractUserInfo, ensureInvestor, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'confirmed', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be pending, confirmed, or cancelled' });
    }
    
    const booking = await updateBookingStatus(id, status);
    res.json({ 
      success: true,
      booking,
      message: `Booking ${status} successfully`
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get space availability for date range
router.get('/space-availability', async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({ error: 'start_date and end_date are required' });
    }
    
    const availability = await getSpaceAvailability(start_date, end_date);
    res.json({ availability });
  } catch (error) {
    console.error('Error fetching space availability:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;