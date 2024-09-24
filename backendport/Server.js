const express = require('express');
const nodemailer = require('nodemailer');
const { MongoClient } = require('mongodb');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config(); // Load environment variables

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// MongoDB Connection
const uri = process.env.MONGODB_URI; // Use your MongoDB connection string
const client = new MongoClient(uri, { useUnifiedTopology: true });

let db, collection;

async function connectDB() {
  try {
    await client.connect();
    db = client.db('PortfolioAPI'); // Replace with your database name
    collection = db.collection('contactMessages'); // Replace with your collection name
    console.log('Connected to MongoDB');
  } catch (e) {
    console.error('Failed to connect to MongoDB', e);
    process.exit(1); // Exit the process if connection fails
  }
}

connectDB();

process.on('SIGINT', async () => {
  await client.close();
  console.log('MongoDB connection closed');
  process.exit(0);
});

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: 'Gmail',
  auth: {
    user: process.env.EMAIL_USER, // Your email address
    pass: process.env.EMAIL_PASS, // Your email password or app password
  },
});

// Endpoint to handle form submission
app.post('/api/contact', async (req, res) => {
  const { name, email, message } = req.body;

  try {
    // Send email
    await transporter.sendMail({
      from: email, // Your email address
      to: process.env.EMAIL_USER,   // Your email address
      subject: 'Contact Form Submission',
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
    });

    // Store in MongoDB
    await collection.insertOne({ name, email, message });

    res.status(200).json({ message: 'Form submitted successfully' });
  } catch (error) {
    console.error('Error handling form submission:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
