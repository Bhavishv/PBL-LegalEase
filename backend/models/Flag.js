const mongoose = require('mongoose');

const flagSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    contractId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contract'
    },
    title: String,
    reason: {
      type: String,
      default: "Reported as risky trend"
    }
  },
  {
    timestamps: true
  }
);

const Flag = mongoose.model('Flag', flagSchema);

module.exports = Flag;
