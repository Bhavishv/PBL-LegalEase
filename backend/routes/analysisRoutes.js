const express = require('express');
const router = express.Router();
const Contract = require('../models/Contract');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/analysis/save
// @desc    Save an analysis result to the database
// @access  Private
router.post('/save', protect, async (req, res) => {
  try {
    const analysisData = req.body;
    
    // Create a new contract associated with the logged-in user
    const contract = await Contract.create({
      ...analysisData,
      userId: req.user._id
    });

    res.status(201).json(contract);
  } catch (error) {
    console.error("Error saving contract:", error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/analysis/stats
// @desc    Get dashboard statistics for the logged-in user
// @access  Private
router.get('/stats', protect, async (req, res) => {
  try {
    const totalScans = await Contract.countDocuments({ userId: req.user._id });
    const contracts = await Contract.find({ userId: req.user._id });
    
    let totalRisks = 0;
    contracts.forEach(c => {
      totalRisks += (c.high_risk_count || 0) + (c.warning_count || 0);
    });

    // Dynamic trust score based on safe vs total
    const safeCount = contracts.reduce((acc, c) => acc + (c.safe_count || 0), 0);
    const totalClauses = contracts.reduce((acc, c) => acc + (c.total_clauses || 0), 0);
    const trustScore = totalClauses > 0 
      ? `${Math.round((safeCount / totalClauses) * 100)}%` 
      : "0%";

    res.json({
      totalScans,
      totalRisks,
      termsLearned: totalRisks * 2,
      trustScore
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/analysis/recent
// @desc    Get recent activity for the logged-in user
// @access  Private
router.get('/recent', protect, async (req, res) => {
  try {
    const recent = await Contract.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5);
    res.json(recent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
