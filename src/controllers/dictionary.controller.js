const Dictionary = require('../models/Dictionary');
const DictionaryItem = require('../models/DictionaryItem');
const response = require('../utils/response');

const formatDict = (d) => ({
  dictId: d._id,
  dictCode: d.dictCode,
  dictName: d.dictName,
  sortNumber: d.sortNumber,
  comments: d.comments ?? null,
  createTime: d.createdAt
});

const formatItem = (item, dict) => ({
  dictDataId: item._id,
  dictId: item.dictId,
  dictDataCode: item.dictDataCode,
  dictDataName: item.dictDataName,
  sortNumber: item.sortNumber,
  comments: item.comments ?? null,
  createTime: item.createdAt,
  dictCode: dict ? dict.dictCode : item.dictCode,
  dictName: dict ? dict.dictName : undefined
});

/**
 * @swagger
 * /api/v1/dictionaries:
 *   get:
 *     tags: [Dictionaries]
 *     summary: 获取字典列表
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dictCode
 *         schema:
 *           type: string
 *       - in: query
 *         name: dictName
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功
 */
const getDictionaries = async (req, res, next) => {
  try {
    const { dictCode, dictName } = req.query;
    const query = {};
    if (dictCode) query.dictCode = new RegExp(dictCode, 'i');
    if (dictName) query.dictName = new RegExp(dictName, 'i');

    const list = await Dictionary.find(query).sort({ sortNumber: 1 }).lean();
    return response.success(res, list.map(formatDict));
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/dictionaries/data/page:
 *   get:
 *     tags: [Dictionaries]
 *     summary: 分页获取字典数据
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dictId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: dictDataName
 *         schema:
 *           type: string
 *       - in: query
 *         name: dictDataCode
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功
 */
const getDictionaryDataPage = async (req, res, next) => {
  try {
    const { dictId, page = 1, limit = 20, dictDataName, dictDataCode } = req.query;

    const dict = await Dictionary.findById(dictId).lean();
    if (!dict) return response.notFound(res, '字典不存在');

    const query = { dictId };
    if (dictDataName) query.dictDataName = new RegExp(dictDataName, 'i');
    if (dictDataCode) query.dictDataCode = new RegExp(dictDataCode, 'i');

    const skip = (Number(page) - 1) * Number(limit);
    const [items, count] = await Promise.all([
      DictionaryItem.find(query).sort({ sortNumber: 1 }).skip(skip).limit(Number(limit)).lean(),
      DictionaryItem.countDocuments(query)
    ]);

    return response.success(res, {
      list: items.map(item => formatItem(item, dict)),
      count
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/dictionaries/data:
 *   get:
 *     tags: [Dictionaries]
 *     summary: 查询字典数据（支持关键字、名称、编码、字典标识/ID及分页）
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: keywords
 *         schema:
 *           type: string
 *       - in: query
 *         name: dictDataName
 *         schema:
 *           type: string
 *       - in: query
 *         name: dictDataCode
 *         schema:
 *           type: string
 *       - in: query
 *         name: dictCode
 *         schema:
 *           type: string
 *       - in: query
 *         name: dictId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功
 */
const getDictionaryDataByCode = async (req, res, next) => {
  try {
    const { keywords, dictDataName, dictDataCode, dictCode, dictId } = req.query;

    const query = {};

    if (dictId) {
      query.dictId = dictId;
    } else if (dictCode) {
      query.dictCode = String(dictCode).toLowerCase();
    }

    if (keywords) {
      const kw = new RegExp(keywords, 'i');
      query.$or = [{ dictDataName: kw }, { dictDataCode: kw }];
    } else {
      if (dictDataName) query.dictDataName = new RegExp(dictDataName, 'i');
      if (dictDataCode) query.dictDataCode = new RegExp(dictDataCode, 'i');
    }

    const items = await DictionaryItem.find(query).sort({ sortNumber: 1 }).lean();
    return response.success(res, items.map(item => formatItem(item, null)));
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/dictionaries:
 *   post:
 *     tags: [Dictionaries]
 *     summary: 创建字典
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [dictCode, dictName]
 *             properties:
 *               dictCode:
 *                 type: string
 *               dictName:
 *                 type: string
 *               sortNumber:
 *                 type: integer
 *               comments:
 *                 type: string
 *     responses:
 *       201:
 *         description: 创建成功
 */
const createDictionary = async (req, res, next) => {
  try {
    const { dictCode, dictName, sortNumber, comments } = req.body;

    const existing = await Dictionary.findOne({ dictCode: dictCode.toLowerCase() });
    if (existing) return response.badRequest(res, '字典编码已存在');

    const dict = await Dictionary.create({ dictCode: dictCode.toLowerCase(), dictName, sortNumber, comments });
    return response.created(res, formatDict(dict), '字典创建成功');
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/dictionaries/{id}:
 *   put:
 *     tags: [Dictionaries]
 *     summary: 更新字典
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dictName:
 *                 type: string
 *               sortNumber:
 *                 type: integer
 *               comments:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新成功
 */
const updateDictionary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { dictName, sortNumber, comments } = req.body;

    const updates = {};
    if (dictName !== undefined) updates.dictName = dictName;
    if (sortNumber !== undefined) updates.sortNumber = sortNumber;
    if (comments !== undefined) updates.comments = comments;

    const dict = await Dictionary.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).lean();
    if (!dict) return response.notFound(res, '字典不存在');

    return response.success(res, formatDict(dict), '字典更新成功');
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/dictionaries/{id}:
 *   delete:
 *     tags: [Dictionaries]
 *     summary: 删除字典
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 删除成功
 */
const deleteDictionary = async (req, res, next) => {
  try {
    const { id } = req.params;

    const dict = await Dictionary.findByIdAndDelete(id);
    if (!dict) return response.notFound(res, '字典不存在');

    await DictionaryItem.deleteMany({ dictId: id });
    return response.success(res, null, '字典删除成功');
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/dictionaries/data:
 *   post:
 *     tags: [Dictionaries]
 *     summary: 创建字典数据
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [dictId, dictDataCode, dictDataName]
 *             properties:
 *               dictId:
 *                 type: string
 *               dictDataCode:
 *                 type: string
 *               dictDataName:
 *                 type: string
 *               sortNumber:
 *                 type: integer
 *               comments:
 *                 type: string
 *     responses:
 *       201:
 *         description: 创建成功
 */
const createDictionaryItem = async (req, res, next) => {
  try {
    const { dictId, dictDataCode, dictDataName, sortNumber, comments } = req.body;

    const dict = await Dictionary.findById(dictId).lean();
    if (!dict) return response.notFound(res, '字典不存在');

    const existing = await DictionaryItem.findOne({ dictCode: dict.dictCode, dictDataCode });
    if (existing) return response.badRequest(res, '字典数据值已存在');

    const item = await DictionaryItem.create({
      dictId,
      dictCode: dict.dictCode,
      dictDataCode,
      dictDataName,
      sortNumber,
      comments
    });

    return response.created(res, formatItem(item, dict), '字典数据创建成功');
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/dictionaries/data/{itemId}:
 *   put:
 *     tags: [Dictionaries]
 *     summary: 更新字典数据
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dictDataCode:
 *                 type: string
 *               dictDataName:
 *                 type: string
 *               sortNumber:
 *                 type: integer
 *               comments:
 *                 type: string
 *     responses:
 *       200:
 *         description: 更新成功
 */
const updateDictionaryItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { dictDataCode, dictDataName, sortNumber, comments } = req.body;

    const updates = {};
    if (dictDataCode !== undefined) updates.dictDataCode = dictDataCode;
    if (dictDataName !== undefined) updates.dictDataName = dictDataName;
    if (sortNumber !== undefined) updates.sortNumber = sortNumber;
    if (comments !== undefined) updates.comments = comments;

    const item = await DictionaryItem.findByIdAndUpdate(itemId, updates, { new: true, runValidators: true }).lean();
    if (!item) return response.notFound(res, '字典数据不存在');

    return response.success(res, formatItem(item, null), '字典数据更新成功');
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/dictionaries/data/{itemId}:
 *   delete:
 *     tags: [Dictionaries]
 *     summary: 删除字典数据
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 删除成功
 */
const deleteDictionaryItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    const item = await DictionaryItem.findByIdAndDelete(itemId);
    if (!item) return response.notFound(res, '字典数据不存在');

    return response.success(res, null, '字典数据删除成功');
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/dictionaries/data:
 *   delete:
 *     tags: [Dictionaries]
 *     summary: 批量删除字典数据
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: string
 *             description: 字典数据ID列表
 *     responses:
 *       200:
 *         description: 批量删除成功
 */
const deleteDictionaryItemBatch = async (req, res, next) => {
  try {
    const ids = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return response.badRequest(res, '请提供要删除的ids');
    }
    await DictionaryItem.deleteMany({ _id: { $in: ids } });
    return response.success(res, null, '批量删除成功');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDictionaries,
  getDictionaryDataPage,
  getDictionaryDataByCode,
  createDictionary,
  updateDictionary,
  deleteDictionary,
  createDictionaryItem,
  updateDictionaryItem,
  deleteDictionaryItem,
  deleteDictionaryItemBatch
};
