require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const courseRoutes = require('./routes/courses');

const app = express();
app.use(express.json());
mongoose.connect(process.env.MONGO_URI);

app.use('/courses', courseRoutes);

app.listen(process.env.PORT, () =>
  console.log(`Course service on port ${process.env.PORT}`));