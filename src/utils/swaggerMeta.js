/**
 * 从 swagger specs 构建路由元数据查找表
 * key: "METHOD /api/v1/path/{id}" (OpenAPI 格式)
 * value: { module, description }
 */
const buildSwaggerMetaMap = (specs) => {
  // 构建 tag 英文名 → 中文描述的映射（去掉"接口"后缀）
  const tagNameMap = {};
  for (const tag of (specs.tags || [])) {
    if (tag.name && tag.description) {
      tagNameMap[tag.name] = tag.description.replace(/接口$/, '');
    }
  }

  const map = new Map();
  const paths = specs.paths || {};
  for (const [pathKey, pathItem] of Object.entries(paths)) {
    for (const [method, operation] of Object.entries(pathItem)) {
      if (!operation || typeof operation !== 'object') continue;
      const rawTag = operation.tags && operation.tags[0];
      const module = (rawTag && tagNameMap[rawTag]) || rawTag || null;
      const description = operation.summary || null;
      if (module || description) {
        map.set(`${method.toUpperCase()} ${pathKey}`, { module, description });
      }
    }
  }
  return map;
};

// 将 express 实际路径转为 OpenAPI 路径格式匹配
// /api/v1/users/123 → 尝试匹配 /api/v1/users/{id}
const lookupSwaggerMeta = (map, method, url) => {
  const pathOnly = url.split('?')[0];
  const key = `${method} ${pathOnly}`;

  // 精确匹配
  if (map.has(key)) return map.get(key);

  // 参数段匹配：将路径中的数字或 ObjectId 段替换为 {param}
  for (const [mapKey, meta] of map.entries()) {
    if (!mapKey.startsWith(method + ' ')) continue;
    const pattern = mapKey
      .slice(method.length + 1)
      .replace(/\{[^}]+\}/g, '[^/]+');
    if (new RegExp(`^${pattern}$`).test(pathOnly)) return meta;
  }

  return null;
};

module.exports = { buildSwaggerMetaMap, lookupSwaggerMeta };
