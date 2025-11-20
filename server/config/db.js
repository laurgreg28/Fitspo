const mongoose = require('mongoose');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fitspo';

mongoose.set('strictQuery', false);

mongoose.connect(MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB connected');
}).catch(err => {
  console.error('MongoDB connection error:', err.message || err);
  console.warn('Continuing without DB connection. To fix: ensure MongoDB is running or set MONGO_URI in server/.env');
  // Do not exit the process here; keep the server running for development so other errors can be inspected.
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected. Some functionality may be unavailable.');
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected.');
});
