import mongoose from 'mongoose';

const weekSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
      index: true,
    },
    weekNumber: {
      type: Number,
      required: [true, 'Week number is required'],
      min: [1, 'Week number must be at least 1'],
    },
    startDate: {
      type: Date,
      required: [true, 'Start date is required'],
    },
    endDate: {
      type: Date,
      required: [true, 'End date is required'],
    },
    sprint: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Sprint',
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [4000, 'Notes cannot exceed 4000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

weekSchema.index({ course: 1, weekNumber: 1 }, { unique: true });

export default mongoose.model('Week', weekSchema);
