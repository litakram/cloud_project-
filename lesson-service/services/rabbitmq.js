const amqp = require('amqplib');

let channel;
const QUEUE = 'lesson.completed';

async function connect() {
  const conn = await amqp.connect(process.env.RABBITMQ_URL);
  channel = await conn.createChannel();
  await channel.assertQueue(QUEUE, { durable: true });
  conn.on('close', () => {
    console.warn('RabbitMQ connection closed — will reconnect on next publish');
    channel = null;
  });
  conn.on('error', (err) => {
    console.error('RabbitMQ connection error:', err.message);
    channel = null;
  });
}

async function publishLessonCompleted(payload) {
  if (!channel) await connect();
  channel.sendToQueue(QUEUE, Buffer.from(JSON.stringify(payload)), { persistent: true });
}

module.exports = { publishLessonCompleted };