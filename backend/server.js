const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(bodyParser.json());

// --- 1. EMAIL SETUP ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'chinmayamissionwishlist@gmail.com',
    pass: 'fvgrkqgjdppxxynu'
  }
});

// --- 2. DATABASE (In-Memory) ---
let users = [];
let verificationCodes = {};
let wishlistItems = []; // Stores the items/groceries

// --- 3. HELPER FUNCTIONS ---

// Send Verification Code
const sendVerifyEmail = async (email, code) => {
  try {
    await transporter.sendMail({
      from: '"Wishlist Admin" <chinmayamissionwishlist@gmail.com>',
      to: email,
      subject: 'Verify Your Account',
      html: `<h2>Verification Code:</h2><h1 style="color:#007bff">${code}</h1>`
    });
    return true;
  } catch (err) { return false; }
};

// ALERT ALL ADMINS (When a donation happens)
const notifyAdmins = async (donationDetails) => {
  // Find all admins
  const admins = users.filter(u => u.role === 'admin');
  const adminEmails = admins.map(a => a.email);

  if (adminEmails.length === 0) return;

  const mailOptions = {
    from: '"Wishlist System" <chinmayamissionwishlist@gmail.com>',
    to: adminEmails, // Sends to ALL admins
    subject: `🚨 New Donation: ${donationDetails.itemName}`,
    html: `
      <div style="font-family: Arial; border: 1px solid #ddd; padding: 20px;">
        <h2 style="color: green;">New Donation Pledge!</h2>
        <p><strong>Donor:</strong> ${donationDetails.donorName} (${donationDetails.donorEmail})</p>
        <hr/>
        <h3>Item Details:</h3>
        <p><strong>Item:</strong> ${donationDetails.itemName}</p>
        <p><strong>Quantity Donating:</strong> ${donationDetails.quantity}</p>
        <p><strong>Drop-off Location:</strong> ${donationDetails.location}</p>
        <h3 style="background: #eee; padding: 5px;">Drop-off Time: ${donationDetails.dropTime}</h3>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("✅ Admins notified of donation.");
  } catch (err) {
    console.error("❌ Failed to notify admins:", err);
  }
};

// --- ROUTES: AUTH ---

app.post('/api/signup', async (req, res) => {
  const { name, email, password } = req.body;
  const existingUser = users.find(u => u.email === email);
  if (existingUser && existingUser.isVerified) return res.status(400).json({ success: false, message: "User exists." });

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes[email] = code;
  
  // GOD MODE CHECK
  const role = (email.toLowerCase() === 'ashwinsince2013@gmail.com') ? 'admin' : 'donor';

  if (existingUser) {
    existingUser.name = name; existingUser.password = password; existingUser.role = role;
  } else {
    users.push({ name, email, password, role, isVerified: false, joinedAt: new Date() });
  }

  await sendVerifyEmail(email, code);
  res.json({ success: true });
});

app.post('/api/verify', (req, res) => {
  const { email, code } = req.body;
  if (verificationCodes[email] === code) {
    const user = users.find(u => u.email === email);
    if (user) user.isVerified = true;
    res.json({ success: true, user });
  } else {
    res.status(400).json({ success: false, message: "Invalid Code" });
  }
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);
  if (!user || !user.isVerified) return res.status(401).json({ success: false, message: "Invalid or Unverified." });
  res.json({ success: true, user });
});

app.post('/api/resend', async (req, res) => {
  const { email } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  verificationCodes[email] = code;
  await sendVerifyEmail(email, code);
  res.json({ success: true });
});

// --- ROUTES: WISHLIST (New Stuff) ---

// 1. Get All Items
app.get('/api/items', (req, res) => {
  res.json({ success: true, items: wishlistItems });
});

// 2. Add Item (Admin Only)
app.post('/api/items/add', (req, res) => {
  const newItem = { id: Date.now(), ...req.body, collected: 0 };
  wishlistItems.push(newItem);
  res.json({ success: true, items: wishlistItems });
});

// 3. Donate (Updates Quantity & Notifies Admins)
app.post('/api/donate', async (req, res) => {
  const { itemId, donorEmail, quantity, dropTime } = req.body;
  
  const item = wishlistItems.find(i => i.id === itemId);
  const donor = users.find(u => u.email === donorEmail);

  if (!item || !donor) return res.status(400).json({ success: false });

  // Update Item Stats
  item.collected = parseInt(item.collected) + parseInt(quantity);
  
  // Notify Admins
  await notifyAdmins({
    donorName: donor.name,
    donorEmail: donor.email,
    itemName: item.name,
    quantity: quantity,
    location: item.location,
    dropTime: dropTime
  });

  res.json({ success: true, items: wishlistItems });
});

app.get('/api/contacts', (req, res) => {
  const { adminEmail } = req.query;
  if (adminEmail.toLowerCase() !== 'ashwinsince2013@gmail.com') return res.status(403).json({ success: false });
  res.json({ success: true, contacts: users });
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));