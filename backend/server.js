import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bookingRoutes from './src/routes/bookings.js';
import { supabase } from './src/services/supabase.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Test Supabase connection
    const { data, error } = await supabase
      .from('callabo_investors')
      .select('count')
      .limit(1);
    
    res.json({ 
      status: 'OK', 
      service: 'Callabo Backend',
      database: error ? 'Not Connected' : 'Connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      service: 'Callabo Backend',
      error: error.message 
    });
  }
});

// API Routes
app.use('/api', bookingRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`Callabo backend running on port ${PORT}`);
  console.log(`Supabase URL: ${process.env.SUPABASE_URL}`);
});