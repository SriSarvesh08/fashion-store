const mongoose = require('mongoose');
const Admin = require('./models/Admin');

const URI = 'mongodb+srv://user:uservinothini%40123@cluster0.xzfhxoi.mongodb.net/vinoz_fashion?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(URI)
  .then(async () => {
    console.log('✅ Connected to Production MongoDB');
    
    let admin = await Admin.findOne({ username: 'admin' });
    if (!admin) {
      console.log('⚠️ No admin found. Creating one now...');
      admin = new Admin({ 
        username: 'admin', 
        password: 'Vinothini@5', 
        email: 'vinozfasion@gmail.com' 
      });
      await admin.save();
      console.log('✅ Admin successfully created! You can now log in.');
    } else {
      console.log('🔄 Admin found. Force resetting password to Vinothini@5...');
      admin.password = 'Vinothini@5';
      await admin.save();
      console.log('✅ Admin password successfully reset! You can now log in.');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
  });
