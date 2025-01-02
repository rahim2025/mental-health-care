const mongoose = require("mongoose");
const User = require("./users");

const commentSchema = new mongoose.Schema({
  text: { type: String, required: true },
  parentPostId: {
    type: mongoose.Types.ObjectId,
    immutable: true,
    required: true,
  },
  authorId: {
    type: mongoose.Types.ObjectId,
    immutable: true,
    required: true,
    ref: User,
  },
});

module.exports = mongoose.model("comments", commentSchema);
