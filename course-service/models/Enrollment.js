const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, required: true },
	courseId: { type: mongoose.Schema.Types.ObjectId, required: true }
}, { timestamps: true });

// prevent duplicate enrollments at DB level
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
