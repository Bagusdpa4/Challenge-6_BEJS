const multer = require("multer");

const generateFileFilter = (mimetypes, maxSize) => {
  return (req, file, callback) => {
    if (!mimetypes.includes(file.mimetype)) {
      const err = new Error(`Only ${mimetypes} are allowed to upload!`);
      err.status = 400;
      return callback(err, false);
    }

    const fileSize = parseInt(req.headers["content-length"]);
    const maxSizeInBytes = maxSize * 1024 * 1024;
    if (fileSize > maxSizeInBytes) {
      const err = new Error(`Maximum file size is ${maxSize} MB`);
      err.status = 400;
      return callback(err, false);
    }

    callback(null, true);
  };
};

module.exports = {
  imageKit: multer({
    fileFilter: generateFileFilter(["image/png", "image/jpg", "image/jpeg"], 1),
    onError: (err, next) => {
      next(err);
    },
  }),
};
