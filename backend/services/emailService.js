// Email service:
//   - Resend → Admin OTP emails (only sends to your own email)
//   - Brevo  → Order emails (sends to any customer email, 300/day free)

const { Resend } = require('resend');

let resendClient = null;
function getResend() {
  if (!resendClient && process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}
// ─── Order Emails (Brevo HTTP primary, Gmail SMTP fallback for local) ────
const nodemailer = require('nodemailer');

// Brevo HTTP API (works on Render — no SMTP port needed)
async function sendViaBravo({ to, subject, html }) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) return false; // signal fallback
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender: { name: "Vino'z Fashion", email: process.env.ADMIN_EMAIL || 'vinozfasion@gmail.com' },
      to: [{ email: to }],
      subject,
      htmlContent: html
    })
  });
  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Brevo error (${response.status}): ${err}`);
  }
  return true;
}

// Gmail SMTP fallback (works locally, blocked on Render free tier)
let transporter = null;
function getTransporter() {
  if (!transporter && process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  }
  return transporter;
}

// Try Brevo first (production), fall back to Gmail SMTP (local dev)
async function sendOrderEmail({ to, subject, html }) {
  try {
    const sent = await sendViaBravo({ to, subject, html });
    if (sent) return;
  } catch (err) {
    console.error('Brevo failed, trying Gmail SMTP:', err.message);
  }
  // Fallback to Gmail SMTP
  const t = getTransporter();
  if (!t) {
    console.error('❌ No email provider configured — email not sent');
    return;
  }
  await t.sendMail({
    from: `"Vino'z Fashion" <${process.env.SMTP_USER}>`,
    to, subject, html
  });
}

// ─── Resend (OTP emails) ─────────────────────────────────────────────────
async function sendViaResend({ to, subject, html }) {
  const client = getResend();
  if (!client) {
    console.error('❌ RESEND_API_KEY not set — OTP email not sent');
    return;
  }
  const { error } = await client.emails.send({
    from: `Vino'z Fashion <onboarding@resend.dev>`,
    to, subject, html
  });
  if (error) throw new Error(error.message);
}

// ─── Templates ────────────────────────────────────────────────────────────
const formatAddress = (a) => `${a.street}, ${a.city}, ${a.state} - ${a.pincode}`;
const formatItems = (items) => items.map(item => {
  const v = [item.size, item.color].filter(Boolean).join(', ');
  return `<tr>
    <td style="padding:8px;border-bottom:1px solid #f0e6e6;">${item.name}${v ? ` (${v})` : ''}</td>
    <td style="padding:8px;border-bottom:1px solid #f0e6e6;text-align:center;">${item.quantity}</td>
    <td style="padding:8px;border-bottom:1px solid #f0e6e6;text-align:right;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
  </tr>`;
}).join('');

const wrap = (content) => `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#fdf6f6;font-family:Georgia,serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6f6;"><tr><td align="center" style="padding:20px;">
<table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.08);">
<tr><td style="background:linear-gradient(135deg,#c9748f,#e8a4b8);padding:30px;text-align:center;">
<h1 style="margin:0;color:#fff;font-size:28px;letter-spacing:2px;">Vino'z Fashion</h1>
<p style="margin:5px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">✨ Where Style Meets Elegance ✨</p>
</td></tr>
<tr><td style="padding:30px;">${content}</td></tr>
<tr><td style="background:#fdf6f6;padding:20px;text-align:center;border-top:1px solid #f0e6e6;">
<p style="margin:0;color:#999;font-size:12px;">© 2026 Vino'z Fashion. All rights reserved.</p>
</td></tr></table></td></tr></table></body></html>`;

