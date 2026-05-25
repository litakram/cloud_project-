globalThis.crypto = require('crypto');
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const mongoose = require('mongoose');
const lessonRoutes = require('./routes/lessons');

const app = express();
app.use(express.json());
app.use(cors());

const swaggerSpec = swaggerJsDoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Lesson Service',
      version: '1.0.0',
      description: 'Lesson content and completion API'
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
  .then(() => console.log('Lesson DB connected'))
  .catch(err => { console.error('DB error:', err); process.exit(1); });

app.use('/lessons', lessonRoutes);

// global error handler — always last
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: err.message });
});

app.listen(process.env.PORT, () =>
  console.log(`Lesson service on port ${process.env.PORT}`));