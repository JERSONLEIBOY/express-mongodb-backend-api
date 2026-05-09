const mongoose = require('mongoose');

async function checkUsers() {
  try {
    await mongoose.connect('mongodb://mongodb:27017/ele_admin');
    console.log('Connected to MongoDB');
    
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log('Users found:', users.length);
    
    if (users.length > 0) {
      console.log('\nUser details:');
      users.forEach(user => {
        console.log(`Username: ${user.username}, Password length: ${user.password?.length || 0}`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkUsers();