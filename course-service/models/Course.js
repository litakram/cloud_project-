const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
	title: { type: String, required: true },
	description: { type: String, default: '' },
	formateurId: { type: mongoose.Schema.Types.ObjectId, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
