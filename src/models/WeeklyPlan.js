const mongoose = require('mongoose');

const dayField = {
  type: String,
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
