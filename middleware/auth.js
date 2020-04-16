const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function (req, res, next) {
  //Get token from header
  const token = req.header('x-auth-token');

  //check if no token
  if (!token) {
    return res
      .status(401)
      .json({ msg: 'No token found, authorization denied' });
  }

  //verify token, decode it and assign it to user in req.
  try {
    const decoded = jwt.verify(token, config.get('jwtSecret'));
    req.user = decoded.user; //setting the request user as the decoded user
    next();
  } catch (err) {
    console.log(err.message);
    res.status(401).json({ msg: 'Token is not valid' });
  }
};