// ─── OTP Email (via Resend — admin only) ──────────────────────────────────
const sendOtpEmail = async (toEmail, otpCode) => {
  const html = `<div style="font-family:Georgia,serif;max-width:500px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.08);">
    <div style="background:linear-gradient(135deg,#c9748f,#e8a4b8);padding:25px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:22px;letter-spacing:2px;">Vino'z Fashion</h1></div>
    <div style="padding:30px;">
      <h2 style="color:#c9748f;margin:0 0 5px;">🔐 Admin Login Verification</h2>
      <p style="color:#666;margin:0 0 25px;">Use the following OTP to complete your login:</p>
      <div style="background:linear-gradient(135deg,#fdf6f6,#fff0f5);border-radius:16px;padding:30px;margin-bottom:25px;text-align:center;border:2px solid #f0e6e6;">
        <p style="margin:0 0 8px;font-size:13px;color:#888;text-transform:uppercase;letter-spacing:2px;">Your OTP Code</p>
        <p style="margin:0;font-size:42px;font-weight:bold;color:#c9748f;letter-spacing:12px;font-family:monospace;">${otpCode}</p>
      </div>
      <div style="background:#fff8e1;border-left:4px solid #ffc107;border-radius:4px;padding:12px;">
        <p style="margin:0;color:#e65100;font-size:14px;">⏱️ <strong>This OTP expires in 30 seconds.</strong></p>
      </div>
    </div>
    <div style="background:#fdf6f6;padding:15px;text-align:center;border-top:1px solid #f0e6e6;">
      <p style="margin:0;color:#999;font-size:12px;">© 2026 Vino'z Fashion.</p></div></div>`;
  await sendViaResend({ to: toEmail, subject: `🔐 Your Admin Login OTP - Vino'z Fashion`, html });
};

// ─── Customer Order Email (via Brevo) ─────────────────────────────────────
const sendCustomerOrderEmail = async (order) => {
  if (!order.customer.email) return;
  const content = `
    <h2 style="color:#c9748f;margin:0 0 5px;">Order Confirmed! 🎉</h2>
    <p style="color:#666;margin:0 0 25px;">Thank you, <strong>${order.customer.name}</strong>!</p>
    <div style="background:#fdf6f6;border-radius:8px;padding:15px;margin-bottom:20px;">
      <p style="margin:0;font-size:13px;color:#888;">Order ID</p>
      <p style="margin:5px 0 0;font-size:20px;font-weight:bold;color:#c9748f;">#${order.orderId}</p></div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:20px;">
      <thead><tr style="background:#fdf6f6;">
        <th style="padding:8px;text-align:left;font-size:13px;color:#888;">Item</th>
        <th style="padding:8px;text-align:center;font-size:13px;color:#888;">Qty</th>
        <th style="padding:8px;text-align:right;font-size:13px;color:#888;">Amount</th></tr></thead>
      <tbody>${formatItems(order.items)}</tbody>
      <tfoot>
        ${order.pricing.discount > 0 ? `<tr><td colspan="2" style="padding:8px;color:#666;">Discount</td><td style="padding:8px;text-align:right;color:#22c55e;">-₹${order.pricing.discount.toLocaleString('en-IN')}</td></tr>` : ''}
        ${order.pricing.shipping > 0 ? `<tr><td colspan="2" style="padding:8px;color:#666;">Shipping</td><td style="padding:8px;text-align:right;">₹${order.pricing.shipping}</td></tr>` : '<tr><td colspan="2" style="padding:8px;color:#22c55e;">Shipping</td><td style="padding:8px;text-align:right;color:#22c55e;">FREE</td></tr>'}
        <tr style="background:#fdf6f6;"><td colspan="2" style="padding:10px 8px;font-weight:bold;">Total</td>
        <td style="padding:10px 8px;text-align:right;font-weight:bold;font-size:18px;color:#c9748f;">₹${order.pricing.total.toLocaleString('en-IN')}</td></tr>
      </tfoot></table>
    <div style="background:#fdf6f6;border-radius:8px;padding:15px;margin-bottom:20px;">
      <p style="margin:0;color:#555;"><strong>${order.customer.name}</strong></p>
      <p style="margin:5px 0;color:#555;">${formatAddress(order.customer.address)}</p>
      <p style="margin:5px 0;color:#555;">📱 ${order.customer.phone}</p></div>
    <div style="background:#fff8e1;border-left:4px solid #ffc107;border-radius:4px;padding:12px;">
      <p style="margin:0;color:#e65100;font-size:14px;">⏱️ <strong>Estimated Delivery:</strong> 3-5 business days</p>
      <p style="margin:5px 0 0;color:#666;font-size:13px;">Payment: ${order.payment.method === 'cod' ? 'Cash on Delivery' : 'Online Payment'} • ${order.payment.status === 'paid' ? '✅ Paid' : '⏳ Pending'}</p></div>`;
  try { await sendOrderEmail({ to: order.customer.email, subject: `Order Confirmed #${order.orderId} - Vino'z Fashion`, html: wrap(content) }); }
  catch (err) { console.error('Customer email failed:', err.message); }
};

