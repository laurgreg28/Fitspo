const mongoose = require('mongoose');

const StyleProfileSchema = new mongoose.Schema({
	userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
	answers: { type: Object, default: {} },
	primaryStyle: { type: String, trim: true },
	secondaryStyles: { type: [String], default: [] },
	colorPalette: { type: [String], default: [] },
	tailoring: { type: [String], default: [] },
	confidence: { type: Number, default: 0 },
	completedDate: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('StyleProfile', StyleProfileSchema);
