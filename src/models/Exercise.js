const mongoose = require('mongoose');

const MUSCLE_GROUPS = [
  'chest', 'back', 'shoulders', 'biceps', 'triceps',
  'quadriceps', 'hamstrings', 'glutes', 'calves', 'core',
  'forearms', 'traps',
];

const EQUIPMENT = [
  'barbell', 'dumbbell', 'cable', 'machine', 'bodyweight',
  'kettlebell', 'ez-bar', 'smith-machine', 'resistance-band',
];

const exerciseSchema = new mongoose.Schema(
  {
    exerciseId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: MUSCLE_GROUPS,
    },
    secondaryMuscles: {
      type: [{ type: String, enum: MUSCLE_GROUPS }],
      default: [],
    },
    equipment: {
      type: String,
      required: true,
      enum: EQUIPMENT,
    },
    description: {
      type: String,
      required: true,
    },
    instructions: {
      type: [String],
      default: [],
    },
    tags: {
      type: [String],
      default: [],
    },
    referenceUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Exercise', exerciseSchema);
