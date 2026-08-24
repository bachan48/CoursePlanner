import mongoose from 'mongoose';

const scheduleSchema = new mongoose.Schema(
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
    },
    day: {
      type: String,
      required: [true, 'Day is required'],
      enum: {
        values: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        message: 'Invalid day',
      },
    },
    startTime: {
      type: String,
      required: [true, 'Start time is required'],
    },
    endTime: {
      type: String,
      required: [true, 'End time is required'],
    },
    location: {
      type: String,
      trim: true,
      default: '',
    },
    type: {
      type: String,
      enum: {
        values: ['lecture', 'lab', 'tutorial', 'seminar', 'other'],
        message: 'Invalid schedule type',
      },
      default: 'lecture',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
scheduleSchema.index({ user: 1, isDeleted: 1 });
scheduleSchema.index({ user: 1, day: 1, startTime: 1 });

export default mongoose.model('Schedule', scheduleSchema);