const express = require('express');
const { authenticate, authorize } = require('../../middlewares/auth');
const {
  validate,
  validateParams,
  IdParamSchema,
} = require('../../validators/common.validator');
const ProvinciaController = require('./provincia.controller');
const {
  createProvinciaSchema,
  updateProvinciaSchema,
} = require('./provincia.validator');

const router = express.Router();
const controller = new ProvinciaController();

router.post(
  '/',
  authenticate,
  authorize(['ADMIN']),
  validate(createProvinciaSchema),
  controller.create,
);

router.get('/', authenticate, authorize(['ADMIN']), controller.getAll);

router.get(
  '/:id',
  authenticate,
  authorize(['ADMIN']),
  validateParams(IdParamSchema),
  controller.getById,
);

router.patch(
  '/:id',
  authenticate,
  authorize(['ADMIN']),
  validateParams(IdParamSchema),
  validate(updateProvinciaSchema),
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
