const express = require('express');
const router = express.Router();
const swaggerUI = require("swagger-ui-express");
const YAML = require("yaml");
const fs = require("fs");
const path = require("path");

const User = require("./user.routes")
const Image = require("./post.routes")

const swagger_path = path.resolve(__dirname, "../docs/api-docs.yaml");
const file = fs.readFileSync(swagger_path, "utf-8");

// API Docs
const swaggerDocument = YAML.parse(file);
router.use("/api-docs", swaggerUI.serve, swaggerUI.setup(swaggerDocument));

// API
router.use("/api/v1", User)
router.use("/api/v1", Image)

module.exports = router;