const express = require('express');
const router = express.Router();
const dictionaryController = require('../controllers/dictionary.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/', dictionaryController.getDictionaries);
router.get('/:code/items', dictionaryController.getDictionaryItems);
router.post('/', authorize('ADMIN'), dictionaryController.createDictionary);
router.put('/:id', authorize('ADMIN'), dictionaryController.updateDictionary);
router.delete('/:id', authorize('ADMIN'), dictionaryController.deleteDictionary);
router.post('/:code/items', authorize('ADMIN'), dictionaryController.createDictionaryItem);
router.put('/:code/items/:itemId', authorize('ADMIN'), dictionaryController.updateDictionaryItem);
router.delete('/:code/items/:itemId', authorize('ADMIN'), dictionaryController.deleteDictionaryItem);

module.exports = router;
