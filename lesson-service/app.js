require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const lessonRoutes = require('./routes/lessons');

const app = express();
app.use(express.json());
mongoose.connect(process.env.MONGO_URI);

app.use('/lessons', lessonRoutes);

app.listen(process.env.PORT, () =>
  console.log(`Lesson service on port ${process.env.PORT}`));