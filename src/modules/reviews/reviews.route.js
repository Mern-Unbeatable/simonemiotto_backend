const express = require('express');
const { authenticate, authorize } = require('../../middlewares/auth');
const {
  validate,
  validateParams,
  IdParamSchema,
} = require('../../validators/common.validator');
const ReviewController = require('./reviews.controller');
const {
  createReviewSchema,
  updateReviewSchema,
} = require('./reviews.validator');

const router = express.Router();
const controller = new ReviewController();

router.post(
  '/',
  authenticate,
  authorize(['USER']),
  validate(createReviewSchema),
  controller.create,
);

router.get('/:surgeonId', controller.getAll);
router.get('/:id', validateParams(IdParamSchema), controller.getById);

router.patch(
  '/:id',
  authenticate,
  authorize(['ADMIN', 'USER']),
  validateParams(IdParamSchema),
  validate(updateReviewSchema),
  controller.update,
);

router.delete(
  '/:id',
  authenticate,
  authorize(['ADMIN', 'USER']),
  validateParams(IdParamSchema),
  controller.delete,
);

module.exports = router;