// ─── Admin Order Notification (via Brevo) ─────────────────────────────────
const sendAdminOrderEmail = async (order) => {
  const content = `
    <h2 style="color:#c9748f;margin:0 0 5px;">🆕 New Order!</h2>
    <p style="color:#666;margin:0 0 20px;">Order <strong>#${order.orderId}</strong> — ₹${order.pricing.total.toLocaleString('en-IN')}</p>
    <div style="background:#fdf6f6;border-radius:8px;padding:15px;margin-bottom:15px;">
      <p style="margin:0;font-weight:bold;color:#444;">${order.customer.name} • ${order.customer.phone}</p>
      <p style="margin:5px 0 0;color:#555;font-size:14px;">${formatAddress(order.customer.address)}</p></div>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:15px;">
      <tbody>${formatItems(order.items)}</tbody></table>
    <p style="margin:0;font-weight:bold;color:#444;">💳 ${order.payment.method === 'cod' ? 'COD' : 'Online'} • ${order.payment.status === 'paid' ? '✅ Paid' : '⏳ Pending'}</p>`;
  try { await sendOrderEmail({ to: process.env.ADMIN_EMAIL, subject: `🛍️ New Order #${order.orderId} - ₹${order.pricing.total}`, html: wrap(content) }); }
  catch (err) { console.error('Admin email failed:', err.message); }
};

// ─── Status Update Email (via Brevo) ──────────────────────────────────────
const sendStatusUpdateEmail = async (order) => {
  if (!order.customer.email) return;
  const msgs = { confirmed: { e: '✅', t: 'confirmed and being prepared' }, packed: { e: '📦', t: 'packed and ready' }, dispatched: { e: '🚚', t: 'on its way' }, delivered: { e: '🎉', t: 'delivered! We hope you love it' } };
  const m = msgs[order.status] || { e: '📋', t: `updated to ${order.status}` };
  const content = `
    <h2 style="color:#c9748f;">${m.e} Order Status Update</h2>
    <p style="color:#666;">Hi <strong>${order.customer.name}</strong>, your order has been ${m.t}.</p>
    <div style="background:#fdf6f6;border-radius:8px;padding:15px;margin:20px 0;">
      <p style="margin:0;font-size:13px;color:#888;">Order ID</p>
      <p style="margin:5px 0 0;font-size:20px;font-weight:bold;color:#c9748f;">#${order.orderId}</p>
      <p style="margin:10px 0 0;font-size:15px;color:#444;">Status: <strong>${order.status.toUpperCase()}</strong></p></div>`;
  try { await sendOrderEmail({ to: order.customer.email, subject: `Order #${order.orderId} - ${order.status.charAt(0).toUpperCase() + order.status.slice(1)} | Vino'z Fashion`, html: wrap(content) }); }
  catch (err) { console.error('Status email failed:', err.message); }
};

module.exports = { sendOtpEmail, sendCustomerOrderEmail, sendAdminOrderEmail, sendStatusUpdateEmail };
