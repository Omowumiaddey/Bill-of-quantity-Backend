const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Bill of Quantity API',
      version: '1.0.0',
      description: 'Complete API for catering management and bill of quantity generation',
      contact: {
        name: 'API Support',
        email: 'support@billofquantity.com'
      }
    },
    servers: [
      {
        url: 'https://bill-of-quantity-backend.onrender.com',
        description: 'Production server (Render)',
      },
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from login'
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [
    './routes/auth.js',
    './routes/company.js', 
    './routes/menus.js',
    './routes/events.js',
    './routes/customers.js',
     './routes/ingredients.js',
    './routes/billOfQuantity.js',
    './models/*.js'
  ],
};

const specs = swaggerJsdoc(options);

// Custom CSS for better UI
const customCss = `
  .swagger-ui .topbar { display: none }
  .swagger-ui .info { margin: 20px 0 }
  .swagger-ui .scheme-container { background: #fafafa; padding: 15px; border-radius: 4px }
  .swagger-ui .btn.authorize { background-color: #49cc90; border-color: #49cc90 }
  .swagger-ui .btn.authorize:hover { background-color: #3ea574; border-color: #3ea574 }
`;

const swaggerOptions = {
  customCss,
  customSiteTitle: "Bill of Quantity API Docs",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'none',
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    tryItOutEnabled: true
  }
};

module.exports = { 
  specs, 
  swaggerUi,
  swaggerOptions 
};




