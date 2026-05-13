const swaggerSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Rapido Backend API',
    version: '1.0.0',
    description: 'API documentation for the Rapido backend.',
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Local development server',
    },
  ],
  tags: [
    {
      name: 'Health',
      description: 'Basic application checks',
    },
    {
      name: 'Users',
      description: 'User authentication and account management',
    },
  ],
  paths: {
    '/': {
      get: {
        tags: ['Health'],
        summary: 'Health check',
        responses: {
          200: {
            description: 'Server is running',
            content: {
              'text/plain': {
                schema: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
    },
    '/api/users/register': {
      post: {
        tags: ['Users'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['fullname', 'email', 'password'],
                properties: {
                  fullname: {
                    type: 'object',
                    required: ['firstname', 'lastname'],
                    properties: {
                      firstname: {
                        type: 'string',
                        example: 'John',
                        minLength: 3,
                      },
                      lastname: {
                        type: 'string',
                        example: 'Doe',
                        minLength: 3,
                      },
                    },
                  },
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'john@example.com',
                  },
                  password: {
                    type: 'string',
                    example: 'secret123',
                    minLength: 6,
                  },
                },
              },
              examples: {
                sample: {
                  value: {
                    fullname: {
                      firstname: 'John',
                      lastname: 'Doe',
                    },
                    email: 'john@example.com',
                    password: 'secret123',
                  },
                },
              },
            },
          },
        },
        responses: {
          201: {
            description: 'User created successfully',
          },
          400: {
            description: 'Validation error or user already exists',
          },
          500: {
            description: 'Server error',
          },
        },
      },
    },
    '/api/users/login': {
      post: {
        tags: ['Users'],
        summary: 'Login a user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: {
                    type: 'string',
                    format: 'email',
                    example: 'john@example.com',
                  },
                  password: {
                    type: 'string',
                    example: 'secret123',
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Logged in successfully',
          },
          401: {
            description: 'Invalid credentials',
          },
        },
      },
    },
    '/api/users/logout': {
      post: {
        tags: ['Users'],
        summary: 'Logout a user',
        responses: {
          200: {
            description: 'Logged out successfully',
          },
        },
      },
    },
  },
};

module.exports = swaggerSpec;
