require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const User = require('../src/models/User.model');

const ADMIN_EMAIL = 'admin@studyquest.com';
const ADMIN_PASSWORD = 'admin@password123'; 

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });

    if (existingAdmin) {
      console.log('Admin already exists. Ensuring role is admin...');
      existingAdmin.role = 'admin';
      await existingAdmin.save();
      console.log('Admin role confirmed.');
    } else {
      console.log('Creating new Admin user...');
      await User.create({
        name: 'Super Admin',
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        role: 'admin',
        exam: 'BOTH',
        class: 'Dropper'
      });
      console.log('Admin user created successfully!');
    }

    console.log('-----------------------------------');
    console.log(`Email: ${ADMIN_EMAIL}`);
    console.log(`Password: ${ADMIN_PASSWORD}`);
    console.log('-----------------------------------');

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error seeding admin:', error);
    process.exit(1);
  }
};

seedAdmin();
