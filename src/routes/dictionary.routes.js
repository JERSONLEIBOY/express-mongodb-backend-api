const express = require('express');
const router = express.Router();
const dictionaryController = require('../controllers/dictionary.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/', dictionaryController.getDictionaries);
router.get('/data/page', dictionaryController.getDictionaryDataPage);
router.get('/data', dictionaryController.getDictionaryDataByCode);
router.post('/', authorize('ADMIN'), dictionaryController.createDictionary);
router.post('/data', authorize('ADMIN'), dictionaryController.createDictionaryItem);
router.put('/data/:itemId', authorize('ADMIN'), dictionaryController.updateDictionaryItem);
router.delete('/data/:itemId', authorize('ADMIN'), dictionaryController.deleteDictionaryItem);
router.delete('/data', authorize('ADMIN'), dictionaryController.deleteDictionaryItemBatch);
router.put('/:id', authorize('ADMIN'), dictionaryController.updateDictionary);
router.delete('/:id', authorize('ADMIN'), dictionaryController.deleteDictionary);

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
 *     responses:
 *       200:
 *         description: 成功
 * /api/v1/dictionaries/data:
 *   get:
 *     tags: [Dictionaries]
 *     summary: 通过字典编码获取字典数据
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dictCode
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: 成功
 */

module.exports = router;
