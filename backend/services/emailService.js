// Email service using Brevo HTTP API for ORDER emails
// OTP emails are handled separately via Resend in admin.js
// Free: 300 emails/day, no domain verification, sends to any address

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

async function sendEmail({ to, subject, html }) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error('❌ BREVO_API_KEY not set — email not sent');
    return;
  }

  const response = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      sender: { name: "Vino'z Fashion", email: process.env.ADMIN_EMAIL || 'vinozfasion@gmail.com' },
      to: [{ email: to }],
      subject,
      htmlContent: html
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Brevo API error (${response.status}): ${err}`);
  }

  return response.json();
}

const formatAddress = (address) =>
  `${address.street}, ${address.city}, ${address.state} - ${address.pincode}`;

const formatItems = (items) =>
  items.map(item => {
    const variants = [item.size, item.color].filter(Boolean).join(', ');
    const variantText = variants ? ` (${variants})` : '';
    return `<tr>
      <td style="padding:8px;border-bottom:1px solid #f0e6e6;">${item.name}${variantText}</td>
      <td style="padding:8px;border-bottom:1px solid #f0e6e6;text-align:center;">${item.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #f0e6e6;text-align:right;">₹${(item.price * item.quantity).toLocaleString('en-IN')}</td>
    </tr>`;
  }).join('');

const baseEmailTemplate = (content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vino'z Fashion</title>
</head>
<body style="margin:0;padding:0;background:#fdf6f6;font-family:'Georgia',serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#fdf6f6;">
    <tr><td align="center" style="padding:20px;">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 20px rgba(0,0,0,0.08);">
        
        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#c9748f,#e8a4b8);padding:30px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:28px;letter-spacing:2px;">Vino'z Fashion</h1>
            <p style="margin:5px 0 0;color:rgba(255,255,255,0.9);font-size:14px;">✨ Where Style Meets Elegance ✨</p>
          </td>
        </tr>
        
        <!-- Content -->
        <tr><td style="padding:30px;">
          ${content}
        </td></tr>
        
        <!-- Footer -->
        <tr>
          <td style="background:#fdf6f6;padding:20px;text-align:center;border-top:1px solid #f0e6e6;">
            <p style="margin:0;color:#999;font-size:12px;">© 2026 Vino'z Fashion. All rights reserved.</p>
            <p style="margin:5px 0 0;color:#999;font-size:12px;">For support: ${process.env.ADMIN_EMAIL || 'vinozfasion@gmail.com'}</p>
          </td>
        </tr>
        
      </table>
    </td></tr>
  </table>
</body>
</html>`;

// ─── Send Customer Confirmation Email ─────────────────────────────────────
const sendCustomerOrderEmail = async (order) => {
  if (!order.customer.email) return;

  const content = `
    <h2 style="color:#c9748f;margin:0 0 5px;">Order Confirmed! 🎉</h2>
    <p style="color:#666;margin:0 0 25px;">Thank you for shopping with us, <strong>${order.customer.name}</strong>!</p>
    
    <div style="background:#fdf6f6;border-radius:8px;padding:15px;margin-bottom:20px;">
      <p style="margin:0;font-size:13px;color:#888;">Order ID</p>
      <p style="margin:5px 0 0;font-size:20px;font-weight:bold;color:#c9748f;">#${order.orderId}</p>
    </div>
    
    <h3 style="color:#444;margin:0 0 15px;">Your Items</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:20px;">
      <thead>
        <tr style="background:#fdf6f6;">
          <th style="padding:8px;text-align:left;font-size:13px;color:#888;">Item</th>
          <th style="padding:8px;text-align:center;font-size:13px;color:#888;">Qty</th>
          <th style="padding:8px;text-align:right;font-size:13px;color:#888;">Amount</th>
        </tr>
      </thead>
      <tbody>
        ${formatItems(order.items)}
      </tbody>
      <tfoot>
        ${order.pricing.discount > 0 ? `<tr><td colspan="2" style="padding:8px;color:#666;">Discount</td><td style="padding:8px;text-align:right;color:#22c55e;">-₹${order.pricing.discount.toLocaleString('en-IN')}</td></tr>` : ''}
        ${order.pricing.shipping > 0 ? `<tr><td colspan="2" style="padding:8px;color:#666;">Shipping</td><td style="padding:8px;text-align:right;">₹${order.pricing.shipping}</td></tr>` : '<tr><td colspan="2" style="padding:8px;color:#22c55e;">Shipping</td><td style="padding:8px;text-align:right;color:#22c55e;">FREE</td></tr>'}
        <tr style="background:#fdf6f6;">
          <td colspan="2" style="padding:10px 8px;font-weight:bold;color:#444;">Total</td>
          <td style="padding:10px 8px;text-align:right;font-weight:bold;font-size:18px;color:#c9748f;">₹${order.pricing.total.toLocaleString('en-IN')}</td>
        </tr>
      </tfoot>
    </table>
    
    <h3 style="color:#444;margin:0 0 10px;">Delivery Details</h3>
    <div style="background:#fdf6f6;border-radius:8px;padding:15px;margin-bottom:20px;">
      <p style="margin:0;color:#555;"><strong>${order.customer.name}</strong></p>
      <p style="margin:5px 0;color:#555;">${formatAddress(order.customer.address)}</p>
      <p style="margin:5px 0;color:#555;">📱 ${order.customer.phone}</p>
    </div>
    
    <div style="background:#fff8e1;border-left:4px solid #ffc107;border-radius:4px;padding:12px;margin-bottom:20px;">
      <p style="margin:0;color:#e65100;font-size:14px;">⏱️ <strong>Estimated Delivery:</strong> 3-5 business days</p>
      <p style="margin:5px 0 0;color:#666;font-size:13px;">Payment Method: ${order.payment.method === 'cod' ? 'Cash on Delivery' : 'Online Payment'} • Status: ${order.payment.status === 'paid' ? '✅ Paid' : '⏳ Pending'}</p>
    </div>
    
    <p style="color:#888;font-size:13px;">Have questions? Reply to this email or WhatsApp us. We're here to help! 💕</p>
  `;

  try {
    await sendEmail({
      to: order.customer.email,
      subject: `✅ Order Confirmed #${order.orderId} - Vino'z Fashion`,
      html: baseEmailTemplate(content)
    });
  } catch (err) {
    console.error('Customer email failed:', err.message);
  }
};

// ─── Send Admin Notification Email ────────────────────────────────────────
const sendAdminOrderEmail = async (order) => {
  const content = `
    <h2 style="color:#c9748f;margin:0 0 5px;">🆕 New Order Received!</h2>
    <p style="color:#666;margin:0 0 25px;">Order <strong>#${order.orderId}</strong> has been placed.</p>
    
    <div style="display:flex;gap:15px;margin-bottom:20px;">
      <div style="flex:1;background:#fdf6f6;border-radius:8px;padding:15px;">
        <p style="margin:0;font-size:12px;color:#888;text-transform:uppercase;">Customer</p>
        <p style="margin:5px 0 0;font-weight:bold;color:#444;">${order.customer.name}</p>
        <p style="margin:3px 0;color:#555;font-size:14px;">${order.customer.phone}</p>
        ${order.customer.email ? `<p style="margin:3px 0;color:#555;font-size:14px;">${order.customer.email}</p>` : ''}
      </div>
    </div>
    
    <h3 style="color:#444;margin:0 0 10px;">Delivery Address</h3>
    <p style="color:#555;margin:0 0 20px;">${formatAddress(order.customer.address)}</p>
    
    <h3 style="color:#444;margin:0 0 15px;">Items Ordered</h3>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin-bottom:20px;">
      <thead>
        <tr style="background:#fdf6f6;">
          <th style="padding:8px;text-align:left;font-size:13px;color:#888;">Item</th>
          <th style="padding:8px;text-align:center;font-size:13px;color:#888;">Qty</th>
          <th style="padding:8px;text-align:right;font-size:13px;color:#888;">Amount</th>
        </tr>
      </thead>
      <tbody>${formatItems(order.items)}</tbody>
      <tfoot>
        <tr style="background:#fdf6f6;">
          <td colspan="2" style="padding:10px 8px;font-weight:bold;">Total</td>
          <td style="padding:10px 8px;text-align:right;font-weight:bold;color:#c9748f;">₹${order.pricing.total.toLocaleString('en-IN')}</td>
        </tr>
      </tfoot>
    </table>
    
    <div style="background:${order.payment.method === 'cod' ? '#fff8e1' : '#f0fdf4'};border-radius:8px;padding:15px;">
      <p style="margin:0;font-weight:bold;color:#444;">
        💳 Payment: ${order.payment.method === 'cod' ? '🏠 Cash on Delivery' : '💳 Online Payment'}
        • Status: ${order.payment.status === 'paid' ? '✅ Paid' : '⏳ Pending'}
      </p>
    </div>
  `;

  try {
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `🛍️ New Order #${order.orderId} - ₹${order.pricing.total} (${order.payment.method.toUpperCase()})`,
      html: baseEmailTemplate(content)
    });
  } catch (err) {
    console.error('Admin email failed:', err.message);
  }
};

