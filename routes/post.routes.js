const router = require("express").Router();
const {create, index, show, update, destroy } = require("../controllers/post.controllers");
const restrict = require('../middlewares/auth.middlewares')
const { image } = require("../libs/multer")

// API Image
router.post("/image",restrict, image.single('image'), create);
router.get("/image",restrict, index);
router.get("/image/:id",restrict, show);
router.put("/image/:id/",restrict, update);
router.delete("/image/:id",restrict, destroy);

module.exports = router;