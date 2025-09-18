import mongoose from 'mongoose';

const AttendanceSchema = new mongoose.Schema({
  session: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  course: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late'],
    default: 'present',
  },
  method: {
    type: String,
    enum: ['qr', 'proximity', 'biometric', 'manual', 'qr-proximity'],
    required: true,
  },
});

// Ensure a student can only be marked once per session
AttendanceSchema.index({ session: 1, student: 1 }, { unique: true });

export default mongoose.models.Attendance || mongoose.model('Attendance', AttendanceSchema);