// ─── Order Status Update Email ────────────────────────────────────────────
const sendStatusUpdateEmail = async (order) => {
  if (!order.customer.email) return;

  const statusMessages = {
    confirmed: { emoji: '✅', text: 'Your order has been confirmed and is being prepared.' },
    processing: { emoji: '🔧', text: 'Your order is being processed and packed with care.' },
    shipped: { emoji: '🚚', text: 'Your order is on its way!' },
    'out-for-delivery': { emoji: '📦', text: 'Your order is out for delivery today!' },
    delivered: { emoji: '🎉', text: "Your order has been delivered! We hope you love it!" },
    cancelled: { emoji: '❌', text: 'Your order has been cancelled.' }
  };

  const msg = statusMessages[order.status] || { emoji: '📋', text: `Order status updated to: ${order.status}` };

  const content = `
    <h2 style="color:#c9748f;">${msg.emoji} Order Status Update</h2>
    <p style="color:#666;">Hi <strong>${order.customer.name}</strong>, ${msg.text}</p>
    <div style="background:#fdf6f6;border-radius:8px;padding:15px;margin:20px 0;">
      <p style="margin:0;font-size:13px;color:#888;">Order ID</p>
      <p style="margin:5px 0 0;font-size:20px;font-weight:bold;color:#c9748f;">#${order.orderId}</p>
      <p style="margin:10px 0 0;font-size:15px;color:#444;">Status: <strong>${order.status.toUpperCase()}</strong></p>
      ${order.tracking?.trackingNumber ? `<p style="margin:5px 0 0;color:#555;">Tracking: <a href="${order.tracking.trackingUrl || '#'}" style="color:#c9748f;">${order.tracking.trackingNumber}</a></p>` : ''}
    </div>
  `;

  try {
    await sendEmail({
      to: order.customer.email,
      subject: `${msg.emoji} Order #${order.orderId} - ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`,
      html: baseEmailTemplate(content)
    });
  } catch (err) {
    console.error('Status update email failed:', err.message);
  }
};

module.exports = {
  sendCustomerOrderEmail,
  sendAdminOrderEmail,
  sendStatusUpdateEmail
};
