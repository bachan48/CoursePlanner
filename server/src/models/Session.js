import mongoose from 'mongoose';

const sessionSchema = new mongoose.Schema(
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
    classSchedule: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ClassSchedule',
      default: null,
    },
    week: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Week',
      required: [true, 'Week reference is required'],
      index: true,
    },
    date: {
      type: Date,
      required: [true, 'Session date is required'],
    },
    type: {
      type: String,
      enum: {
        values: ['lecture', 'lab', 'tutorial'],
        message: 'Invalid session type',
      },
      required: [true, 'Session type is required'],
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
    speaker: {
      type: String,
      trim: true,
      default: '',
    },
    readingMaterials: {
      type: [String],
      default: [],
    },
    activities: {
      type: [String],
      default: [],
    },
    isCancelled: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

sessionSchema.index({ user: 1, course: 1, date: 1 });

export default mongoose.model('Session', sessionSchema);
