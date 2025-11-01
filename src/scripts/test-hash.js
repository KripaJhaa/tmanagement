const bcrypt = require('bcrypt');

const testHash = '$2b$10$mVVVtBkVIewrJiLWS1Cs.OaM.mfLVbmKxVqVLHTRVswGE3Bv0sBea';
const testPassword = 'admin123';

console.log('Testing bcrypt hash verification:');
console.log('Hash:', testHash);
console.log('Password:', testPassword);

bcrypt.compare(testPassword, testHash)
  .then(result => {
    console.log('Test comparison result:', result);
    console.log('Hash verification:', result ? 'SUCCESSFUL' : 'FAILED');
  })
  .catch(error => {
    console.error('Error testing hash:', error);
  });