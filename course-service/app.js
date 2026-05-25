globalThis.crypto = require('crypto');
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');
const courseRoutes = require('./routes/courses');

const app = express();
app.use(express.json());

const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'Course Service API',
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
  .then(() => console.log('Course DB connected'))
  .catch(err => { console.error(err); process.exit(1); });

app.use('/courses', courseRoutes);

app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: err.message });
});

app.listen(process.env.PORT, () =>
  console.log(`Course service on :${process.env.PORT}`));