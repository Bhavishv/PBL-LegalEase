const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Monitor DB Connection Events
        mongoose.connection.on('connected', () => {
            console.log('MongoDB connection established successfully.');
        });

        mongoose.connection.on('error', (err) => {
            console.error(`MongoDB connection error: ${err}`);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('MongoDB connection disconnected. Check your network or DB server.');
        });

        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`MongoDB Initial Connection Error: ${error.message}`);
        console.error('Make sure your MONGO_URI is correct and the database is running.');
        process.exit(1);
    }
};

module.exports = connectDB;
