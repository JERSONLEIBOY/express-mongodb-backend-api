const response = {
  success: (res, data = null, message = '操作成功') => {
    return res.status(200).json({
      code: 200,
      message,
      data
    });
  },

  created: (res, data = null, message = '创建成功') => {
    return res.status(200).json({
      code: 200,
      message,
      data
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
        list,
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
