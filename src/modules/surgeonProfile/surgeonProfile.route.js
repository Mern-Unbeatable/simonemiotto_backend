const express = require('express');
const { authenticate, authorize } = require('../../middlewares/auth');
const {
  validate,
  validateParams,
  validateQuery,
  IdParamSchema,
} = require('../../validators/common.validator');
const upload = require('../../middlewares/upload');
const {
  createSurgeonProfileSchema,
  updateSurgeonProfileSchema,
  updateStatusSchema,
} = require('./surgeonProfile.validator');
const SurgeonProfileController = require('./surgeonProfile.controller');
const packageParseMiddleware = require('./surgeonProfile.parseData');
const { filterSurgeonDTO } = require('./surgeonProfile.dto');

const router = express.Router();
const controller = new SurgeonProfileController();

// Authenticated vendor routes
router.post(
  '/',
  upload.fields([
    { name: 'images', maxCount: 20 },
    { name: 'governmentIDFront', maxCount: 1 },
    { name: 'governmentIDBack', maxCount: 1 },
    { name: 'certificateFile', maxCount: 1 },
    { name: 'avatarUrl', maxCount: 1 },
  ]),
  packageParseMiddleware(),
  validate(createSurgeonProfileSchema),
  controller.createProfile,
);

router.get('/website', controller.getProfilesWebsite);
router.get('/admin', controller.getProfileAdmin);

router.get('/:id', validateParams(IdParamSchema), controller.getProfileById);
router.get('/slug/:slug', controller.getProfileBySlug);

router.get(
  '/my/profile',
  authenticate,
  authorize(['SURGEON']),
  controller.getMyProfile,
);

router.patch(
  '/update/:id',
  authenticate,
  authorize(['SURGEON', 'ADMIN']),
  upload.fields([
    { name: 'images', maxCount: 20 },
    { name: 'governmentIDFront', maxCount: 1 },
    { name: 'governmentIDBack', maxCount: 1 },
    { name: 'certificateFile', maxCount: 1 },
    { name: 'avatarUrl', maxCount: 1 },
  ]),
  packageParseMiddleware(),
  validate(updateSurgeonProfileSchema),
  controller.updateProfile,
);

router.patch(
  '/status/:id',
  authenticate,
  authorize(['ADMIN']),
  validateParams(IdParamSchema),
  validate(updateStatusSchema),
  controller.updateStatus,
);

router.delete(
  '/:id',
  authenticate,
  authorize(['SURGEON', 'ADMIN']),
  validateParams(IdParamSchema),
  controller.deleteProfile,
);

router.delete(
  '/portfolio/:imageId',
  authenticate,
  authorize(['SURGEON', 'ADMIN']),
  controller.deletePortfolioImage,
);

module.exports = router;
