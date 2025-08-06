const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { specs, swaggerUi, swaggerOptions } = require('./swagger');

// Load environment variables
dotenv.config();

// Route files
const auth = require('./routes/auth');
const company = require('./routes/company');
const bills = require('./routes/billOfQuantity');
const categories = require('./routes/categories');
const customers = require('./routes/customers');
const events = require('./routes/events');
const ingredients = require('./routes/ingredients');
const menus = require('./routes/menus');

// Initialize Express app
const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Security headers
app.use(helmet());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));

// API Info endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Bill of Quantity API',
    version: '1.0.0',
    documentation: `${req.protocol}://${req.get('host')}/api-docs`,
    endpoints: {
      auth: '/api/auth',
      company: '/api/company', 
      ingredients: '/api/ingredients',
      menus: '/api/menus',
      events: '/api/events',
      customers: '/api/customers',
      categories: '/api/categories',
      bills: '/api/bills'
    }
  });
});

// Connect to database
mongoose.connect(process.env.MONGO_URI);

// Mount routers
app.use('/api/auth', auth);
app.use('/api/company', company);
app.use('/api/bills', bills);
app.use('/api/categories', categories);
app.use('/api/customers', customers);
app.use('/api/events', events);
app.use('/api/ingredients', ingredients);
app.use('/api/menus', menus);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
  console.log(`🔗 API Base URL: http://localhost:${PORT}`);
});




