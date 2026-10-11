import swaggerJsdoc from 'swagger-jsdoc';

export const swaggerSpec = swaggerJsdoc({
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Loan Management System',
      description: 'Loan Management System API',
      version: '1.0',
    },
    // Every module documents bare resource paths (e.g. "/users"); all of
    // them are actually mounted under /api in app.ts (except the root
    // health check), so Swagger's "Try it out" needs this to hit the
    // real paths instead of 404ing.
    servers: [{ url: '/api' }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    // Default every documented route to requiring a bearer token; routes
    // that are actually public (register/login/health) override this with
    // `security: []` in their own JSDoc block.
    security: [{ bearerAuth: [] }],
  },
  apis: ['./src/modules/**/*.routes.ts', './dist/modules/**/*.routes.js'],
});
