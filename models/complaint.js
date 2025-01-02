const mongoose = require("mongoose");

const User = require("./users");
const Post = require("./post");
const Comment = require("./comment");
const Admin = require("./admin");

const complaintSchema = new mongoose.Schema({
  complaintText: { type: String, required: true },

  complainerId: {
    type: mongoose.Types.ObjectId,
    immutable: true,
    ref: User,
    required: true,
  },
  complaineeId: {
    type: mongoose.Types.ObjectId,
    immutable: true,
    ref: User,
    required: true,
  },

  source: {
    type: String,
    enum: ["post", "comment"],
    immutable: true,
    required: true,
  },
  sourcePostId: { type: mongoose.Types.ObjectId, immutable: true, ref: Post },
  sourceCommentId: {
    type: mongoose.Types.ObjectId,
    immutable: true,
    ref: Comment,
  },

  isReviewed: { type: Boolean, required: true, default: false },
  reviewerId: { type: mongoose.Types.ObjectId, ref: Admin },
  reviewResponse: { type: String },
  isValidComplaint: { type: Boolean },
});

module.exports = mongoose.model("complaints", complaintSchema);
