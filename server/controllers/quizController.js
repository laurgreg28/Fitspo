const StyleProfile = require('../../src/models/StyleProfile');
const User = require('../../src/models/User');
const scoringService = require('../services/scoringService');

exports.submitQuiz = async (req, res) => {
  try {
    const userId = req.user.id; // from auth middleware (mongo _id)
    const { answers } = req.body;
    if (!answers) return res.status(400).json({ error: 'Missing answers' });

    // Compute profile server-side
    const profile = scoringService.computeStyleProfile(answers);

    // Create StyleProfile document
    const profileDoc = new StyleProfile({
      userId: userId,
      answers,
      primaryStyle: profile.primaryStyle,
      secondaryStyles: profile.secondaryStyles,
      colorPalette: profile.colorPalette,
      tailoring: profile.tailoring || [],
      confidence: profile.confidence
    });

    await profileDoc.save();

    // Update user
    await User.findByIdAndUpdate(userId, { hasCompletedQuiz: true, quizResults: profileDoc._id });

    res.json({ profile: profileDoc });
  } catch (err) {
    console.error('submitQuiz error', err);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
};

exports.getQuizForUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await StyleProfile.findOne({ userId }).sort({ completedDate: -1 }).lean();
    if (!profile) return res.status(404).json({ error: 'No quiz results found' });
    res.json({ profile });
  } catch (err) {
    console.error('getQuizForUser error', err);
    res.status(500).json({ error: 'Failed to retrieve quiz' });
  }
};
