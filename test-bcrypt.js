const bcrypt = require('bcryptjs');

async function testBcrypt() {
  const password = 'admin123';
  const hashed = await bcrypt.hash(password, 10);
  console.log('Original password:', password);
  console.log('Hashed password:', hashed);
  console.log('Hashed length:', hashed.length);
  
  const match = await bcrypt.compare(password, hashed);
  console.log('Password match:', match);
}

testBcrypt();