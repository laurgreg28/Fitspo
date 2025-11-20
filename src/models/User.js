const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

const UserSchema = new mongoose.Schema({
	userId: { type: String, required: true, unique: true, index: true },
	firstName: { type: String, required: true, trim: true },
	middleName: { type: String, trim: true, default: '' },
	lastName: { type: String, required: true, trim: true },
	username: { type: String, required: true, unique: true, trim: true },
	email: { type: String, required: true, unique: true, lowercase: true, trim: true },
	passwordHash: { type: String },
	dateOfBirth: { type: Date },
	gender: { type: String },
	emailNotifications: { type: Boolean, default: true },
	termsAccepted: { type: Boolean, required: true },
	hasCompletedQuiz: { type: Boolean, default: false },
	quizResults: { type: mongoose.Schema.Types.ObjectId, ref: 'StyleProfile', default: null }
}, { timestamps: true });

// Virtual for setting password (will hash into passwordHash)
UserSchema.virtual('password')
	.set(function(password) {
		this._password = password;
	})
	.get(function() { return this._password; });

// Pre-save hook: hash password if provided via virtual
UserSchema.pre('save', async function(next) {
	try {
		if (this._password) {
			const hash = await bcrypt.hash(this._password, SALT_ROUNDS);
			this.passwordHash = hash;
		}
		return next();
	} catch (err) {
		return next(err);
	}
});

// Instance method to compare a candidate password
UserSchema.methods.comparePassword = async function(candidate) {
	if (!this.passwordHash) return false;
	return bcrypt.compare(candidate, this.passwordHash);
};

// Static helper to create a new user with hashed password
UserSchema.statics.createWithPassword = async function(userObj, plainPassword) {
	const user = new this(userObj);
	user.password = plainPassword;
	await user.save();
	return user;
};

module.exports = mongoose.model('User', UserSchema);
