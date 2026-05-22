require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const progressRoutes = require('./routes/progress');
const { startConsumer } = require('./services/rabbitmq');

const app = express();
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Progress DB connected');
    await startConsumer(); // start listening to RabbitMQ after DB is ready
  })
  .catch(err => { console.error(err); process.exit(1); });

app.use('/progress', progressRoutes);

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: err.message });
});

app.listen(process.env.PORT, () =>
  console.log(`Progress service on :${process.env.PORT}`));