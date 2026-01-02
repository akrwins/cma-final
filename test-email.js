const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'chinmayamissionwishlist@gmail.com',
    pass: 'fvgrkqgjdppxxynu' // Spaces removed
  }
});

async function main() {
  try {
    const info = await transporter.sendMail({
      from: '"Admin App" <chinmayamissionwishlist@gmail.com>',
      to: 'chinmayamissionwishlist@gmail.com', // Sending to yourself to test
      subject: 'Admin Verification Code', 
      text: 'Your code is: 998877', 
      html: '<b>Your code is: 998877</b>', 
    });

    console.log("✅ SUCCESS! Message sent: %s", info.messageId);
  } catch (error) {
    console.error("❌ ERROR:", error);
  }
}

main();