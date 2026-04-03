const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// Routes
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'Sentinels Server is running smoothly',
        timestamp: new Date()
    });
});

const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

// Database Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/sentinels')
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => {
        console.error('❌ MongoDB Connection Error:', err.message);
        console.log('💡 Tip: Ensure MongoDB service is running locally or check your MONGODB_URI in server/.env');
    });

app.listen(PORT, () => {
    console.log(`🚀 Server is flying on port ${PORT}`);
});
