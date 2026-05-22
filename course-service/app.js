require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const courseRoutes = require('./routes/courses');

const app = express();
app.use(express.json());
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Course DB connected'))
  .catch(err => { console.error(err); process.exit(1); });

app.use('/courses', courseRoutes);

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: err.message });
});

app.listen(process.env.PORT, () =>
  console.log(`Course service on :${process.env.PORT}`));