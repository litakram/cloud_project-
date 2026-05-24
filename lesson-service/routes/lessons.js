const router = require('express').Router();
const verify = require('../middleware/verifyToken');
const checkEnrolled = require('../middleware/checkEnrolled');
const { publishLessonCompleted } = require('../services/rabbitmq');
const Lesson = require('../models/Lesson');

const requireRole = role => (req, res, next) => {
  if (req.user.role !== role) return res.status(403).json({ error: 'Forbidden' });
  next();
};

// checkEnrolled middleware moved to middleware/checkEnrolled.js

// POST /lessons — formateur only
router.post('/', verify, requireRole('formateur'), async (req, res, next) => {
  try {
    const lesson = await Lesson.create(req.body);
    res.status(201).json(lesson);
  } catch (err) {
    next(err);
  }
});

// GET /lessons/:id — apprenant, must be enrolled
router.get('/:id', verify, requireRole('apprenant'), checkEnrolled, (req, res) => {
  res.json(req.lesson);
});

// PUT /lessons/:id — formateur only
router.put('/:id', verify, requireRole('formateur'), async (req, res, next) => {
  try {
    const lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(lesson);
  } catch (err) {
    next(err);
  }
});

// DELETE /lessons/:id — formateur only
router.delete('/:id', verify, requireRole('formateur'), async (req, res, next) => {
  try {
    await Lesson.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
});

// POST /lessons/:id/complete — apprenant, must be enrolled
router.post('/:id/complete', verify, requireRole('apprenant'), checkEnrolled, async (req, res, next) => {
  try {
    await publishLessonCompleted({
      userId: req.user.id,
      lessonId: req.lesson._id.toString(),
      courseId: req.lesson.courseId.toString()
    });
    res.json({ message: 'Lesson marked as completed' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;