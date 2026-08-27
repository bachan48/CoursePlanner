import mongoose from 'mongoose';

const courseSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    semester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Semester',
      required: [true, 'Semester is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    code: {
      type: String,
      required: [true, 'Course code is required'],
      trim: true,
      uppercase: true,
      match: [/^[A-Z]{2,6}\d{2,4}[A-Z]?$/, 'Please provide a valid course code (e.g., CS101, SENG480B)'],
    },
    credits: {
      type: Number,
      required: [true, 'Credits are required'],
      min: [0, 'Credits must be a positive number'],
      max: [20, 'Credits cannot exceed 20'],
    },
    instructor: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    color: {
      type: String,
      default: '#4F46E5',
      match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color'],
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

// Compound index for efficient queries
courseSchema.index({ user: 1, isDeleted: 1 });
courseSchema.index({ user: 1, semester: 1, isDeleted: 1 });
courseSchema.index({ user: 1, code: 1 }, { unique: true, partialFilterExpression: { isDeleted: false } });

export default mongoose.model('Course', courseSchema);
