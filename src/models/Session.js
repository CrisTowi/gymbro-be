const mongoose = require('mongoose');

const setLogSchema = new mongoose.Schema(
  {
    setNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    reps: {
      type: Number,
      required: true,
      default: 0,
    },
    weightLbs: {
      type: Number,
      required: true,
      default: 0,
    },
    completed: {
      type: Boolean,
      default: false,
    },
    rpe: {
      type: Number,
      min: 1,
      max: 10,
    },
    timestamp: {
      type: String,
    },
  },
  { _id: false }
);

const exerciseLogSchema = new mongoose.Schema(
  {
    exerciseId: {
      type: String,
      required: true,
    },
    sets: {
      type: [setLogSchema],
      default: [],
    },
    notes: {
      type: String,
    },
  },
  { _id: false }
);

const personalRecordSchema = new mongoose.Schema(
  {
    exerciseId: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['max-weight', 'max-reps', 'max-volume'],
      required: true,
    },
    value: {
      type: Number,
      required: true,
    },
    previousValue: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const sessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
    },
    routineId: {
      type: String,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
    },
    exercises: {
      type: [exerciseLogSchema],
      default: [],
    },
    completed: {
      type: Boolean,
      default: false,
    },
    totalWeightLbs: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
    },
    personalRecords: {
      type: [personalRecordSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Session', sessionSchema);
