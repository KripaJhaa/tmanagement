const bcrypt = require('bcrypt');

const testAuth = async () => {
  const password = 'admin123';
  const hash = '$2b$10$mPxqbDfEVKLK1IeM1LYDSukNPM.7LcHoFRhU18QI3zTJdaG54cWNO';
  
  console.log('Testing password:', password);
  console.log('Against hash:', hash);
  
  const result = await bcrypt.compare(password, hash);
  console.log('Result:', result);
};

testAuth();