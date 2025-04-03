const Joi = require('joi');

// User validation schemas
const userSchemas = {
  register: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    name: Joi.string().required(),
    preferred_language: Joi.string().valid('en', 'es', 'fr').default('en'),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  updatePreferences: Joi.object({
    preferred_categories: Joi.array().items(Joi.string()),
    notification_radius: Joi.number().min(1).max(100),
    notification_enabled: Joi.boolean(),
  }),

  updateLocation: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
  }),
};

// Event validation schemas
const eventSchemas = {
  create: Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required(),
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    start_time: Joi.date().iso().greater('now').required(),
    end_time: Joi.date().iso().min(Joi.ref('start_time')).required(),
    category: Joi.string().required(),
  }),

  update: Joi.object({
    title: Joi.string(),
    description: Joi.string(),
    latitude: Joi.number().min(-90).max(90),
    longitude: Joi.number().min(-180).max(180),
    start_time: Joi.date().iso().greater('now'),
    end_time: Joi.date().iso().min(Joi.ref('start_time')),
    category: Joi.string(),
  }),

  search: Joi.object({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
    radius: Joi.number().min(1).max(100).default(10),
    category: Joi.string(),
    start_date: Joi.date().iso(),
    end_date: Joi.date().iso().min(Joi.ref('start_date')),
  }),
};

// Rating validation schema
const ratingSchema = Joi.object({
  rating: Joi.number().min(1).max(5).required(),
  review: Joi.string().allow(''),
});

const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body);
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
  ratingSchema,
  validate,
}; 