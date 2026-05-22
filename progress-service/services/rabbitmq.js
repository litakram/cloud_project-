const amqp = require('amqplib');
const Progress = require('../models/Progress');

const QUEUE = 'lesson.completed';

async function startConsumer() {
  const conn = await amqp.connect(process.env.RABBITMQ_URL);
  const channel = await conn.createChannel();
  await channel.assertQueue(QUEUE, { durable: true });
  channel.prefetch(1);
  console.log('Waiting for messages on lesson.completed...');

  channel.consume(QUEUE, async (msg) => {
    if (!msg) return;
    const { userId, lessonId, courseId } = JSON.parse(msg.content.toString());
    await Progress.findOneAndUpdate(
      { userId, lessonId },
      { userId, lessonId, courseId, completedAt: new Date() },
      { upsert: true }
    );
    channel.ack(msg); // confirm processed
  });
}

module.exports = { startConsumer };