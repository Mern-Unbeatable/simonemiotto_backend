const express = require('express');
const { authenticate, authorize } = require('../../middlewares/auth');
const {
  validate,
  validateParams,
  IdParamSchema,
} = require('../../validators/common.validator');

const {
  createClinicSchema,
  updateClinicSchema,
} = require('./clinic.validator');
const ClinicController = require('./clinic.controller');

const router = express.Router();
const controller = new ClinicController();

router.post(
  '/',
  authenticate,
  authorize(['ADMIN']),
  validate(createClinicSchema),
  controller.create,
);

router.get('/', controller.getAll);

router.get('/:id', validateParams(IdParamSchema), controller.getById);

router.patch(
  '/:id',
  authenticate,
  authorize(['ADMIN']),
  validateParams(IdParamSchema),
  validate(updateClinicSchema),
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
