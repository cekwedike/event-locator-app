const Joi = require('joi');

// User validation schemas
const userSchemas = {
  register: Joi.object({
    name: Joi.string().required().min(2).max(50),
    email: Joi.string().email().required(),
    password: Joi.string().required().min(8).max(50),
    preferred_language: Joi.string().length(2).default('en'),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  updatePreferences: Joi.object({
    preferred_language: Joi.string().length(2),
    notification_preferences: Joi.object({
      email: Joi.boolean(),
      push: Joi.boolean(),
    }),
  }),

  updateLocation: Joi.object({
    latitude: Joi.number().required().min(-90).max(90),
    longitude: Joi.number().required().min(-180).max(180),
  }),
};

// Event validation schemas
const eventSchemas = {
  create: Joi.object({
    title: Joi.string().required().min(3).max(100),
    description: Joi.string().required().min(10).max(1000),
    latitude: Joi.number().required().min(-90).max(90),
    longitude: Joi.number().required().min(-180).max(180),
    start_time: Joi.date().iso().required(),
    end_time: Joi.date().iso().min(Joi.ref('start_time')).required(),
    category_id: Joi.number().integer().required(),
  }),

  update: Joi.object({
    title: Joi.string().min(3).max(100),
    description: Joi.string().min(10).max(1000),
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180),
    start_time: Joi.date().iso(),
    end_time: Joi.date().iso().min(Joi.ref('start_time')),
    category_id: Joi.number().integer(),
  }),

  search: Joi.object({
    latitude: Joi.number().required().min(-90).max(90),
    longitude: Joi.number().required().min(-180).max(180),
    radius: Joi.number().min(0.1).max(100).default(10),
    category_id: Joi.number().integer(),
    start_date: Joi.date().iso(),
    end_date: Joi.date().iso().min(Joi.ref('start_date')),
  }),

  rate: Joi.object({
    rating: Joi.number().required().min(1).max(5),
    review: Joi.string().max(500),
  }),
};

// Authentication validation schemas
const authSchemas = {
  refreshToken: Joi.object({
    refresh_token: Joi.string().required(),
  }),

  changePassword: Joi.object({
    current_password: Joi.string().required(),
    new_password: Joi.string().required().min(8).max(50),
  }),

  forgotPassword: Joi.object({
    email: Joi.string().email().required(),
  }),

  resetPassword: Joi.object({
    token: Joi.string().required(),
    new_password: Joi.string().required().min(8).max(50),
  }),
};

// Category validation schemas
const categorySchemas = {
  create: Joi.object({
    name: Joi.string().required().min(2).max(50),
    description: Joi.string().max(200),
    icon: Joi.string().max(50),
  }),

  update: Joi.object({
    name: Joi.string().min(2).max(50),
    description: Joi.string().max(200),
    icon: Joi.string().max(50),
  }),
};

// Review validation schemas
const reviewSchemas = {
  create: Joi.object({
    rating: Joi.number().required().min(1).max(5),
    comment: Joi.string().max(500),
  }),

  update: Joi.object({
    rating: Joi.number().min(1).max(5),
    comment: Joi.string().max(500),
  }),
};

const validate = (schema) => (req, res, next) => {
  const dataToValidate = req.method === 'GET' ? req.query : req.body;
  const { error } = schema.validate(dataToValidate);
  if (error) {
    return res.status(400).json({
      status: 'error',
      message: error.details[0].message,
    });
  }
  next();
};

module.exports = {
  userSchemas,
  eventSchemas,
  authSchemas,
  categorySchemas,
  reviewSchemas,
  validate,
}; 