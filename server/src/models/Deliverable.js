import mongoose from 'mongoose';

const deliverableSchema = new mongoose.Schema(
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
    title: {
      type: String,
      required: [true, 'Deliverable title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    type: {
      type: String,
      enum: {
        values: ['assignment', 'quiz', 'exam', 'project', 'lab', 'other'],
        message: 'Invalid deliverable type',
      },
      required: [true, 'Deliverable type is required'],
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: '',
    },
    weight: {
      type: Number,
      min: [0, 'Weight must be a positive number'],
      max: [100, 'Weight cannot exceed 100'],
      default: 0,
    },
    isCompleted: {
      type: Boolean,
      default: false,
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

// Indexes for efficient queries
deliverableSchema.index({ user: 1, isDeleted: 1 });
deliverableSchema.index({ user: 1, course: 1 });
deliverableSchema.index({ dueDate: 1 });
deliverableSchema.index({ isCompleted: 1, dueDate: 1 });

export default mongoose.model('Deliverable', deliverableSchema);