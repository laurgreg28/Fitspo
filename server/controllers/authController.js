const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret';

exports.signup = async (req, res) => {
  try {
    const { firstName, lastName, middleName, username, email, password, dateOfBirth, gender, emailNotifications, termsAccepted } = req.body;

    if (!firstName || !lastName || !username || !email || !password || !termsAccepted) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check unique email/username
    const existing = await User.findOne({ $or: [{ email }, { username }] });
    if (existing) return res.status(409).json({ error: 'Email or username already in use' });

    const userObj = {
      userId: 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 8),
      firstName,
      middleName: middleName || '',
      lastName,
      username,
      email,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      gender: gender || '',
      emailNotifications: !!emailNotifications,
      termsAccepted: !!termsAccepted
    };

    const user = await User.createWithPassword(userObj, password);

    const token = jwt.sign({ id: user._id, userId: user.userId }, JWT_SECRET, { expiresIn: '7d' });

    res.json({ token, user: { userId: user.userId, username: user.username, email: user.email } });
  } catch (err) {
    console.error('Signup error', err);
    res.status(500).json({ error: 'Failed to create account' });
  }
};

exports.login = async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;
    if (!emailOrUsername || !password) return res.status(400).json({ error: 'Missing credentials' });

    const user = await User.findOne({ $or: [{ email: emailOrUsername }, { username: emailOrUsername }] });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const ok = await user.comparePassword(password);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, userId: user.userId }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { userId: user.userId, username: user.username, email: user.email } });
  } catch (err) {
    console.error('Login error', err);
    res.status(500).json({ error: 'Login failed' });
  }
};
