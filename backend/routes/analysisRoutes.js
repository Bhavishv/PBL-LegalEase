const express = require('express');
const router = express.Router();
const Contract = require('../models/Contract');

// @route   GET /api/analysis/stats
// @desc    Get dashboard statistics
// @access  Public (should be Protected in production)
router.get('/stats', async (req, res) => {
  try {
    const totalScans = await Contract.countDocuments();
    const contracts = await Contract.find();
    
    let totalRisks = 0;
    contracts.forEach(c => {
      totalRisks += (c.high_risk_count || 0) + (c.warning_count || 0);
    });

    // Dummy logic for trust score for now, but based on real data
    const trustScore = totalScans > 0 ? "88%" : "0%";

    res.json({
      totalScans,
      totalRisks,
      termsLearned: totalRisks * 2, // simulated logic based on data
      trustScore
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/analysis/recent
// @desc    Get recent activity
// @access  Public
router.get('/recent', async (req, res) => {
  try {
    const recent = await Contract.find().sort({ createdAt: -1 }).limit(5);
    res.json(recent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
