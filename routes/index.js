const express = require('express');
const router = express.Router();
const User = require("./user.routes")
const Image = require("./post.routes")

// API
router.use("/api/v1", User)
router.use("/api/v1", Image)

module.exports = router;