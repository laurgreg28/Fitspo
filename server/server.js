
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');

// Initialize DB connection
require('./config/db');


const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '1mb' }));


const authRoutes = require('./routes/auth');
const quizRoutes = require('./routes/quiz');

app.use('/api/auth', authRoutes);
app.use('/api/quiz', quizRoutes);



app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.use(express.static(path.join(__dirname)));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html')); });

    const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Fitspo server running on port ${PORT}`));
