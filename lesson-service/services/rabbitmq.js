const amqp = require('amqplib');

let channel;
const QUEUE = 'lesson.completed';

async function connect() {
  const conn = await amqp.connect(process.env.RABBITMQ_URL);
  channel = await conn.createChannel();
  await channel.assertQueue(QUEUE, { durable: true });
}

async function publishLessonCompleted(payload) {
  if (!channel) await connect();
  channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(payload)), { persistent: true });
}

module.exports = { publishLessonCompleted };