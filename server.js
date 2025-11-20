// server.js

// Get modules and configurations
const express = require('express'); 
const mongoose = require('mongoose');
require('dotenv').config(); // Loads MONGO_URI and PORT from .env

const app = express(); // Initialize the Express application
const PORT = process.env.PORT || 5000; // Use port from .env or default to 5000
const DB_URI = process.env.MONGO_URI;

// use express json
app.use(express.json());

// Test connection
mongoose.connect(DB_URI)
  .then(() => console.log('MongoDB Connected Successfully'))
  .catch(err => console.error('MongoDB connection error:', err));

//Check backend status
app.get('/', (req, res) => {
    res.send('Fitspo Backend Running! Ready to process API requests.');
});

//Start the Server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Open your browser to test the connection.`);
});