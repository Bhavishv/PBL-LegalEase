const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());
app.use('/uploads', express.static('uploads'));
app.use(cors());

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/scan', require('./routes/scanRoutes'));

// Default Route
app.get('/', (req, res) => {
  res.send('LegalEase API is running...');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', console.log(`Server running on port ${PORT} and listening to all network interfaces.`));
