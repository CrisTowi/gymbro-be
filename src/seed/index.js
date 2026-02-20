require('dotenv').config();
const mongoose = require('mongoose');
const Exercise = require('../models/Exercise');
const WeeklyPlan = require('../models/WeeklyPlan');
const exerciseSeedData = require('./exercises');

// Day slots are now Routine ObjectIds; unclaimed plan has no user so use nulls
const DEFAULT_PLAN = {
  monday: null,
  tuesday: null,
  wednesday: null,
  thursday: null,
  friday: null,
  saturday: null,
  sunday: null,
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Seed exercises (global catalog)
    await Exercise.deleteMany({});
    const exercises = await Exercise.insertMany(exerciseSeedData);
    console.log(`Seeded ${exercises.length} exercises`);

    // Routines are now per-user; users get defaults via POST /api/routines/seed-defaults

    // Seed default weekly plan only for legacy/unclaimed (no userId)
    const existingPlan = await WeeklyPlan.findOne();
    if (!existingPlan) {
      await WeeklyPlan.create(DEFAULT_PLAN);
      console.log('Seeded default weekly plan');
    } else {
      console.log('Weekly plan already exists, skipping');
    }

    console.log('Seed completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  }
}

seed();
