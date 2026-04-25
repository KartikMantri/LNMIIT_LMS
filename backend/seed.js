require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const User = require('./models/User');

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    const adminExists = await User.findOne({ userId: 'admin' });
    if (adminExists) {
      console.log('Admin already exists.');
      process.exit(0);
    }

    const admin = await User.create({
      name: 'System Admin',
      userId: 'admin',
      email: 'admin@lnmiit.ac.in',
      password: 'password123',
      role: 'admin'
    });

    console.log('Admin created:');
    console.log(`User ID: ${admin.userId}`);
    console.log(`Password: password123`);
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seedAdmin();
