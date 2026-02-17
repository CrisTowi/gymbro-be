const mongoose = require('mongoose');

const ROUTINE_TYPES_OR_NULL = ['push', 'pull', 'legs', 'full-body', null];

const dayField = {
  type: String,
  enum: ROUTINE_TYPES_OR_NULL,
  default: null,
};

const weeklyPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    monday: dayField,
    tuesday: dayField,
    wednesday: dayField,
    thursday: dayField,
    friday: dayField,
    saturday: dayField,
    sunday: dayField,
  },
  { timestamps: true }
);

module.exports = mongoose.model('WeeklyPlan', weeklyPlanSchema);
