require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const fs = require('fs');

const { config, logger, mongoOptions } = require('./config');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middlewares/error.middleware');
const { createOperationLogger, requestLogger } = require('./middlewares/logger.middleware');
const { traceMiddleware } = require('./middlewares/trace.middleware');
const { swaggerUi, specs } = require('./config/swagger');
const { buildSwaggerMetaMap } = require('./utils/swaggerMeta');
const swaggerMetaMap = buildSwaggerMetaMap(specs);

const app = express();

app.use((req, res, next) => {
  if (req.path.startsWith('/api-docs')) {
    return helmet({ contentSecurityPolicy: false, crossOriginOpenerPolicy: false, strictTransportSecurity: false })(req, res, next);
  }
  return helmet()(req, res, next);
});

app.use(cors({
  origin: config.cors.origin,
  credentials: config.cors.credentials
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// TraceId 中间件：尽可能早，便于其它中间件 / 日志使用 req.traceId
app.use(traceMiddleware);

const uploadsDir = path.resolve(config.upload.path);
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

app.use(requestLogger);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    name: 'Express MongoDB Backend API',
    version: '1.0.0',
    documentation: '/api-docs'
  });
});

// API 文档端点
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.use(createOperationLogger(swaggerMetaMap));

routes(app);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    await mongoose.connect(config.mongodb.uri, mongoOptions);
    logger.info('MongoDB connected successfully');

    app.listen(config.port, () => {
      logger.info(`Server is running on port ${config.port}`);
      logger.info(`Environment: ${config.env}`);
    });
  } catch (error) {
    logger.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();

module.exports = app;
