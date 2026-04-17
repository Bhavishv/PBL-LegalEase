const mongoose = require('mongoose');

const clauseSchema = mongoose.Schema({
  text: String,
  risk_level: String,
  confidence: Number,
  explanation: String,
  suggested_redline: String,
  negotiation_advice: String
});

const contractSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false // Optional for now
    },
    filename: {
      type: String,
      required: true
    },
    overall_score: Number,
    risk_label: String,
    risk_colour: String,
    total_clauses: Number,
    high_risk_count: Number,
    warning_count: Number,
    safe_count: Number,
    clauses: [clauseSchema]
  },
  {
    timestamps: true
  }
);

const Contract = mongoose.model('Contract', contractSchema);

module.exports = Contract;
