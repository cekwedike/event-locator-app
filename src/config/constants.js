// API Response Status Codes
const STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

// API Response Messages
const MESSAGES = {
  // Auth Messages
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    TOKEN_EXPIRED: 'Token has expired',
    TOKEN_INVALID: 'Invalid token',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Access forbidden'
  },
  // Category Messages
  CATEGORY: {
    NOT_FOUND: 'Category not found',
    ALREADY_EXISTS: 'Category already exists',
    CREATED: 'Category created successfully',
    UPDATED: 'Category updated successfully',
    DELETED: 'Category deleted successfully'
  },
  // Event Messages
  EVENT: {
    NOT_FOUND: 'Event not found',
    ALREADY_EXISTS: 'Event already exists',
    CREATED: 'Event created successfully',
    UPDATED: 'Event updated successfully',
    DELETED: 'Event deleted successfully'
  },
  // General Messages
  GENERAL: {
    SERVER_ERROR: 'Internal server error',
    VALIDATION_ERROR: 'Validation error',
    NOT_FOUND: 'Resource not found'
  }
};

// Validation Rules
const VALIDATION = {
  PASSWORD: {
    MIN_LENGTH: 8,
    MAX_LENGTH: 100
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50
  },
  DESCRIPTION: {
    MAX_LENGTH: 1000
  }
};

// Pagination
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100
};

// Cache
const CACHE = {
  TTL: 3600, // 1 hour in seconds
  PREFIX: 'event_locator:'
};

module.exports = {
  STATUS_CODES,
  MESSAGES,
  VALIDATION,
  PAGINATION,
  CACHE
}; 