const router = require("express").Router();
const {register, login, auth, index, show, update, avatar, destroy } = require("../controllers/user.controllers");
const restrict = require('../middlewares/auth.middlewares')
const { imageKit } = require("../libs/multer")

// API Users
router.post("/users", register);
router.get("/users", index);
router.get("/users/:id",restrict, show);
router.put("/users/:id/profile",restrict, update);
router.put("/users/:id/avatar",restrict, imageKit.single('file'), avatar);
router.delete("/users/:id",restrict, destroy);

// API Auth
router.post("/auth/login", login);
router.get("/auth/authenticate", restrict, auth);

module.exports = router;