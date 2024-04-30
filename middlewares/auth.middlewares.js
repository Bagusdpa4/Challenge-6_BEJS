const jwt = require("jsonwebtoken");
let { JWT_SECRET_KEY } = process.env;

module.exports = async (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization || !authorization.split(" ")[1]){
    return res.status(403).json({
        status: false,
        message: 'token not provided!',
        data: null
    })
  }

  let token = authorization.split(" ")[1];
  jwt.verify(token, JWT_SECRET_KEY, (err, user) => {
    if (err) {
        return res.status(409).json({
            status: false,
            message: err.message,
            data: null
        })
    }
    delete user.iat;
    req.user = user
    next()
  })
};
