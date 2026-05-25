globalThis.crypto = require('crypto');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const mongoose = require('mongoose');
const progressRoutes = require('./routes/progress');
const { startConsumer } = require('./services/rabbitmq');

const app = express();
app.use(express.json());
app.use(cors());

const swaggerSpec = swaggerJsDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Progress Service',
      version: '1.0.0',
      description: 'Learner progress tracking API'
    },
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }
      }
    }
  },
  apis: ['./routes/*.js']
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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