const bcrypt = require('bcrypt');

// The password you want to use for admin access
const password = 'admin123';

// Generate hash with salt rounds of 10
bcrypt.hash(password, 10).then(hash => {
  console.log('Use this hash in your .env file:');
  console.log('ADMIN_PASSWORD_HASH=\'' + hash + '\'');
});