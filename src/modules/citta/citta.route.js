const express = require('express');
const { authenticate, authorize } = require('../../middlewares/auth');
const {
  validate,
  validateParams,
  IdParamSchema,
} = require('../../validators/common.validator');
const CittaController = require('./citta.controller');
const { createCittaSchema, updateCittaSchema } = require('./citta.validator');

const router = express.Router();
const controller = new CittaController();

router.post(
  '/',
  authenticate,
  authorize(['ADMIN']),
  validate(createCittaSchema),
  controller.create,
);

router.get('/', controller.getAll);

router.get('/:id', validateParams(IdParamSchema), controller.getById);

router.patch(
  '/:id',
  authenticate,
  authorize(['ADMIN']),
  validateParams(IdParamSchema),
  validate(updateCittaSchema),
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
