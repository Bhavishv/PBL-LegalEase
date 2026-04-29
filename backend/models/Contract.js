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
    clauses: [clauseSchema],
    entities: {
      party_a: String,
      party_b: String,
      effective_date: String,
      jurisdiction: String
    },
    financial_data: {
      total_value: String,
      currency: String,
      payment_terms: String
    },
    deadlines: [
      {
        title: String,
        date: String,
        description: String
      }
    ],
    jurisdiction_analysis: {
      location: String,
      is_favorable: Boolean,
      description: String
    },
    negotiation_playbook: String,
    signature_readiness: {
      has_signature_block: Boolean,
      is_signed_detected: Boolean,
      status: String
    }
  },
  {
    timestamps: true
  }
);

const Contract = mongoose.model('Contract', contractSchema);

module.exports = Contract;
