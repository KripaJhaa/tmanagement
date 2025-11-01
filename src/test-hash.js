require('dotenv').config();
const bcrypt = require('bcrypt');

async function testHash() {
  const password = 'admin123';
  const storedHash = process.env.ADMIN_PASSWORD_HASH;
  
  console.log('Testing password authentication:');
  console.log('Raw password:', password);
  console.log('Environment variables:');
  console.log('ADMIN_PASSWORD_HASH length:', storedHash ? storedHash.length : 0);
  console.log('ADMIN_PASSWORD_HASH value:', storedHash);
  
  if (storedHash) {
    try {
      const isMatch = await bcrypt.compare(password, storedHash);
      console.log('Password match result:', isMatch);
    } catch (error) {
      console.error('Error comparing password:', error.message);
    }
  } else {
    console.error('ADMIN_PASSWORD_HASH is not set in environment');
  }
}

testHash();