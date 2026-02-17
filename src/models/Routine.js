const mongoose = require('mongoose');

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
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    routineId: {
      type: String,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
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

routineSchema.index({ userId: 1, routineId: 1 }, { unique: true });

module.exports = mongoose.model('Routine', routineSchema);
