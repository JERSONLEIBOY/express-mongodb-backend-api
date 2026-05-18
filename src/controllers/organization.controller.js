const Organization = require('../models/Organization');
const response = require('../utils/response');

const getOrganizations = async (req, res, next) => {
  try {
    const { organizationName, organizationFullName, organizationType } = req.query;

    const query = {};
    if (organizationName) query.organizationName = new RegExp(organizationName, 'i');
    if (organizationFullName) query.organizationFullName = new RegExp(organizationFullName, 'i');
    if (organizationType) query.organizationType = organizationType;

    const organizations = await Organization.find(query)
      .sort({ sortNumber: 1, createdAt: -1 })
      .lean();

    const tree = buildOrganizationTree(organizations);
    return response.success(res, tree);
  } catch (error) {
    next(error);
  }
};

const buildOrganizationTree = (organizations, parentId = '0') => {
  return organizations
    .filter(org => (org.parentId || '0') === parentId)
    .map(org => ({
      ...org,
      organizationId: org._id,
      children: buildOrganizationTree(organizations, org._id.toString())
    }))
    .sort((a, b) => a.sortNumber - b.sortNumber);
};

const getOrganizationById = async (req, res, next) => {
  try {
    const organization = await Organization.findById(req.params.id).lean();
    if (!organization) return response.notFound(res, '机构不存在');
    return response.success(res, { ...organization, organizationId: organization._id });
  } catch (error) {
    next(error);
  }
};

const createOrganization = async (req, res, next) => {
  try {
    const { organizationName, organizationFullName, organizationCode, organizationType, parentId, sortNumber, comments } = req.body;

    if (parentId && parentId !== '0') {
      const parentOrg = await Organization.findById(parentId);
      if (!parentOrg) return response.badRequest(res, '父机构不存在');
    }

    const organization = await Organization.create({
      organizationName, organizationFullName, organizationCode,
      organizationType, parentId: parentId || '0', sortNumber, comments
    });

    return response.created(res, { ...organization.toObject(), organizationId: organization._id }, '机构创建成功');
  } catch (error) {
    next(error);
  }
};

const updateOrganization = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { organizationName, organizationFullName, organizationCode, organizationType, parentId, sortNumber, comments } = req.body;

    const organization = await Organization.findById(id);
    if (!organization) return response.notFound(res, '机构不存在');

    if (parentId && parentId === id) return response.badRequest(res, '不能将自己设为父机构');

    const updates = {};
    if (organizationName !== undefined) updates.organizationName = organizationName;
    if (organizationFullName !== undefined) updates.organizationFullName = organizationFullName;
    if (organizationCode !== undefined) updates.organizationCode = organizationCode;
    if (organizationType !== undefined) updates.organizationType = organizationType;
    if (parentId !== undefined) updates.parentId = parentId;
    if (sortNumber !== undefined) updates.sortNumber = sortNumber;
    if (comments !== undefined) updates.comments = comments;

    const updated = await Organization.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).lean();
    return response.success(res, { ...updated, organizationId: updated._id }, '机构更新成功');
  } catch (error) {
    next(error);
  }
};

const deleteOrganization = async (req, res, next) => {
  try {
    const { id } = req.params;

    const organization = await Organization.findById(id);
    if (!organization) return response.notFound(res, '机构不存在');

    const childOrgs = await Organization.find({ parentId: id });
    if (childOrgs.length > 0) return response.badRequest(res, '存在子机构，无法删除');

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
