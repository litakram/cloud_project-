const router = require('express').Router();
const verify = require('../middleware/verifyToken');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// Role guard helper
const requireRole = role => (req, res, next) => {
  if (req.user.role !== role) return res.status(403).json({ error: 'Forbidden' });
  next();
};

// GET /courses — public catalog
router.get('/', async (req, res) => {
  const courses = await Course.find();
  res.json(courses);
});

// POST /courses — formateur only
router.post('/', verify, requireRole('formateur'), async (req, res) => {
  const course = await Course.create({ ...req.body, formateurId: req.user.id });
  res.status(201).json(course);
});

// PUT /courses/:id — formateur only
router.put('/:id', verify, requireRole('formateur'), async (req, res) => {
  const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(course);
});

// DELETE /courses/:id — formateur only
router.delete('/:id', verify, requireRole('formateur'), async (req, res) => {
  await Course.findByIdAndDelete(req.params.id);
  res.json({ message: 'Deleted' });
});

// POST /courses/:id/enroll — apprenant only
router.post('/:id/enroll', verify, requireRole('apprenant'), async (req, res) => {
  const exists = await Enrollment.findOne({ userId: req.user.id, courseId: req.params.id });
  if (exists) return res.status(400).json({ error: 'Already enrolled' });
  const enrollment = await Enrollment.create({ userId: req.user.id, courseId: req.params.id });
  res.status(201).json(enrollment);
});

// GET /courses/:id/enrollment?userId=X — called by lesson-service
router.get('/:id/enrollment', async (req, res) => {
  const { userId } = req.query;
  const enrollment = await Enrollment.findOne({ userId, courseId: req.params.id });
  res.json({ enrolled: !!enrollment });
});

module.exports = router;