const checkUsersRouter = require('express').Router();
const User = require('../models/user');
const TokenCreation = require('../helpers/users');

checkUsersRouter.post('/', async (req, res) => {
  const { email, hashedPassword } = req.body;
  const mailPass = await User.findByEmailPassword(email);
  if (!mailPass) return res.status(401).send('email invalid');
  const verify = await User.verifyPassword(
    hashedPassword,
    mailPass.hashedPassword
  );

  if (mailPass && verify) {
    const token = await TokenCreation.calculateToken(
      mailPass.email,
      mailPass.id
    );
    console.log(token);
    User.update(mailPass.id, { token: token });
    return res.status(200).cookie('user_token', token).send('token created');
  } else return res.status(401).send('Invalid credentials');
});

module.exports = checkUsersRouter;

//
