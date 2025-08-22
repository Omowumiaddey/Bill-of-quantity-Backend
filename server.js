const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const { specs, swaggerUi, swaggerOptions } = require('./swagger');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
// Skip JSON parsing for company registration to allow multipart/form-data
app.use((req, res, next) => {
  if (req.path === '/api/company/register') return next();
  return express.json()(req, res, next);
});

// Multer file upload setup
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
const storage = multer.diskStorage({
  destination: function(req, file, cb) { cb(null, uploadsDir); },
  filename: function(req, file, cb) {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const timestamp = Date.now();
    cb(null, `${timestamp}-${safeName}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});
app.set('upload', upload);
app.use('/uploads', express.static(uploadsDir));
//Use middleware to parse URL-encoded request bodies
app.use(express.urlencoded({extended: true}));

// Dynamic CORS based on environment
const isProd = process.env.NODE_ENV === 'production';
const corsOrigins = isProd
  ? [process.env.FRONTEND_PROD_URL || 'https://asl-boq.vercel.app']
  : [
      process.env.FRONTEND_URL,
      process.env.FRONTEND_URL_VITE,
      'http://localhost:3000',
      'http://localhost:5173'
    ].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (like mobile apps, curl)
    if (!origin) return callback(null, true);
    if (corsOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Security headers
app.use(helmet());

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));

// API Info endpoint - redirect to Swagger
app.get('/', (req, res) => {
  // Check if request accepts HTML (browser request)
  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    // Redirect browsers to Swagger documentation
    return res.redirect('/api-docs');
  }
  
  // Return JSON for API clients
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
  console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV}]`);
  const baseUrl = process.env.NODE_ENV === 'production'
    ? 'https://bill-of-quantity-backend.onrender.com'
    : `http://localhost:${PORT}`;
  console.log(`📚 API Documentation: ${baseUrl}/api-docs`);
  console.log(`🔗 API Base URL: ${baseUrl}`);
});






