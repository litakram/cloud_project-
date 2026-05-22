const router = require('express').Router();
const axios = require('axios');
const verify = require('../middleware/verifyToken');
const Lesson = require('../models/Lesson');
const { publishLessonCompleted } = require('../services/rabbitmq');

const requireRole = role => (req, res, next) => {
  if (req.user.role !== role) return res.status(403).json({ error: 'Forbidden' });
  next();
};

// Enrollment check middleware (synchronous REST call)
const checkEnrolled = async (req, res, next) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    const { data } = await axios.get(
      `${process.env.COURSE_SERVICE_URL}/courses/${lesson.courseId}/enrollment`,
      { params: { userId: req.user.id } }
    );

    if (!data.enrolled) return res.status(403).json({ error: 'Not enrolled in this course' });
    req.lesson = lesson;
    next();
  } catch (err) {
    next(err);
  }
};

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
      lessonId: req.lesson._id,
      courseId: req.lesson.courseId
    });
    res.json({ message: 'Lesson marked as completed' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;