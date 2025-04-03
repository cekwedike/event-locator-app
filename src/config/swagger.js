const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Event Locator API',
      version: '1.0.0',
      description: 'API for the Event Locator application',
      contact: {
        name: 'API Support',
        email: 'support@eventlocator.com'
      }
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ],
    components: {
      schemas: {
        Event: {
          type: 'object',
          properties: {
            id: {
              type: 'integer'
            },
            title: {
              type: 'string'
            },
            description: {
              type: 'string'
            },
            location: {
              type: 'object',
              properties: {
                type: {
                  type: 'string',
                  example: 'Point'
                },
                coordinates: {
                  type: 'array',
                  items: {
                    type: 'number'
                  }
                }
              }
            },
            start_time: {
              type: 'string',
              format: 'date-time'
            },
            end_time: {
              type: 'string',
              format: 'date-time'
            },
            category_id: {
              type: 'integer'
            },
            created_by: {
              type: 'integer'
            }
          }
        },
        Review: {
          type: 'object',
          properties: {
            id: {
              type: 'integer'
            },
            rating: {
              type: 'integer',
              minimum: 1,
              maximum: 5
            },
            comment: {
              type: 'string'
            },
            user_id: {
              type: 'integer'
            },
            event_id: {
              type: 'integer'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            message: {
              type: 'string'
            },
            error: {
              type: 'string'
            }
          }
        }
      },
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./src/routes/*.js']
};

const specs = swaggerJsdoc(options);

module.exports = specs; 