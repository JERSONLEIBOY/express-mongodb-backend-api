const crypto = require('crypto');

/**
 * TraceId 中间件
 * - 如果请求头有 X-Request-Id 则沿用（便于网关 / 上游传入）
 * - 否则生成一个 UUID
 * - 挂在 req.traceId，并写回响应头 X-Request-Id
 */
const traceMiddleware = (req, res, next) => {
  const incoming = req.get('x-request-id');
  const traceId = incoming && incoming.length <= 64 ? incoming : crypto.randomUUID();
  req.traceId = traceId;
  res.setHeader('X-Request-Id', traceId);
  next();
};

module.exports = { traceMiddleware };
