const swaggerJsdoc = require('swagger-jsdoc');

/**
 * Swagger configuration options
 */
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Netflix API',
      version: '1.0.0',
      description: 'API for Netflix-like streaming service',
      contact: {
        name: 'API Support',
        email: 'support@netflix-api.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:8081',
        description: 'Development server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            user_id: { type: 'integer' },
            email: { type: 'string', format: 'email' },
            first_name: { type: 'string' },
            last_name: { type: 'string' },
            status: { type: 'string', enum: ['active', 'inactive', 'pending'] },
            referral_code: { type: 'string' },
            referral_id: { type: 'integer', nullable: true },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Profile: {
          type: 'object',
          properties: {
            profile_id: { type: 'integer' },
            user_id: { type: 'integer' },
            name: { type: 'string' },
            language: { type: 'string' },
            content_classification: { type: 'string', enum: ['G', 'PG', 'PG13', 'R', 'NC17'] },
            is_kids: { type: 'boolean' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Subscription: {
          type: 'object',
          properties: {
            subscription_id: { type: 'integer' },
            user_id: { type: 'integer' },
            type: { type: 'string', enum: ['SD', 'HD', 'UHD'] },
            status: { type: 'string', enum: ['active', 'canceled', 'expired'] },
            price: { type: 'number', format: 'float' },
            start_date: { type: 'string', format: 'date-time' },
            end_date: { type: 'string', format: 'date-time', nullable: true },
            description: { type: 'string' }
          }
        },
        Media: {
          type: 'object',
          properties: {
            media_id: { type: 'integer' },
            title: { type: 'string' },
            description: { type: 'string' },
            release_date: { type: 'string', format: 'date' },
            duration: { type: 'integer' },
            type: { type: 'string', enum: ['movie', 'episode'] },
            content_classification: { type: 'string', enum: ['G', 'PG', 'PG13', 'R', 'NC17'] },
            season_id: { type: 'integer', nullable: true },
            thumbnail_url: { type: 'string', format: 'uri' },
            media_url: { type: 'string', format: 'uri' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Series: {
          type: 'object',
          properties: {
            series_id: { type: 'integer' },
            title: { type: 'string' },
            description: { type: 'string' },
            start_year: { type: 'integer' },
            end_year: { type: 'integer', nullable: true },
            content_classification: { type: 'string', enum: ['G', 'PG', 'PG13', 'R', 'NC17'] },
            thumbnail_url: { type: 'string', format: 'uri' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Season: {
          type: 'object',
          properties: {
            season_id: { type: 'integer' },
            series_id: { type: 'integer' },
            title: { type: 'string' },
            season_number: { type: 'integer' },
            release_year: { type: 'integer' },
            thumbnail_url: { type: 'string', format: 'uri' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        WatchHistory: {
          type: 'object',
          properties: {
            history_id: { type: 'integer' },
            profile_id: { type: 'integer' },
            media_id: { type: 'integer' },
            progress: { type: 'integer' },
            status: { type: 'string', enum: ['in_progress', 'completed', 'abandoned'] },
            watched_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        WatchList: {
          type: 'object',
          properties: {
            watchlist_id: { type: 'integer' },
            profile_id: { type: 'integer' },
            media_id: { type: 'integer' },
            status: { type: 'string', enum: ['added', 'removed', 'watched'] },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' }
          }
        },
        Genre: {
          type: 'object',
          properties: {
            genre_id: { type: 'integer' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
            details: { type: 'string', nullable: true }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication information is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFoundError: {
          description: 'The specified resource was not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ValidationError: {
          description: 'The request data failed validation',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    }
  },
  apis: [
    './src/routes/*.js',
    './src/controllers/*.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = specs;
