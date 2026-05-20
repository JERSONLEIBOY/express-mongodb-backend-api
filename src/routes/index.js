const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const roleRoutes = require('./role.routes');
const menuRoutes = require('./menu.routes');
const organizationRoutes = require('./organization.routes');
const dictionaryRoutes = require('./dictionary.routes');
const fileRoutes = require('./file.routes');
const logRoutes = require('./log.routes');

module.exports = (app) => {
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/roles', roleRoutes);
  app.use('/api/v1/menus', menuRoutes);
  app.use('/api/v1/organizations', organizationRoutes);
  app.use('/api/v1/dictionaries', dictionaryRoutes);
  app.use('/api/v1/files', fileRoutes);
  app.use('/api/v1/logs', logRoutes);
};
