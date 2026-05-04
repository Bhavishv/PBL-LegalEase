const mongoose = require('mongoose');

const playbookSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true
    },
    category: String,
    industry: String,
    snippet: String,
    aiInsight: String,
    sourceContractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contract'
    }
  },
  {
    timestamps: true
  }
);

const Playbook = mongoose.model('Playbook', playbookSchema);

module.exports = Playbook;
