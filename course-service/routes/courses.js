const router = require('express').Router();
const verify = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// ── Public ─────────────────────────────────────────

// GET /courses — no auth needed
router.get('/', async (req, res, next) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) { next(err); }
});

// ── Formateur only ─────────────────────────────────

// POST /courses
router.post('/', verify, requireRole('formateur'), async (req, res, next) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });
    const course = await Course.create({ title, description, formateurId: req.user.id });
    res.status(201).json(course);
  } catch (err) { next(err); }
});

// PUT /courses/:id
router.put('/:id', verify, requireRole('formateur'), async (req, res, next) => {
  try {
    const course = await Course.findOneAndUpdate(
      { _id: req.params.id, formateurId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json(course);
  } catch (err) { next(err); }
});

// DELETE /courses/:id
router.delete('/:id', verify, requireRole('formateur'), async (req, res, next) => {
  try {
    const course = await Course.findOneAndDelete({ _id: req.params.id, formateurId: req.user.id });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json({ message: 'Course deleted' });
  } catch (err) { next(err); }
});

// ── Apprenant only ─────────────────────────────────

// POST /courses/:id/enroll
router.post('/:id/enroll', verify, requireRole('apprenant'), async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: 'Course not found' });

    const enrollment = await Enrollment.create({
      userId: req.user.id,
      courseId: req.params.id
    });
    res.status(201).json(enrollment);
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ error: 'Already enrolled' });
    next(err);
  }
});

// GET /courses/:id/enrollment?userId=X — internal, called by lesson-service
router.get('/:id/enrollment', async (req, res, next) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: 'userId query param required' });
    const found = await Enrollment.exists({ userId, courseId: req.params.id });
    res.json({ enrolled: !!found });
  } catch (err) { next(err); }
});

module.exports = router;