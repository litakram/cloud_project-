require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const progressRoutes = require('./routes/progress');
const { startConsumer } = require('./services/rabbitmq');

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGO_URI).then(async () => {
  console.log('Progress DB connected');
  await startConsumer(); // start listening to RabbitMQ after DB is ready
});

app.use('/progress', progressRoutes);

app.listen(process.env.PORT, () =>
  console.log(`Progress service on port ${process.env.PORT}`));