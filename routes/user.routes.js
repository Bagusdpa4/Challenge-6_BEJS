const router = require("express").Router();
const {store, index, show, update, avatar, destroy } = require("../controllers/user.controllers");
const { imageKit } = require("../libs/multer")

// API Users
router.post("/users", store);
router.get("/users", index);
router.get("/users/:id", show);
router.put("/users/:id/profile", update);
router.put("/users/:id/avatar", imageKit.single('file'), avatar);
router.delete("/users/:id", destroy);

module.exports = router;