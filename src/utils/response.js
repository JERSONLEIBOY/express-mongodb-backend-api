const RESPONSE_TIME_ZONE = process.env.RESPONSE_TIME_ZONE || 'Asia/Shanghai';

const dateTimeFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: RESPONSE_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hour12: false,
  hourCycle: 'h23'
});

const formatDateTime = (date) => {
  const parts = dateTimeFormatter.formatToParts(date).reduce((acc, part) => {
    acc[part.type] = part.value;
    return acc;
  }, {});

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
};

const isObjectId = (value) => {
  return value && typeof value.toHexString === 'function' && value._bsontype === 'ObjectId';
};

const normalizeData = (data, seen = new WeakSet()) => {
  if (data === null || data === undefined) return data;
  if (data instanceof Date) return formatDateTime(data);
  if (isObjectId(data)) return data.toString();
  if (Array.isArray(data)) return data.map(item => normalizeData(item, seen));
  if (typeof data !== 'object') return data;

  const source = typeof data.toObject === 'function' ? data.toObject() : data;
  if (source instanceof Date) return formatDateTime(source);
  if (isObjectId(source)) return source.toString();

  if (seen.has(source)) return source;
  seen.add(source);

  return Object.keys(source).reduce((acc, key) => {
    acc[key] = normalizeData(source[key], seen);
    return acc;
  }, {});
};

const response = {
  success: (res, data = null, message = '操作成功') => {
    return res.status(200).json({
      code: 200,
      message,
      data: normalizeData(data)
    });
  },

  created: (res, data = null, message = '创建成功') => {
    return res.status(200).json({
      code: 200,
      message,
      data: normalizeData(data)
    });
  },

  noContent: (res, message = '删除成功') => {
    return res.status(204).json({
      code: 204,
      message
    });
  },

  badRequest: (res, message = '请求参数错误') => {
    return res.status(400).json({
      code: 400,
      message,
      data: null
    });
  },

  unauthorized: (res, message = '未授权，请登录') => {
    return res.status(401).json({
      code: 401,
      message,
      data: null
    });
  },

  forbidden: (res, message = '权限不足') => {
    return res.status(403).json({
      code: 403,
      message,
      data: null
    });
  },

  notFound: (res, message = '资源不存在') => {
    return res.status(404).json({
      code: 404,
      message,
      data: null
    });
  },

  serverError: (res, message = '服务器内部错误') => {
    return res.status(500).json({
      code: 500,
      message,
      data: null
    });
  },

  paginated: (res, { list, total, page, pageSize }) => {
    return res.status(200).json({
      code: 200,
      message: '查询成功',
      data: {
        list: normalizeData(list),
        pagination: {
          total,
          page: parseInt(page, 10),
          pageSize: parseInt(pageSize, 10),
          totalPages: Math.ceil(total / pageSize)
        }
      }
    });
  }
};

module.exports = response;
