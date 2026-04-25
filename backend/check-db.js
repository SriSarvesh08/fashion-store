const mongoose = require('mongoose');
const Product = require('./models/Product');
const Order = require('./models/Order');

const URI = 'mongodb+srv://user:uservinothini%40123@cluster0.xzfhxoi.mongodb.net/vinoz_fashion?retryWrites=true&w=majority&appName=Cluster0';

mongoose.connect(URI)
  .then(async () => {
    console.log('✅ Connected to MongoDB Atlas');
    const productCount = await Product.countDocuments();
    const orderCount = await Order.countDocuments();
    console.log(`📊 Number of Products in this database: ${productCount}`);
    console.log(`📊 Number of Orders in this database: ${orderCount}`);
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Connection error:', err);
    process.exit(1);
  });
