const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,   // 🔥 prevents duplicate email
    },

    matricNumber: {
      type: String,
      required: true,
      unique: true,   // 🔥 prevents duplicate matric number
    },

    password: {
      type: String,
      required: true,
    },

    department: String,
    level: String,
    hostel: String,
    room: String,
  },
  { timestamps: true }
);

// extra safety: compound uniqueness (email + matric combo)
userSchema.index({ email: 1, matricNumber: 1 }, { unique: true });

module.exports = mongoose.model("User", userSchema);