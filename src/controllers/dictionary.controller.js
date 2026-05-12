const Dictionary = require('../models/Dictionary');
const DictionaryItem = require('../models/DictionaryItem');
const response = require('../utils/response');

/**
 * @swagger
 * /api/v1/dictionaries:
 *   get:
 *     tags: [Dictionaries]
 *     summary: 获取字典列表
 *     description: 分页获取字典列表，支持查询过滤、排序功能
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: 字典名模糊搜索
 *       - in: query
 *         name: code
 *         schema:
 *           type: string
 *         description: 字典代码模糊搜索
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: 字典状态
 *       - in: query
 *         name: sortField
 *         schema:
 *           type: string
 *           default: createdAt
 *           enum: [name, code, createdAt, updatedAt]
 *         description: 排序字段
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           default: desc
 *           enum: [asc, desc]
 *         description: 排序方式
 *     responses:
 *       200:
 *         description: 成功获取字典列表
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Dictionary'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
const getDictionaries = async (req, res, next) => {
  try {
    const { name, code, status, sortField = 'createdAt', sortOrder = 'desc' } = req.query;

    const query = {};

    if (name) query.name = new RegExp(name, 'i');
    if (code) query.code = new RegExp(code, 'i');
    if (status) query.status = status;

    const sortObj = {};
    sortObj[sortField] = sortOrder === 'asc' ? 1 : -1;

    const dictionaries = await Dictionary.find(query)
      .sort(sortObj)
      .lean();

    return response.success(res, dictionaries);
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/dictionaries/{code}/items:
 *   get:
 *     tags: [Dictionaries]
 *     summary: 获取字典项列表
 *     description: 根据字典代码获取字典下的所有项
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: 字典代码
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: 字典项状态
 *       - in: query
 *         name: sortField
 *         schema:
 *           type: string
 *           default: sort
 *           enum: [label, value, sort, createdAt]
 *         description: 排序字段
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           default: asc
 *           enum: [asc, desc]
 *         description: 排序方式
 *     responses:
 *       200:
 *         description: 成功获取字典项列表
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         dictionary:
 *                           $ref: '#/components/schemas/Dictionary'
 *                         items:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/DictionaryItem'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
const getDictionaryItems = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { status, sortField = 'sort', sortOrder = 'asc' } = req.query;

    const dictionary = await Dictionary.findOne({ code });
    if (!dictionary) {
      return response.notFound(res, '字典不存在');
    }

    const query = { dictionaryCode: code };
    if (status) query.status = status;

    const sortObj = {};
    sortObj[sortField] = sortOrder === 'asc' ? 1 : -1;

    const items = await DictionaryItem.find(query)
      .sort(sortObj)
      .lean();

    return response.success(res, {
      dictionary,
      items
    });
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
 *     description: 创建新字典，仅限管理员操作
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 required: true
 *                 description: 字典名称
 *               code:
 *                 type: string
 *                 maxLength: 50
 *                 required: true
 *                 description: 字典编码（唯一）
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: active
 *                 description: 字典状态
 *     responses:
 *       201:
 *         description: 字典创建成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Dictionary'
 *                     code:
 *                       type: integer
 *                       example: 201
 *                     message:
 *                       type: string
 *                       example: '字典创建成功'
 *       400:
 *         $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       403:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
const createDictionary = async (req, res, next) => {
  try {
    const { name, code, status } = req.body;

    const existingDict = await Dictionary.findOne({ code: code.toLowerCase() });
    if (existingDict) {
      return response.badRequest(res, '字典编码已存在');
    }

    const dictionary = await Dictionary.create({
      name,
      code: code.toLowerCase(),
      status
    });

    return response.created(res, dictionary, '字典创建成功');
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/dictionaries/{id}:
 *   put:
 *     tags: [Dictionaries]
 *     summary: 更新字典信息
 *     description: 更新指定字典的信息，仅限管理员操作
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: 字典 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 description: 字典名称
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: 字典状态
 *     responses:
 *       200:
 *         description: 字典更新成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Dictionary'
 *       400:
 *         $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       403:
 *         $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
const updateDictionary = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, status } = req.body;

    const dictionary = await Dictionary.findById(id);
    if (!dictionary) {
      return response.notFound(res, '字典不存在');
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (status !== undefined) updates.status = status;

    const updatedDict = await Dictionary.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).lean();

    return response.success(res, updatedDict, '字典更新成功');
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
 *     description: 删除指定字典及其所有字典项，仅限管理员操作
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: 字典 ID
 *     responses:
 *       204:
 *         description: 字典删除成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: null
 *                     code:
 *                       type: integer
 *                       example: 204
 *                     message:
 *                       type: string
 *                       example: '字典删除成功'
 *       400:
 *         $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       403:
 *         $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
const deleteDictionary = async (req, res, next) => {
  try {
    const { id } = req.params;

    const dictionary = await Dictionary.findById(id);
    if (!dictionary) {
      return response.notFound(res, '字典不存在');
    }

    await DictionaryItem.deleteMany({ dictionaryCode: dictionary.code });
    await Dictionary.findByIdAndDelete(id);

    return response.success(res, null, '字典删除成功');
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/dictionaries/{code}/items:
 *   post:
 *     tags: [Dictionaries]
 *     summary: 创建字典项
 *     description: 在指定字典下创建新的字典项，仅限管理员操作
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: 字典代码
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               label:
 *                 type: string
 *                 maxLength: 100
 *                 required: true
 *                 description: 字典项标签
 *               value:
 *                 type: string
 *                 maxLength: 100
 *                 required: true
 *                 description: 字典项值（唯一）
 *               sort:
 *                 type: integer
 *                 default: 0
 *                 description: 排序
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 default: active
 *                 description: 字典项状态
 *     responses:
 *       201:
 *         description: 字典项创建成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/DictionaryItem'
 *                     code:
 *                       type: integer
 *                       example: 201
 *                     message:
 *                       type: string
 *                       example: '字典项创建成功'
 *       400:
 *         $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       403:
 *         $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
const createDictionaryItem = async (req, res, next) => {
  try {
    const { code } = req.params;
    const { label, value, sort, status } = req.body;

    const dictionary = await Dictionary.findOne({ code });
    if (!dictionary) {
      return response.notFound(res, '字典不存在');
    }

    const existingItem = await DictionaryItem.findOne({ dictionaryCode: code, value });
    if (existingItem) {
      return response.badRequest(res, '字典项值已存在');
    }

    const item = await DictionaryItem.create({
      dictionaryCode: code,
      label,
      value,
      sort,
      status
    });

    return response.created(res, item, '字典项创建成功');
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/dictionaries/{code}/items/{itemId}:
 *   put:
 *     tags: [Dictionaries]
 *     summary: 更新字典项
 *     description: 更新指定字典项的信息，仅限管理员操作
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: 字典代码
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: 字典项 ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               label:
 *                 type: string
 *                 maxLength: 100
 *                 description: 字典项标签
 *               value:
 *                 type: string
 *                 maxLength: 100
 *                 description: 字典项值
 *               sort:
 *                 type: integer
 *                 description: 排序
 *               status:
 *                 type: string
 *                 enum: [active, inactive]
 *                 description: 字典项状态
 *     responses:
 *       200:
 *         description: 字典项更新成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/DictionaryItem'
 *       400:
 *         $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       403:
 *         $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
const updateDictionaryItem = async (req, res, next) => {
  try {
    const { code, itemId } = req.params;
    const { label, value, sort, status } = req.body;

    const item = await DictionaryItem.findById(itemId);
    if (!item) {
      return response.notFound(res, '字典项不存在');
    }

    const updates = {};
    if (label !== undefined) updates.label = label;
    if (value !== undefined) updates.value = value;
    if (sort !== undefined) updates.sort = sort;
    if (status !== undefined) updates.status = status;

    const updatedItem = await DictionaryItem.findByIdAndUpdate(itemId, updates, { new: true, runValidators: true }).lean();

    return response.success(res, updatedItem, '字典项更新成功');
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/v1/dictionaries/{code}/items/{itemId}:
 *   delete:
 *     tags: [Dictionaries]
 *     summary: 删除字典项
 *     description: 删除指定的字典项，仅限管理员操作
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: 字典代码
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: string
 *           format: ObjectId
 *         description: 字典项 ID
 *     responses:
 *       204:
 *         description: 字典项删除成功
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/StandardResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: null
 *                     code:
 *                       type: integer
 *                       example: 204
 *                     message:
 *                       type: string
 *                       example: '字典项删除成功'
 *       400:
 *         $ref: '#/components/schemas/Error'
 *       401:
 *         $ref: '#/components/schemas/Error'
 *       403:
 *         $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/schemas/Error'
 *       500:
 *         $ref: '#/components/schemas/Error'
 */
const deleteDictionaryItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    const item = await DictionaryItem.findByIdAndDelete(itemId);
    if (!item) {
      return response.notFound(res, '字典项不存在');
    }

    return response.success(res, null, '字典项删除成功');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDictionaries,
  getDictionaryItems,
  createDictionary,
  updateDictionary,
  deleteDictionary,
  createDictionaryItem,
  updateDictionaryItem,
  deleteDictionaryItem
};
