const router = require('express').Router();
const verify = require('../middleware/verifyToken');
const Progress = require('../models/Progress');

// GET /progress/dashboard — apprenant sees their own progress
router.get('/dashboard', verify, async (req, res) => {
  const entries = await Progress.find({ userId: req.user.id });
  const byCourse = entries.reduce((acc, p) => {
    const key = p.courseId.toString();
    if (!acc[key]) acc[key] = { courseId: key, completedLessons: [] };
    acc[key].completedLessons.push(p.lessonId);
    return acc;
  }, {});
  res.json(Object.values(byCourse));
});

module.exports = router;