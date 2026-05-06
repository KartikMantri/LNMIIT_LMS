const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,// tells mongodb to use its newest and stable internal engines
      useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected: ${conn.connection.host}`);

  } catch (error) {

    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;//What it does: 
// This exports the connectDB function so that it can be imported 
// and executed inside your main server.js file when the
//  application first starts up.
