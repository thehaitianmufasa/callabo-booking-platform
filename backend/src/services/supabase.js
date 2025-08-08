import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://xgfkhrxabdkjkzduvqnu.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
  console.error('Warning: SUPABASE_SERVICE_KEY not found in environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Helper functions for Callabo tables
export const getAvailability = async (month, year) => {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);
  
  const { data: bookings, error } = await supabase
    .from('callabo_bookings')
    .select(`
      id,
      start_date,
      end_date,
      guest_name,
      booking_type,
      status,
      investor:callabo_investors(name)
    `)
    .gte('start_date', startDate.toISOString())
    .lte('end_date', endDate.toISOString())
    .eq('status', 'confirmed');
    
  if (error) throw error;
  return bookings;
};

export const createBooking = async (bookingData) => {
  // First check if dates are available
  const { data: conflicts, error: conflictError } = await supabase
    .from('callabo_bookings')
    .select('id')
    .gte('end_date', bookingData.start_date)
    .lte('start_date', bookingData.end_date)
    .eq('status', 'confirmed');
    
  if (conflictError) throw conflictError;
  if (conflicts && conflicts.length > 0) {
    throw new Error('Dates are not available due to existing bookings');
  }
  
  const { data, error } = await supabase
    .from('callabo_bookings')
    .insert(bookingData)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const getInvestorByClerkId = async (clerkUserId) => {
  const { data, error } = await supabase
    .from('callabo_investors')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .single();
    
  if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
  return data;
};

export const createInvestor = async (investorData) => {
  const { data, error } = await supabase
    .from('callabo_investors')
    .insert(investorData)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const getInvestorNights = async (investorId) => {
  const { data, error } = await supabase
    .from('callabo_investors')
    .select('nights_used, quarter_start')
    .eq('id', investorId)
    .single();
    
  if (error) throw error;
  
  return {
    nightsUsed: data.nights_used || 0,
    nightsRemaining: 3 - (data.nights_used || 0),
    quarterStart: data.quarter_start
  };
};

export const getInvestorBookings = async (investorId) => {
  const { data, error } = await supabase
    .from('callabo_bookings')
    .select('*')
    .eq('investor_id', investorId)
    .order('start_date', { ascending: false });
    
  if (error) throw error;
  return data;
};

export const updateBookingStatus = async (bookingId, status) => {
  const { data, error } = await supabase
    .from('callabo_bookings')
    .update({ status })
    .eq('id', bookingId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const getNotifications = async (investorId) => {
  const { data, error } = await supabase
    .from('callabo_notifications')
    .select('*')
    .eq('investor_id', investorId)
    .eq('read', false)
    .order('created_at', { ascending: false })
    .limit(10);
    
  if (error) throw error;
  return data;
};

export const markNotificationRead = async (notificationId) => {
  const { data, error } = await supabase
    .from('callabo_notifications')
    .update({ read: true })
    .eq('id', notificationId)
    .select()
    .single();
    
  if (error) throw error;
  return data;
};

export const getAnalytics = async () => {
  const { data, error } = await supabase
    .from('callabo_analytics')
    .select('*')
    .order('month', { ascending: false })
    .limit(12);
    
  if (error) throw error;
  return data;
};

export const getSpaceAvailability = async (startDate, endDate) => {
  const { data, error } = await supabase
    .from('callabo_space_availability')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate);
    
  if (error) throw error;
  return data;
};

export const blockDates = async (dates, reason) => {
  const blockedDates = dates.map(date => ({
    date,
    is_available: false,
    blocked_reason: reason
  }));
  
  const { data, error } = await supabase
    .from('callabo_space_availability')
    .upsert(blockedDates, { onConflict: 'date' })
    .select();
    
  if (error) throw error;
  return data;
};