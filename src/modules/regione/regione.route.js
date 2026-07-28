const express = require('express');
const { authenticate, authorize } = require('../../middlewares/auth');
const {
  validate,
  validateParams,
  IdParamSchema,
} = require('../../validators/common.validator');
const RegioneController = require('./regione.controller');
const {
  createRegioneSchema,
  updateRegioneSchema,
} = require('./regione.validator');

const router = express.Router();
const controller = new RegioneController();

router.post(
  '/',
  authenticate,
  authorize(['ADMIN']),
  validate(createRegioneSchema),
  controller.create,
);

router.get('/', controller.getAll);

router.get(
  '/dashboard-tree',
  authenticate,
  authorize(['ADMIN']),
  controller.getDashboardTree,
);

router.get(
  '/:id',
  validateParams(IdParamSchema),
  controller.getById,
);

router.patch(
  '/:id',
  authenticate,
  authorize(['ADMIN']),
  validateParams(IdParamSchema),
  validate(updateRegioneSchema),
  controller.update,
);

router.delete(
  '/:id',
  authenticate,
  authorize(['ADMIN']),
  validateParams(IdParamSchema),
  controller.delete,
);

module.exports = router;
