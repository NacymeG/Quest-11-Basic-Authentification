const jwt = require('jsonwebtoken');

const PRIVATE_KEY = process.env.PRIVATE_KEY;

const decode = (jwtToken) => {
  return jwt.decode(jwtToken);
};

const calculateToken = (userEmail, userID) => {
  return jwt.sign({ email: userEmail, user_id: userID }, PRIVATE_KEY);
};

module.exports = { calculateToken, decode };
