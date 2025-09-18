import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Teacher',
    required: true,
  },
  startTime: {
    type: Date,
    default: Date.now,
  },
  endTime: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'expired'],
    default: 'active',
  },
  // This could be a QR code identifier, a network name, etc.
  sessionKey: {
    type: String,
    required: true,
    unique: true,
  },
  teacherIp: {
    type: String,
    required: true,
  },
});

export default mongoose.models.Session || mongoose.model('Session', SessionSchema);