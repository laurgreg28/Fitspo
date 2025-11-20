const express = require('express');
const router = express.Router();
const quizController = require('../controllers/quizController');
const auth = require('../middleware/auth');

// Protected endpoints
router.post('/', auth, quizController.submitQuiz);
router.get('/', auth, quizController.getQuizForUser);

module.exports = router;
