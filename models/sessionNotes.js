const mongoose = require('mongoose');

const sessionNoteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  sessionDate: {
    type: Date,
    required: true,
  },
  notes: {
    type: String,
    required: true,
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('SessionNote', sessionNoteSchema);
