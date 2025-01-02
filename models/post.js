const mongoose = require("mongoose");
const User = require("./users");

const postSchema = new mongoose.Schema(
  {
    text: {
      type: String,
    },

    images: {
      type: [String],
      default: [],
    },
    authorId: {
      type: mongoose.Types.ObjectId,
      required: true,
      ref: User,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("posts", postSchema);
