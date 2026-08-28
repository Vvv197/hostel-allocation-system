const mongoose = require("mongoose");

const academicSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },

    matric: {
        type: String,
        required: true
    },

    level: {
        type: String,
        required: true
    },

    department: {
        type: String,
        required: true
    },

    faculty: {
        type: String,
        required: true
    },

    session: {
        type: String,
        required: true
    },

    semester: {
        type: String,
        required: true
    },

    cgpa: {
        type: Number,
        required: true
    },

    status: {
        type: String,
        required: true
    },

    programme: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model("Academic", academicSchema);