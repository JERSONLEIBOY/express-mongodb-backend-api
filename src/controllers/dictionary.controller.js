const Dictionary = require('../models/Dictionary');
const DictionaryItem = require('../models/DictionaryItem');
const response = require('../utils/response');

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
