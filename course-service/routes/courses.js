const router = require('express').Router();
const verify = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');
const Course = require('../models/Course');
const Enrollment = require('../models/Enrollment');

// ── Public ─────────────────────────────────────────

/**
 * @openapi
 * /courses:
 *   get:
 *     summary: List courses
 *     tags: [Courses]
 *     responses:
 *       200:
 *         description: Courses
 */
// GET /courses — no auth needed
router.get('/', async (req, res, next) => {
  try {
    const courses = await Course.find().sort({ createdAt: -1 });
    res.json(courses);
  } catch (err) { next(err); }
});

// ── Formateur only ─────────────────────────────────

/**
 * @openapi
 * /courses:
 *   post:
 *     summary: Create course (formateur)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Course created
 *       400:
 *         description: Validation error
 *       403:
 *         description: Forbidden
 */
// POST /courses
router.post('/', verify, requireRole('formateur'), async (req, res, next) => {
  try {
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });
    const course = await Course.create({ title, description, formateurId: req.user.id });
    res.status(201).json(course);
  } catch (err) { next(err); }
});

/**
 * @openapi
 * /courses/{id}:
 *   put:
 *     summary: Update course (formateur)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Course updated
 *       404:
 *         description: Course not found
 */
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

/**
 * @openapi
 * /courses/{id}:
 *   delete:
 *     summary: Delete course (formateur)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course deleted
 *       404:
 *         description: Course not found
 */
// DELETE /courses/:id
router.delete('/:id', verify, requireRole('formateur'), async (req, res, next) => {
  try {
    const course = await Course.findOneAndDelete({ _id: req.params.id, formateurId: req.user.id });
    if (!course) return res.status(404).json({ error: 'Course not found' });
    res.json({ message: 'Course deleted' });
  } catch (err) { next(err); }
});

// ── Apprenant only ─────────────────────────────────

/**
 * @openapi
 * /courses/{id}/enroll:
 *   post:
 *     summary: Enroll in course (apprenant)
 *     tags: [Courses]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Enrollment created
 *       404:
 *         description: Course not found
 *       409:
 *         description: Already enrolled
 */
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

/**
 * @openapi
 * /courses/{id}/enrollment:
 *   get:
 *     summary: Check enrollment (internal)
 *     tags: [Courses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Enrollment status
 *       400:
 *         description: Missing userId
 */
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