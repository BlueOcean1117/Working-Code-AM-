const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: process.env.MAIL_PORT,
  secure: false, // TLS
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
});

// verify once on server start
transporter.verify((err) => {
  if (err) console.error("❌ SMTP ERROR:", err);
  else console.log("✅ SMTP READY");
});

exports.sendTrackingMail = async (req, res) => {
  try {
    const {
      fromEmail,
      toEmail,
      subject,
      message,
      bl_no,
      container_no,
      etd,
      eta
    } = req.body;

    await transporter.sendMail({
      from: `"Logistics ERP" <${fromEmail}>`,
      to: toEmail,
      subject,
      html: `
        <h3>Shipment Tracking Details</h3>
        <table border="1" cellpadding="8">
          <tr><td><b>BL No</b></td><td>${bl_no}</td></tr>
          <tr><td><b>Container No</b></td><td>${container_no}</td></tr>
          <tr><td><b>ETD</b></td><td>${etd}</td></tr>
          <tr><td><b>ETA</b></td><td>${eta}</td></tr>
        </table>
        <p>${message}</p>
      `
    });

    res.json({ success: true });
  } catch (err) {
    console.error("MAIL ERROR:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};
