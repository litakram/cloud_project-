globalThis.crypto = require('crypto');
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const lessonRoutes = require('./routes/lessons');

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Lesson DB connected'))
  .catch(err => { console.error('DB error:', err); process.exit(1); });

app.use('/lessons', lessonRoutes);

// global error handler — always last
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: err.message });
});

app.listen(process.env.PORT, () =>
  console.log(`Lesson service on port ${process.env.PORT}`));