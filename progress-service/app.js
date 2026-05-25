globalThis.crypto = require('crypto');
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const progressRoutes = require('./routes/progress');
const { startConsumer } = require('./services/rabbitmq');

const app = express();
app.use(express.json());

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'Progress Service API',
    version: '1.0.0'
  },
  servers: [
    { url: `http://localhost:${process.env.PORT}` }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    }
  }
};

const swaggerSpec = swaggerJsdoc({
  definition: swaggerDefinition,
  apis: [path.join(__dirname, 'routes', '*.js')]
});

app.get('/docs.json', (req, res) => {
  res.json(swaggerSpec);
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, { explorer: true }));

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('Progress DB connected');
    await startConsumer();
  })
  .catch(err => { console.error(err); process.exit(1); });

app.use('/progress', progressRoutes);

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: err.message });
});

app.listen(process.env.PORT, () =>
  console.log(`Progress service on :${process.env.PORT}`));