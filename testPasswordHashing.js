const User = require('./models/user');

User.hashPassword('myPlainPassword').then((hashedPassword) => {
  console.log(hashedPassword);
});
