const express = require('express');
const router = express.Router();
const User = require("./user.routes")

// API
router.use("/api/v1", User)

module.exports = router;