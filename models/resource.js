const mongoose = require("mongoose");
const User = require("./users");

const resourceSchema = new mongoose.Schema(
  {
    resourceContext: { type: String },
    resourceUrl: { type: String, required: true },
    sourceAdminId: {
      type: mongoose.Types.ObjectId,
      immutable: true,
      required: true,
      ref: User,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("resources", resourceSchema);
