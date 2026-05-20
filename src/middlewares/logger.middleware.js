const { logger } = require('../config');
const UAParser = require('ua-parser-js');
const { lookupLocation } = require('../utils/ipLocation');
const operationLogQueue = require('../utils/operationLogQueue');

// 敏感字段：写入 params 前替换为 ******
const SENSITIVE_KEYS = new Set([
  'password',
  'oldpassword',
  'newpassword',
  'confirmpassword',
  'token',
  'accesstoken',
  'refreshtoken',
  'captcha',
  'verifycode',
  'idcard',
  'secret',
  'apikey'
]);
const MASK = '******';

const maskSensitive = (input) => {
  if (input === null || input === undefined) return input;
  if (Array.isArray(input)) return input.map(maskSensitive);
  if (typeof input !== 'object') return input;
  const out = {};
  for (const [k, v] of Object.entries(input)) {
    if (SENSITIVE_KEYS.has(k.toLowerCase())) {
      out[k] = MASK;
    } else if (v && typeof v === 'object') {
      out[k] = maskSensitive(v);
    } else {
      out[k] = v;
    }
  }
  return out;
};

const safeStringify = (obj) => {
  try {
    return JSON.stringify(obj);
  } catch {
    return '';
  }
};

const parseUA = (uaString) => {
  const ua = new UAParser(uaString).getResult();
  return {
    os: ua.os.name ? `${ua.os.name} ${ua.os.version || ''}`.trim() : '',
    device: ua.device.model || ua.device.type || 'PC',
    browser: ua.browser.name ? `${ua.browser.name} ${ua.browser.major || ''}`.trim() : ''
  };
};

// 默认 module: /api/v1/{module}/... → 取第 3 段
// 注意：使用 originalUrl 而非 path，避免 res.on('finish') 时 req.path 已被路由改写
const extractModuleFromUrl = (url) => {
  // 去掉 query string
  const pathOnly = (url || '').split('?')[0];
  const parts = pathOnly.split('/').filter(Boolean);
  // 期望形如 ['api','v1','users',...]
  return parts[2] ? parts[2].replace(/-/g, '_') : 'unknown';
};

// 默认 businessType: 根据 HTTP method 粗略推导
const inferBusinessType = (method) => {
  switch (method) {
    case 'POST': return 'INSERT';
    case 'PUT':
    case 'PATCH': return 'UPDATE';
    case 'DELETE': return 'DELETE';
    default: return 'OTHER';
  }
};

const METHOD_DESC_MAP = { GET: '查询', POST: '新增', PUT: '修改', DELETE: '删除', PATCH: '修改' };

const buildDefaultDescription = (url, method) => {
  const mod = extractModuleFromUrl(url);
  return `${METHOD_DESC_MAP[method] || method}${mod}`;
};

/**
 * 显式标注中间件：在路由上挂载以声明 module/businessType/description
 * 用法：router.post('/', audit({ module: '用户管理', businessType: 'INSERT', description: '新增用户' }), ctrl.create)
 * 也可只标 description，module/businessType 会回退到默认推导
 * 传 { skip: true } 可显式跳过该路由的审计
 */
const audit = (meta = {}) => (req, res, next) => {
  req._auditMeta = meta;
  next();
};

const operationLogger = async (req, res, next) => {
  // 只处理 /api 下的请求
  if (!req.path.startsWith('/api')) return next();

  const startTime = Date.now();

  // 包装 res.json，捕获响应体用于错误信息提取（不存储成功响应）
  const originalJson = res.json.bind(res);
  res.json = (body) => {
    res._auditResponseBody = body;
    return originalJson(body);
  };

  res.on('finish', async () => {
    try {
      const meta = req._auditMeta || {};

      // 显式 skip
      if (meta.skip) return;

      const method = req.method;
      const isWrite = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);

      // 默认策略：未显式标注时，只记录写操作；已显式标注则按标注记录（允许审计敏感 GET）
      const hasExplicitAudit = Object.keys(meta).length > 0;
      if (!isWrite && !hasExplicitAudit) return;

      const uaInfo = parseUA(req.get('user-agent') || '');
      const spendTime = Date.now() - startTime;
      const isError = res.statusCode >= 400;

      const moduleName = meta.module || extractModuleFromUrl(req.originalUrl);
      const businessType = meta.businessType || inferBusinessType(method);
      const description = meta.description || buildDefaultDescription(req.originalUrl, method);

      // 参数脱敏
      const rawParams = method !== 'GET' ? req.body : req.query;
      const maskedParams = maskSensitive(rawParams);

      // 错误信息：仅在 4xx/5xx 时记录响应体中的错误字段
      let errorMsg = null;
      if (isError) {
        const body = res._auditResponseBody;
        if (body && typeof body === 'object') {
          errorMsg = body.message || body.error || `HTTP ${res.statusCode}`;
        } else {
          errorMsg = `HTTP ${res.statusCode}`;
        }
        if (typeof errorMsg === 'string' && errorMsg.length > 500) {
          errorMsg = errorMsg.slice(0, 500);
        }
      }

      const ip = req.ip || req.connection.remoteAddress;

      operationLogQueue.push({
        userId: req.user ? req.user._id : null,
        traceId: req.traceId || null,
        module: moduleName,
        businessType,
        description,
        url: req.originalUrl,
        requestMethod: method,
        method: `${moduleName}.${description}`,
        params: safeStringify(maskedParams),
        result: null, // 成功响应不落库，避免日志膨胀与隐私问题
        error: errorMsg,
        spendTime,
        os: uaInfo.os,
        device: uaInfo.device,
        browser: uaInfo.browser,
        ip,
        location: lookupLocation(ip),
        status: isError ? 1 : 0
      });
    } catch (error) {
      logger.error('Failed to enqueue operation log:', error);
    }
  });

  next();
};

const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  res.on('finish', () => {
    logger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${Date.now() - startTime}ms`, {
      traceId: req.traceId,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });
  next();
};

module.exports = { operationLogger, requestLogger, parseUA, audit };
