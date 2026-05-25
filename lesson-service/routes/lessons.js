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

/**
 * @openapi
 * /lessons:
 *   post:
 *     summary: Create lesson (formateur)
 *     tags: [Lessons]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               courseId:
 *                 type: string
 *     responses:
 *       201:
 *         description: Lesson created
 *       403:
 *         description: Forbidden
 */
// POST /lessons — formateur only
router.post('/', verify, requireRole('formateur'), async (req, res, next) => {
  try {
    const lesson = await Lesson.create(req.body);
    res.status(201).json(lesson);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /lessons/{id}:
 *   get:
 *     summary: Get lesson (apprenant, enrolled)
 *     tags: [Lessons]
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
 *         description: Lesson
 *       403:
 *         description: Forbidden
 *       404:
 *         description: Not found
 */
// GET /lessons/:id — apprenant, must be enrolled
router.get('/:id', verify, requireRole('apprenant'), checkEnrolled, (req, res) => {
  res.json(req.lesson);
});

/**
 * @openapi
 * /lessons/{id}:
 *   put:
 *     summary: Update lesson (formateur)
 *     tags: [Lessons]
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
 *               content:
 *                 type: string
 *               courseId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Lesson updated
 */
// PUT /lessons/:id — formateur only
router.put('/:id', verify, requireRole('formateur'), async (req, res, next) => {
  try {
    const lesson = await Lesson.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(lesson);
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /lessons/{id}:
 *   delete:
 *     summary: Delete lesson (formateur)
 *     tags: [Lessons]
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
 *         description: Deleted
 */
// DELETE /lessons/:id — formateur only
router.delete('/:id', verify, requireRole('formateur'), async (req, res, next) => {
  try {
    await Lesson.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    next(err);
  }
});

/**
 * @openapi
 * /lessons/{id}/complete:
 *   post:
 *     summary: Mark lesson complete (apprenant, enrolled)
 *     tags: [Lessons]
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
 *         description: Lesson marked as completed
 */
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