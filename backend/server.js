const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(express.json());

const DATA_DIR = path.join(__dirname, 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const ITEMS_FILE = path.join(DATA_DIR, 'items.json');
const INVITES_FILE = path.join(DATA_DIR, 'invites.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { 
    user: 'chinmayamissionwishlist@gmail.com', 
    pass: 'wvsapqbkmwkcuhlx' 
  }
});

function readData(file) {
    if (!fs.existsSync(file)) return [];
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { return []; }
}
function writeData(file, data) { fs.writeFileSync(file, JSON.stringify(data, null, 2)); }

app.post('/signup', async (req, res) => {
    const { name, email, password, inviteToken } = req.body;
    let users = readData(USERS_FILE);
    let invites = readData(INVITES_FILE);
    
    // ASHWIN IS ALWAYS ADMIN
    let role = (email.toLowerCase() === 'ashwinsince2013@gmail.com') ? 'admin' : 'donor';
    
    if (inviteToken && invites.includes(inviteToken)) {
        role = 'admin';
        writeData(INVITES_FILE, invites.filter(t => t !== inviteToken));
    }

    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    users.push({ name, email, password, role, verified: false, verificationCode });
    writeData(USERS_FILE, users);

    transporter.sendMail({
        from: '"CMA Wishlist" <chinmayamissionwishlist@gmail.com>',
        to: email,
        subject: 'Welcome to CMA Wish-list',
        text: `Hari Om ${name}! Your CMA verification code is: ${verificationCode}`
    });
    res.json({ success: true });
});

app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = readData(USERS_FILE).find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
    if (user) {
        // Ashwin bypasses verification for testing
        if (!user.verified && user.email.toLowerCase() !== 'ashwinsince2013@gmail.com') {
            return res.status(401).json({ error: "Please verify your email first!" });
        }
        res.json(user);
    } else res.status(401).json({ error: "Invalid email or password" });
});

app.post('/verify', (req, res) => {
    const { email, code } = req.body;
    let users = readData(USERS_FILE);
    const idx = users.findIndex(u => u.email.toLowerCase() === email.toLowerCase() && u.verificationCode === code);
    if (idx !== -1) { 
        users[idx].verified = true; 
        writeData(USERS_FILE, users); 
        res.json({ success: true, user: users[idx] }); 
    } else res.status(400).json({ error: "Invalid code" });
});

app.put('/donate/:id', (req, res) => {
    const { amount, donorName, donorPhone, selectedTime } = req.body;
    let items = readData(ITEMS_FILE);
    const idx = items.findIndex(i => i._id === req.params.id);
    if (idx !== -1) {
        items[idx].donated = (items[idx].donated || 0) + parseFloat(amount);
        if(!items[idx].donationsLog) items[idx].donationsLog = [];
        items[idx].donationsLog.push({ donorName, donorPhone, amount, selectedTime, date: new Date() });
        writeData(ITEMS_FILE, items);
        
        transporter.sendMail({
            from: '"CMA Wishlist" <chinmayamissionwishlist@gmail.com>',
            to: 'ashwinsince2013@gmail.com',
            subject: `🎁 New Donation: ${items[idx].name}`,
            text: `Hari Om Ashwin! ${donorName} donated ${amount}x ${items[idx].name}. Phone: ${donorPhone}`
        });
        res.json(items[idx]);
    }
});

app.post('/generate-invite', (req, res) => {
    const { vpEmail } = req.body;
    const token = Math.random().toString(36).substring(7);
    let invites = readData(INVITES_FILE);
    invites.push(token);
    writeData(INVITES_FILE, invites);
    
    transporter.sendMail({
        from: '"CMA Wishlist" <chinmayamissionwishlist@gmail.com>',
        to: vpEmail,
        subject: '👑 CMA Admin Invitation',
        text: `Hari Om! Ashwin has invited you as an Admin. Join here: http://localhost:3000?invite=${token}`
    });
    res.json({ success: true });
});

app.get('/items', (req, res) => res.json(readData(ITEMS_FILE)));
app.post('/items', (req, res) => {
    let items = readData(ITEMS_FILE);
    const newItem = { ...req.body, _id: Date.now().toString(), donated: 0, donationsLog: [] };
    items.push(newItem);
    writeData(ITEMS_FILE, items);
    res.json(newItem);
});
app.delete('/items/:id', (req, res) => {
    writeData(ITEMS_FILE, readData(ITEMS_FILE).filter(i => i._id !== req.params.id));
    res.json({ success: true });
});

app.listen(5001, () => console.log(`🚀 CMA BRAIN ACTIVE`));