const express = require('express');
const { authenticate, authorize } = require('../../middlewares/auth');
const {
  validate,
  validateParams,
  IdParamSchema,
} = require('../../validators/common.validator');
const CityController = require('./city.controller');
const { createCitySchema, updateCitySchema } = require('./city.validator');

const router = express.Router();
const controller = new CityController();

router.post(
  '/',
  authenticate,
  authorize(['ADMIN']),
  validate(createCitySchema),
  controller.create,
);

router.get('/', controller.getAll);

router.get('/:id', validateParams(IdParamSchema), controller.getById);

router.patch(
  '/:id',
  authenticate,
  authorize(['ADMIN']),
  validateParams(IdParamSchema),
  validate(updateCitySchema),
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
