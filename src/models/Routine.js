const mongoose = require('mongoose');

const ROUTINE_TYPES = ['push', 'pull', 'legs', 'full-body'];

const routineExerciseSchema = new mongoose.Schema(
  {
    exerciseId: {
      type: String,
      required: true,
    },
    sets: {
      type: Number,
      required: true,
      min: 1,
    },
    reps: {
      type: Number,
      required: true,
      min: 1,
    },
    restTimeSeconds: {
      type: Number,
      required: true,
      min: 0,
    },
    notes: {
      type: String,
    },
  },
  { _id: false }
);

const routineSchema = new mongoose.Schema(
  {
    routineId: {
      type: String,
      required: true,
      unique: true,
      enum: ROUTINE_TYPES,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    color: {
      type: String,
      required: true,
    },
    icon: {
      type: String,
      required: true,
    },
    exercises: {
      type: [routineExerciseSchema],
      default: [],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Routine', routineSchema);
