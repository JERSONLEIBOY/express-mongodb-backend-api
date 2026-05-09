const Organization = require('../models/Organization');
const response = require('../utils/response');

const getOrganizations = async (req, res, next) => {
  try {
    const { type, status, name } = req.query;

    const query = {};

    if (type) query.type = type;
    if (status) query.status = status;
    if (name) query.name = new RegExp(name, 'i');

    const organizations = await Organization.find(query)
      .sort({ sort: 1, createdAt: -1 })
      .lean();

    const tree = buildOrganizationTree(organizations);

    return response.success(res, tree);
  } catch (error) {
    next(error);
  }
};

const buildOrganizationTree = (organizations, parentId = null) => {
  return organizations
    .filter(org => {
      if (parentId === null) {
        return org.parentId === null || org.parentId === undefined;
      }
      return org.parentId && org.parentId.toString() === parentId.toString();
    })
    .map(org => ({
      ...org,
      children: buildOrganizationTree(organizations, org._id)
    }))
    .sort((a, b) => a.sort - b.sort);
};

const getOrganizationById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const organization = await Organization.findById(id)
      .populate('parentId', 'name')
      .lean();

    if (!organization) {
      return response.notFound(res, '机构不存在');
    }

    return response.success(res, organization);
  } catch (error) {
    next(error);
  }
};

const createOrganization = async (req, res, next) => {
  try {
    const { name, type, parentId, sort, status } = req.body;

    if (parentId) {
      const parentOrg = await Organization.findById(parentId);
      if (!parentOrg) {
        return response.badRequest(res, '父机构不存在');
      }
    }

    const organization = await Organization.create({
      name,
      type,
      parentId,
      sort,
      status
    });

    const populatedOrg = await Organization.findById(organization._id)
      .populate('parentId', 'name')
      .lean();

    return response.created(res, populatedOrg, '机构创建成功');
  } catch (error) {
    next(error);
  }
};

const updateOrganization = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, type, parentId, sort, status } = req.body;

    const organization = await Organization.findById(id);
    if (!organization) {
      return response.notFound(res, '机构不存在');
    }

    if (parentId && parentId === id) {
      return response.badRequest(res, '不能将自己设为父机构');
    }

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (type !== undefined) updates.type = type;
    if (parentId !== undefined) updates.parentId = parentId;
    if (sort !== undefined) updates.sort = sort;
    if (status !== undefined) updates.status = status;

    const updatedOrg = await Organization.findByIdAndUpdate(id, updates, { new: true, runValidators: true })
      .populate('parentId', 'name')
      .lean();

    return response.success(res, updatedOrg, '机构更新成功');
  } catch (error) {
    next(error);
  }
};

const deleteOrganization = async (req, res, next) => {
  try {
    const { id } = req.params;

    const organization = await Organization.findById(id);
    if (!organization) {
      return response.notFound(res, '机构不存在');
    }

    const childOrgs = await Organization.find({ parentId: id });
    if (childOrgs.length > 0) {
      return response.badRequest(res, '存在子机构，无法删除');
    }

    await Organization.findByIdAndDelete(id);

    return response.success(res, null, '机构删除成功');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  deleteOrganization
};
