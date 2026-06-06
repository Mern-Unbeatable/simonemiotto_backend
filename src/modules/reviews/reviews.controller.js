const { asyncHandler } = require('../../middlewares/errorHandler');
const { filterReviewsDTO } = require('./reviews.dto');
const ReviewDAO = require('./reviews.services');

class ReviewController {
  constructor() {
    this.service = new ReviewDAO();
  }

  create = asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const result = await this.service.createReview(req.body, userId);
    res.sendCreated(result, 'Review created successfully');
  });

  getAll = asyncHandler(async (req, res) => {
    const id = req.params.surgeonId;
    const filterDTO = new filterReviewsDTO(req.query);
    const result = await this.service.getReviewsBySurgeon(id, filterDTO);
    res.sendSuccess(
      result.data,
      'review retrieved successfully',
      result.pagination,
    );
  });

  getById = asyncHandler(async (req, res) => {
    const result = await this.service.getReviewById(req.params.id);
    res.sendSuccess(result, 'Review retrieved successfully');
  });

  update = asyncHandler(async (req, res) => {
    const result = await this.service.updateReview(req.params.id, req.body);
    res.sendSuccess(result, 'Review updated successfully');
  });

  delete = asyncHandler(async (req, res) => {
    await this.service.deleteReview(req.params.id);
    res.sendSuccess(null, 'Review deleted successfully');
  });
}

module.exports = ReviewController;
