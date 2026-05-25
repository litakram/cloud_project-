const router = require('express').Router();
const verify = require('../middleware/verifyToken');
const requireRole = require('../middleware/requireRole');
const Progress = require('../models/Progress');

/**
 * @openapi
 * /progress/dashboard:
 *   get:
 *     summary: Get the authenticated user's progress dashboard
 *     tags: [Progress]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Progress grouped by course
 *       403:
 *         description: Forbidden
 */

// GET /progress/dashboard — apprenant sees their own progress
router.get('/dashboard', verify, requireRole('apprenant'), async (req, res, next) => {
  try {
    const entries = await Progress.find({ userId: req.user.id });
    const byCourse = entries.reduce((acc, p) => {
      const key = p.courseId.toString();
      if (!acc[key]) acc[key] = { courseId: key, completedLessons: [] };
      acc[key].completedLessons.push(p.lessonId);
      return acc;
    }, {});
    res.json(Object.values(byCourse));
  } catch (err) { next(err); }
});

module.exports = router;