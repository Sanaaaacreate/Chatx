const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(express.json({ limit: '50mb' })); // वीडियो और बड़ी फाइलों के लिए
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// MongoDB Atlas Connection (यहाँ अपना MongoDB URL डालें)
const MONGO_URI = process.env.MONGO_URI || 'YOUR_MONGODB_CONNECTION_STRING_HERE';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Chat Schema (डेटाबेस स्ट्रक्चर)
const messageSchema = new mongoose.Schema({
  sender: String,
  message: String,
  mediaUrl: String, // वीडियो या फोटो के लिए
  mediaType: String, // 'video', 'image', 'audio'
  deletedFor: { type: [String], default: [] }, // Soft delete के लिए
  timestamp: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

// 1. सभी मैसेज प्राप्त करें
app.get('/api/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. नया मैसेज भेजें (वीडियो/फोटो के साथ)
app.post('/api/messages', async (req, res) => {
  try {
    const { sender, message, mediaUrl, mediaType } = req.body;
    const newMessage = new Message({ sender, message, mediaUrl, mediaType });
    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. मैसेज को Soft Delete करें (स्क्रीन से हटेगा, डेटाबेस में रहेगा)
app.post('/api/messages/:id/delete', async (req, res) => {
  try {
    const { userId } = req.body;
    await Message.findByIdAndUpdate(req.id, {
      $push: { deletedFor: userId }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
