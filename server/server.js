
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');

// Initialize DB connection
require('./config/db');

const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quiz');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html')); });

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 5000;
app.use(express.static(path.join(__dirname, 'public')));
app.listen(PORT, () => console.log(`Fitspo server running on port ${PORT}`));
