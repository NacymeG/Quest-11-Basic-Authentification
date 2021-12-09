const usersRouter = require('express').Router();
const User = require('../models/user');
const TokenCreation = require('../helpers/users');

usersRouter.get('/', (req, res) => {
  const { language } = req.query;
  User.findMany({ filters: { language } })
    .then((results) => {
      res.json(results);
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error retrieving users from database');
    });
});

usersRouter.get('/:id', (req, res) => {
  User.findOne(req.params.id)
    .then((user) => {
      if (user) res.json(user);
      else res.status(404).send('User not found');
    })
    .catch((err) => {
      console.error(err);
      res.status(500).send('Error retrieving user from database');
    });
});

usersRouter.post('/', (req, res) => {
  const { email, hashedPassword } = req.body;
  let validationErrors = null;

  User.findByEmail(email)
    .then((existingUserWithEmail) => {
      if (existingUserWithEmail) return Promise.reject('DUPLICATE_EMAIL');
      validationErrors = User.validate(req.body);
      if (validationErrors) {
        return Promise.reject('INVALID_DATA');
      }
      User.hashPassword(hashedPassword).then((hashedPassword) => {
        req.body.hashedPassword = hashedPassword;
        console.log(req.body);
        return User.create(req.body);
      });
    })
    .then((createdUser) => {
      res.status(201).json(createdUser);
    })
    .catch((err) => {
      console.error(err);
      if (err === 'DUPLICATE_EMAIL')
        res.status(409).json({ message: 'This email is already used' });
      else if (err === 'INVALID_DATA')
        res.status(422).json({ validationErrors });
      else res.status(500).send('Error saving the user');
    });
});

usersRouter.put('/:id', async (req, res) => {
  let validationErrors = null;

  const findOne = await User.findOne(req.params.id);
  const findByEmailWithDifferentId = await User.findByEmailWithDifferentId(
    req.body.email,
    req.params.id
  );

  if (!findOne)
    return res.status(404).send(`User with id ${userId} not found.`);
  if (findByEmailWithDifferentId)
    return res.status(409).json({ message: 'This email is already used' });
  validationErrors = User.validate(req.body, false);
  if (validationErrors) return res.status(422).json({ validationErrors });
  const token = await TokenCreation.calculateToken(findOne.email);
  req.body.token = token;
  console.log('mon token', token);
  console.log('mon body', req.body);
  await User.update(req.params.id, req.body);
  return res.status(200).json({ ...findOne, ...req.body });
});

usersRouter.delete('/:id', (req, res) => {
  User.destroy(req.params.id)
    .then((deleted) => {
      if (deleted) res.status(200).send('🎉 User deleted!');
      else res.status(404).send('User not found');
    })
    .catch((err) => {
      console.log(err);
      res.status(500).send('Error deleting a user');
    });
});

module.exports = usersRouter;
