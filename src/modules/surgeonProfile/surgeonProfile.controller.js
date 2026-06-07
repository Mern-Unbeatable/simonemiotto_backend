const { asyncHandler } = require('../../middlewares/errorHandler');
const { filterSurgeonDTO } = require('./surgeonProfile.dto');
const surgeonProfileService = require('./surgeonProfile.services');

class SurgeonProfileController {
  constructor() {
    this.profileService = new surgeonProfileService();
  }

  createProfile = asyncHandler(async (req, res) => {
    const files = req.files || {};

    const governmentIDFrontUrl = files['governmentIDFront']
      ? `/uploads/${files['governmentIDFront'][0].filename}`
      : null;

    const governmentIDBackUrl = files['governmentIDBack']
      ? `/uploads/${files['governmentIDBack'][0].filename}`
      : null;

    const certificateUrls = files['certificateFile']
      ? `/uploads/${files['certificateFile'][0].filename}`
      : null;

    const avatarUrl = files['avatarUrl']
      ? `/uploads/${files['avatarUrl'][0].filename}`
      : null;

    const imageUrls = files['images']
      ? files['images'].map((file) => `/uploads/${file.filename}`)
      : [];

    const structuredData = {
      ...req.body,
      governmentIDFrontUrl,
      governmentIDBackUrl,
      certificateUrls,
      avatarUrl,
    };

    const result = await this.profileService.createSurgeonProfile(
      imageUrls,
      structuredData,
    );
    res.sendCreated(result, 'Vendor profile created successfully');
  });

  getProfilesWebsite = asyncHandler(async (req, res) => {
    const filterDTO = new filterSurgeonDTO(req.query);
    const result =
      await this.profileService.getSurgeonProfilesWebsite(filterDTO);
    res.sendSuccess(
      result.data,
      'Surgeons profiles retrieved successfully',
      result.pagination,
    );
  });

  getProfilesBySearch = asyncHandler(async (req, res) => {
    const { search } = new filterSurgeonDTO(req.query);
    const result = await this.profileService.searchSurgeonsByName(search);
    res.sendSuccess(result, 'Surgeons profiles retrieved successfully');
  });

  getProfileAdmin = asyncHandler(async (req, res) => {
    const filterDTO = new filterSurgeonDTO(req.query);
    const result = await this.profileService.getSurgeonProfilesAdmin(filterDTO);

    res.sendSuccess(
      result.data,
      'Surgeons profiles retrieved successfully',
      result.pagination,
    );
  });

  getProfilesAdmin = asyncHandler(async (req, res) => {
    const filterDTO = new filterVendorDTO(req.query);
    const result = await this.profileService.getVendorProfilesAdmin(filterDTO);
    res.sendSuccess(
      result.data,
      'Surgeons profiles retrieved successfully',
      result.pagination,
    );
  });

  getProfileById = asyncHandler(async (req, res) => {
    const result = await this.profileService.getProfileById(req.params.id);
    res.sendSuccess(result, 'Surgeons profile retrieved successfully');
  });

  getProfileBySlug = asyncHandler(async (req, res) => {
    const result = await this.profileService.getProfileBySlug(req.params.slug);
    res.sendSuccess(result, 'Surgeons profile retrieved successfully');
  });

  getMyProfile = asyncHandler(async (req, res) => {
    const result = await this.profileService.getProfileByMy(req.user.id);
    res.sendSuccess(result, 'Your profile retrieved successfully');
  });

  updateProfile = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const files = req.files || {};

    const governmentIDFrontUrl = files['governmentIDFront']
      ? `/uploads/${files['governmentIDFront'][0].filename}`
      : undefined;

    const governmentIDBackUrl = files['governmentIDBack']
      ? `/uploads/${files['governmentIDBack'][0].filename}`
      : undefined;

    const certificateUrls = files['certificateFile']
      ? `/uploads/${files['certificateFile'][0].filename}`
      : undefined;

    // 2. Map new surgeon gallery photos array if uploaded
    const imageUrls = files['images']
      ? files['images'].map((file) => `/uploads/${file.filename}`)
      : [];

    const avatarUrl = files['avatarUrl']
      ? `/uploads/${files['avatarUrl'][0].filename}`
      : null;

    // 3. Consolidate file allocations into a clean container
    const fileUrls = {
      imageUrls,
      governmentIDFrontUrl,
      governmentIDBackUrl,
      certificateUrls,
      avatarUrl,
    };

    const result = await this.profileService.updateSurgeonProfile(
      id,
      fileUrls,
      req.body,
    );

    res.sendSuccess(result, 'Surgeon profile updated successfully');
  });
  updateStatus = asyncHandler(async (req, res) => {
    const data = req.body;
    const result = await this.profileService.updateVendorStatus(
      req.params.id,
      data,
    );
    res.sendSuccess(result, 'Surgeon profile status updated successfully');
  });

  deleteProfile = asyncHandler(async (req, res) => {
    await this.profileService.deleteVendorProfile(req.params.id);
    res.sendSuccess(null, 'Vendor profile deleted successfully');
  });

  deletePortfolioImage = asyncHandler(async (req, res) => {
    await this.profileService.deletePortfolioImage(req.params.imageId);
    res.sendSuccess(null, 'Portfolio image deleted successfully');
  });
}

module.exports = SurgeonProfileController;
