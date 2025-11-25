
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

// Initialize DB connection (uses ../src/models via mongoose models already created)
require('./config/db');

const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quiz');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);
//

// Simple health endpoint
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Fitspo server running on port ${PORT}`));
