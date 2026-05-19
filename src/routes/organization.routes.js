const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organization.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

router.use(authenticate);

router.get('/page', organizationController.getOrganizationsPage);
router.get('/', organizationController.getOrganizations);
router.post('/', authorize('ADMIN'), organizationController.createOrganization);
router.put('/:id', authorize('ADMIN'), organizationController.updateOrganization);
router.delete('/:id', authorize('ADMIN'), organizationController.deleteOrganization);

module.exports = router;
