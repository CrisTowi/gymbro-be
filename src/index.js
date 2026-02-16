require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

const exerciseRoutes = require('./routes/exercises');
const routineRoutes = require('./routes/routines');
const sessionRoutes = require('./routes/sessions');
const weeklyPlanRoutes = require('./routes/weeklyPlan');
const statsRoutes = require('./routes/stats');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/exercises', exerciseRoutes);
app.use('/api/routines', routineRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/weekly-plan', weeklyPlanRoutes);
app.use('/api/stats', statsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`GymTrack API running on port ${PORT}`);
  });
});

module.exports = app;
