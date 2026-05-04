const mongoose = require('mongoose');
require('dotenv').config({ path: '../backend/.env' });
const Contract = require('../backend/models/Contract');

async function checkDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");
    const count = await Contract.countDocuments();
    console.log("Total Contracts:", count);
    const last = await Contract.findOne().sort({ createdAt: -1 });
    if (last) {
        console.log("Last Contract UserID:", last.userId);
        console.log("Last Contract Filename:", last.filename);
    }
    await mongoose.disconnect();
  } catch (e) {
    console.error(e);
  }
}

checkDB();
