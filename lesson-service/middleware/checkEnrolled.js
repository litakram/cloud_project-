const axios = require('axios');
const Lesson = require('../models/Lesson');

module.exports = async (req, res, next) => {
  try {
    // 1. fetch the lesson to get its courseId
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ error: 'Lesson not found' });

    // 2. ask course-service if this user is enrolled
    const url = `${process.env.COURSE_SERVICE_URL}/courses/${lesson.courseId}/enrollment`;
    const { data } = await axios.get(url, { params: { userId: req.user.id } });

    // 3. block if not enrolled
    if (!data.enrolled) return res.status(403).json({ error: 'Not enrolled in this course' });

    // 4. pass lesson along so the route handler doesn't re-fetch it
    req.lesson = lesson;
    next();
  } catch (err) {
    // course-service is unreachable
    if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND')
      return res.status(503).json({ error: 'Enrollment service unavailable' });
    next(err);
  }
};
