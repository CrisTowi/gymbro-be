require('dotenv').config();
const mongoose = require('mongoose');
const Exercise = require('../models/Exercise');
const Routine = require('../models/Routine');
const WeeklyPlan = require('../models/WeeklyPlan');
const exerciseSeedData = require('./exercises');
const routineSeedData = require('./routines');

const DEFAULT_PLAN = {
  monday: 'push',
  tuesday: 'pull',
  wednesday: null,
  thursday: 'legs',
  friday: null,
  saturday: 'full-body',
  sunday: null,
};

async function seed() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Seed exercises
    await Exercise.deleteMany({});
    const exercises = await Exercise.insertMany(exerciseSeedData);
    console.log(`Seeded ${exercises.length} exercises`);

    // Seed routines
    await Routine.deleteMany({});
    const routines = await Routine.insertMany(routineSeedData);
    console.log(`Seeded ${routines.length} routines`);

    // Seed default weekly plan (only if none exists)
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
