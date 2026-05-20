const formatRole = (r) => ({
  roleId: r._id,
  roleCode: r.roleCode,
  roleName: r.roleName,
  comments: r.comments ?? null,
  createTime: r.createdAt
});

const formatMenu = (m) => ({
  menuId: m._id,
  parentId: m.parentId ?? 0,
  title: m.title,
  path: m.path ?? null,
  component: m.component ?? null,
  menuType: m.menuType ?? 0,
  sortNumber: m.sortNumber ?? 0,
  authority: m.authority ?? null,
  icon: m.icon ?? null,
  hide: m.hide ?? 0,
  meta: m.meta ?? null,
  openType: m.openType ?? null,
  createTime: m.createdAt,
  updateTime: m.updatedAt,
  children: null,
  checked: m.checked ?? null
});

module.exports = {
  formatRole,
  formatMenu
};
