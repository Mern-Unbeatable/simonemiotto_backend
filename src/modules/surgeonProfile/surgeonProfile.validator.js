const Joi = require('joi');

const createSurgeonProfileSchema = Joi.object({
  clinicId: Joi.string().trim().required(),
  cityId: Joi.string().trim().required(),
  name: Joi.string().trim().required(),
  email: Joi.string().email().trim().required(),
  password: Joi.string().min(6).required(),
  phone: Joi.string().trim().required(),
  specialization: Joi.string().trim().required(),
  // experience: Joi.string().trim().required(),
  experienceYears: Joi.number().integer().min(0).required(),
  language: Joi.string().trim().required(),
  patientApproach: Joi.string().trim().required(),

  bio: Joi.string().trim().allow(null, '').optional(),
  address: Joi.string().trim().allow(null, '').optional(),
  availability: Joi.string().trim().allow(null, '').optional(),
  boardRegistrationNumber: Joi.string().trim().allow(null, '').optional(),
  governmentIDFrontUrl: Joi.string().allow(null, '').optional(),
  governmentIDBackUrl: Joi.string().allow(null, '').optional(),
  certificateUrls: Joi.string().allow(null, '').optional(),

  education: Joi.array().items(Joi.string().trim().required()).required(),
  areasExpertise: Joi.array().items(Joi.string().trim().required()).required(),
  certifications: Joi.array().items(Joi.string().trim().required()).required(),

  // Validates the loose JSON structure for dynamic UI rendering
  procedures: Joi.array()
    .items(
      Joi.object({
        title: Joi.string().trim().required(),
        treatments: Joi.array()
          .items(Joi.string().trim().required())
          .required(),
      }),
    )
    .allow(null)
    .optional(),

  isVerified: Joi.boolean().default(false).optional(),
  status: Joi.string()
    .valid('PENDING', 'APPROVED', 'REJECTED')
    .default('PENDING')
    .optional(),
  paymentStatus: Joi.string()
    .valid('UNPAID', 'ACTIVE', 'EXPIRED')
    .default('UNPAID')
    .optional(),
});

const updateSurgeonProfileSchema = Joi.object({
  userId: Joi.string().trim().optional(),
  clinicId: Joi.string().trim().optional(),
  cityId: Joi.string().trim().optional(),
  name: Joi.string().trim().optional(),
  slug: Joi.string().trim().optional(),
  specialization: Joi.string().trim().optional(),
  experience: Joi.string().trim().optional(),
  experienceYears: Joi.number().integer().min(0).optional(),
  language: Joi.string().trim().optional(),
  patientApproach: Joi.string().trim().optional(),

  bio: Joi.string().trim().allow(null, '').optional(),
  address: Joi.string().trim().allow(null, '').optional(),
  availability: Joi.string().trim().allow(null, '').optional(),
  boardRegistrationNumber: Joi.string().trim().allow(null, '').optional(),
  governmentIDFrontUrl: Joi.string().uri().allow(null, '').optional(),
  governmentIDBackUrl: Joi.string().uri().allow(null, '').optional(),
  certificateUrls: Joi.string().uri().allow(null, '').optional(),

  education: Joi.array().items(Joi.string().trim().required()).optional(),
  areasExpertise: Joi.array().items(Joi.string().trim().required()).optional(),
  certifications: Joi.array().items(Joi.string().trim().required()).optional(),

  procedures: Joi.array()
    .items(
      Joi.object({
        title: Joi.string().trim().required(),
        treatments: Joi.array()
          .items(Joi.string().trim().required())
          .required(),
      }),
    )
    .allow(null)
    .optional(),

  isVerified: Joi.boolean().optional(),
  status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED').optional(),
  paymentStatus: Joi.string().valid('UNPAID', 'ACTIVE', 'EXPIRED').optional(),
}).min(1);

const vendorFilterQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).optional(),
  limit: Joi.number().integer().min(1).max(100).optional(),
  sortBy: Joi.string()
    .valid('createdAt', 'updatedAt', 'businessName', 'location')
    .optional(),
  sortOrder: Joi.string().valid('asc', 'desc').optional(),
  search: Joi.string().trim().optional(),
  locationSearch: Joi.string().trim().optional(),
  category: Joi.string().trim().optional(),
  city: Joi.string().trim().optional(),
  state: Joi.string().trim().optional(),
  availableDate: Joi.date().iso().optional(),
  minPrice: Joi.number().min(0).optional(),
  maxPrice: Joi.number().min(0).optional(),
  status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED').optional(),
});

const updateStatusSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED').optional(),
  paymentStatus: Joi.string().valid('UNPAID', 'ACTIVE', 'EXPIRED').optional(),
});

module.exports = {
  createSurgeonProfileSchema,
  updateSurgeonProfileSchema,
  vendorFilterQuerySchema,
  updateStatusSchema,
};
