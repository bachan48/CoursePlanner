import mongoose from 'mongoose';

const classScheduleSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: {
        values: ['lecture', 'lab', 'tutorial'],
        message: 'Invalid class type',
      },
      required: [true, 'Class type is required'],
    },
    daysOfWeek: {
      type: [String],
      required: true,
      validate: {
        validator: function (value) {
          const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          return value.length > 0 && value.every((day) => validDays.includes(day));
        },
        message: 'Please select at least one valid day of the week',
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
  },
  {
    timestamps: true,
  }
);

classScheduleSchema.index({ user: 1, course: 1 });

export default mongoose.model('ClassSchedule', classScheduleSchema);
