const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function main() {
  try {
    await mongoose.connect('mongodb://localhost:27017/ele_admin');
    console.log('Connected to MongoDB successfully!\n');
    
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    console.log(`=== Users Found: ${users.length} ===`);
    
    if (users.length === 0) {
      console.log('No users found in database.');
      console.log('\nCreating admin user...');
      
      const password = 'admin123';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await mongoose.connection.db.collection('users').insertOne({
        username: 'admin',
        nickname: 'Admin',
        password: hashedPassword,
        status: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('Admin user created successfully!');
      console.log('Username: admin');
      console.log('Password: admin123');
    } else {
      users.forEach((user, index) => {
        console.log(`\nUser ${index + 1}:`);
        console.log(`  ID: ${user._id}`);
        console.log(`  Username: ${user.username}`);
        console.log(`  Nickname: ${user.nickname || 'N/A'}`);
        console.log(`  Email: ${user.email || 'N/A'}`);
        console.log(`  Phone: ${user.phone || 'N/A'}`);
        console.log(`  Status: ${user.status === 0 ? 'Active' : 'Frozen'}`);
        console.log(`  Password: [Encrypted - ${user.password?.length || 0} characters]`);
      });
      
      console.log('\n=== Reset Password ===');
      const targetUsername = 'admin';
      const newPassword = 'admin123';
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      
      const result = await mongoose.connection.db.collection('users').updateOne(
        { username: targetUsername },
        { $set: { password: hashedPassword, updatedAt: new Date() } }
      );
      
      if (result.modifiedCount > 0) {
        console.log(`Password reset successfully for user: ${targetUsername}`);
        console.log(`New password: ${newPassword}`);
      } else {
        console.log(`User ${targetUsername} not found, skipping password reset.`);
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();