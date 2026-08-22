const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Verify connection on startup
transporter.verify()
  .then(() => console.log('✅ SMTP email transporter connected'))
  .catch(err => console.error('❌ SMTP connection error:', err.message));

function formatRupees(amount) {
  return '₹' + Number(amount).toLocaleString('en-IN');
}

function baseEmailTemplate(content) {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f7f3f0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background-color:#ffffff;">
  <!-- Header -->
  <tr>
    <td style="background:linear-gradient(135deg,#c9748f,#e8a4b8);padding:30px 20px;text-align:center;">
      <h1 style="margin:0;font-size:28px;color:#ffffff;font-weight:700;letter-spacing:1px;">Vino'z Fashion</h1>
      <p style="margin:6px 0 0;font-size:13px;color:#fff5f7;letter-spacing:2px;">Where Style Meets Elegance</p>
    </td>
  </tr>
  <!-- Content -->
  <tr>
    <td style="padding:30px 25px;">
      ${content}
    </td>
  </tr>
  <!-- Footer -->
  <tr>
    <td style="background-color:#fdf2f5;padding:20px 25px;text-align:center;border-top:1px solid #f0d6de;">
      <p style="margin:0;font-size:12px;color:#999;">© ${new Date().getFullYear()} Vino'z Fashion. All rights reserved.</p>
      <p style="margin:6px 0 0;font-size:12px;color:#999;">Support: <a href="mailto:${process.env.SMTP_USER}" style="color:#c9748f;">${process.env.SMTP_USER}</a></p>
    </td>
  </tr>
</table>
</body>
</html>`;
}

function buildItemsTable(items) {
  let rows = '';
  const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
  for (const item of parsedItems) {
    const details = [];
    if (item.color) details.push(`Color: ${item.color}`);
    if (item.size) details.push(`Size: ${item.size}`);
    const detailLine = details.length > 0
      ? `<br/><span style="font-size:12px;color:#888;">${details.join(' &bull; ')}</span>`
      : '';
    rows += `
    <tr>
      <td style="padding:8px 10px;border-bottom:1px solid #f0e8eb;font-size:14px;color:#333;">${item.name || 'Product'}${detailLine}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f0e8eb;font-size:14px;color:#333;text-align:center;">${item.quantity}</td>
      <td style="padding:8px 10px;border-bottom:1px solid #f0e8eb;font-size:14px;color:#333;text-align:right;">${formatRupees(item.price * item.quantity)}</td>
    </tr>`;
  }
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:15px 0;">
    <tr style="background-color:#fdf2f5;">
      <th style="padding:10px;text-align:left;font-size:13px;color:#c9748f;font-weight:600;">Item</th>
      <th style="padding:10px;text-align:center;font-size:13px;color:#c9748f;font-weight:600;">Qty</th>
      <th style="padding:10px;text-align:right;font-size:13px;color:#c9748f;font-weight:600;">Amount</th>
    </tr>
    ${rows}
  </table>`;
}

function buildAdminDetailedTable(items) {
  let rows = '';
  const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;
  for (const item of parsedItems) {
    rows += `
    <tr>
      <td style="padding:10px;border-bottom:1px solid #f0e8eb;font-size:14px;color:#333;font-weight:600;">${item.name || 'Product'}</td>
      <td style="padding:10px;border-bottom:1px solid #f0e8eb;font-size:13px;color:#555;text-align:center;">${item.color || '—'}</td>
      <td style="padding:10px;border-bottom:1px solid #f0e8eb;font-size:13px;color:#555;text-align:center;">${item.size || '—'}</td>
      <td style="padding:10px;border-bottom:1px solid #f0e8eb;font-size:14px;color:#333;text-align:center;">${item.quantity}</td>
      <td style="padding:10px;border-bottom:1px solid #f0e8eb;font-size:13px;color:#666;text-align:right;">${formatRupees(item.price)}</td>
      <td style="padding:10px;border-bottom:1px solid #f0e8eb;font-size:14px;color:#333;font-weight:600;text-align:right;">${formatRupees(item.price * item.quantity)}</td>
    </tr>`;
  }
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:15px 0;border:1px solid #f0e8eb;border-radius:8px;overflow:hidden;">
    <tr style="background-color:#fdf2f5;">
      <th style="padding:10px;text-align:left;font-size:12px;color:#c9748f;font-weight:700;text-transform:uppercase;">Product</th>
      <th style="padding:10px;text-align:center;font-size:12px;color:#c9748f;font-weight:700;text-transform:uppercase;">Color</th>
      <th style="padding:10px;text-align:center;font-size:12px;color:#c9748f;font-weight:700;text-transform:uppercase;">Size</th>
      <th style="padding:10px;text-align:center;font-size:12px;color:#c9748f;font-weight:700;text-transform:uppercase;">Qty</th>
      <th style="padding:10px;text-align:right;font-size:12px;color:#c9748f;font-weight:700;text-transform:uppercase;">Unit Price</th>
      <th style="padding:10px;text-align:right;font-size:12px;color:#c9748f;font-weight:700;text-transform:uppercase;">Total</th>
    </tr>
    ${rows}
  </table>`;
}

async function sendCustomerOrderEmail(order) {
  try {
    if (!order.customer_email) return;

    const shippingLabel = parseFloat(order.shipping) === 0
      ? '<span style="color:#27ae60;font-weight:600;">FREE</span>'
      : formatRupees(order.shipping);

    const discountRow = parseFloat(order.discount) > 0
      ? `<tr><td style="padding:5px 10px;font-size:14px;color:#27ae60;">Discount</td><td style="padding:5px 10px;font-size:14px;color:#27ae60;text-align:right;">-${formatRupees(order.discount)}</td></tr>`
      : '';

    const content = `
      <h2 style="margin:0 0 5px;font-size:20px;color:#333;">Thank you, ${order.customer_name}!</h2>
      <p style="margin:0 0 20px;font-size:14px;color:#666;">Your order has been placed successfully.</p>
      
      <p style="margin:0 0 15px;font-size:16px;color:#333;">Order ID: <strong style="color:#c9748f;font-size:18px;">${order.order_id}</strong></p>

      ${buildItemsTable(order.items)}

      <table width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0 20px;">
        ${discountRow}
        <tr>
          <td style="padding:5px 10px;font-size:14px;color:#666;">Shipping</td>
          <td style="padding:5px 10px;font-size:14px;text-align:right;">${shippingLabel}</td>
        </tr>
        <tr>
          <td style="padding:8px 10px;font-size:16px;font-weight:700;color:#333;border-top:2px solid #c9748f;">Total</td>
          <td style="padding:8px 10px;font-size:16px;font-weight:700;color:#c9748f;text-align:right;border-top:2px solid #c9748f;">${formatRupees(order.total)}</td>
        </tr>
      </table>

      <div style="background-color:#fdf2f5;padding:15px;border-radius:8px;margin:15px 0;">
        <p style="margin:0 0 5px;font-size:13px;font-weight:600;color:#c9748f;">Delivery Address</p>
        <p style="margin:0;font-size:14px;color:#333;">${order.address_street}, ${order.address_city}, ${order.address_state} - ${order.address_pincode}</p>
      </div>

      <p style="margin:10px 0 5px;font-size:14px;color:#666;">Payment: <strong>${order.payment_method === 'cod' ? 'Cash on Delivery' : 'Razorpay (Online)'}</strong> — ${order.payment_status}</p>
      <p style="margin:5px 0 20px;font-size:14px;color:#666;">Estimated Delivery: <strong>3–5 business days</strong></p>

      <p style="margin:0;font-size:14px;color:#666;">If you have any questions, reply to this email or contact us at <a href="mailto:${process.env.SMTP_USER}" style="color:#c9748f;">${process.env.SMTP_USER}</a>.</p>
    `;

    await transporter.sendMail({
      from: `"Vino'z Fashion" <${process.env.SMTP_USER}>`,
      to: order.customer_email,
      subject: `✅ Order Confirmed #${order.order_id} - Vino'z Fashion`,
      html: baseEmailTemplate(content),
    });

    console.log(`📧 Customer order email sent to ${order.customer_email}`);
  } catch (error) {
    console.error('❌ Failed to send customer order email:', error.message);
  }
}

async function sendAdminOrderEmail(order) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) return;

    const paymentMethodLabel = order.payment_method === 'cod' ? 'COD' : 'RAZORPAY';

    const shippingLabel = parseFloat(order.shipping) === 0
      ? '<span style="color:#27ae60;font-weight:600;">FREE</span>'
      : formatRupees(order.shipping);

    const discountRow = parseFloat(order.discount) > 0
      ? `<tr>
          <td style="padding:6px 10px;font-size:14px;color:#27ae60;">Discount${order.coupon_code ? ` (${order.coupon_code})` : ''}</td>
          <td style="padding:6px 10px;font-size:14px;color:#27ae60;text-align:right;">-${formatRupees(order.discount)}</td>
        </tr>`
      : '';

    const content = `
      <h2 style="margin:0 0 15px;font-size:20px;color:#333;">🛍️ New Order Received</h2>
      
      <p style="margin:0 0 5px;font-size:14px;color:#666;">Order ID: <strong style="color:#c9748f;font-size:16px;">${order.order_id}</strong></p>
      <p style="margin:0 0 15px;font-size:12px;color:#999;">Placed on: ${new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>

      <div style="background-color:#fdf2f5;padding:15px;border-radius:8px;margin:15px 0;">
        <p style="margin:0 0 3px;font-size:14px;"><strong>Customer:</strong> ${order.customer_name}</p>
        <p style="margin:0 0 3px;font-size:14px;"><strong>Phone:</strong> ${order.customer_phone}</p>
        <p style="margin:0 0 3px;font-size:14px;"><strong>Email:</strong> ${order.customer_email || 'N/A'}</p>
        <p style="margin:0;font-size:14px;"><strong>Address:</strong> ${order.address_street}, ${order.address_city}, ${order.address_state} - ${order.address_pincode}</p>
      </div>

      <h3 style="margin:20px 0 5px;font-size:16px;color:#333;border-bottom:2px solid #c9748f;padding-bottom:5px;">📦 Order Items</h3>
      ${buildAdminDetailedTable(order.items)}

      <table width="100%" cellpadding="0" cellspacing="0" style="margin:10px 0 20px;">
        <tr>
          <td style="padding:6px 10px;font-size:14px;color:#666;">Subtotal</td>
          <td style="padding:6px 10px;font-size:14px;color:#333;text-align:right;font-weight:600;">${formatRupees(order.subtotal)}</td>
        </tr>
        ${discountRow}
        <tr>
          <td style="padding:6px 10px;font-size:14px;color:#666;">Shipping</td>
          <td style="padding:6px 10px;font-size:14px;text-align:right;">${shippingLabel}</td>
        </tr>
        <tr>
          <td style="padding:10px;font-size:18px;font-weight:700;color:#333;border-top:2px solid #c9748f;">Grand Total</td>
          <td style="padding:10px;font-size:18px;font-weight:700;color:#c9748f;text-align:right;border-top:2px solid #c9748f;">${formatRupees(order.total)}</td>
        </tr>
      </table>

      <p style="margin:15px 0 5px;font-size:14px;"><strong>Payment:</strong> <span style="background-color:${order.payment_method === 'cod' ? '#f39c12' : '#27ae60'};color:#fff;padding:3px 10px;border-radius:4px;font-size:12px;">${paymentMethodLabel}</span> — ${order.payment_status}</p>
    `;

    await transporter.sendMail({
      from: `"Vino'z Fashion" <${process.env.SMTP_USER}>`,
      to: adminEmail,
      subject: `🛍️ New Order #${order.order_id} - ${formatRupees(order.total)} (${paymentMethodLabel})`,
      html: baseEmailTemplate(content),
    });

    console.log(`📧 Admin order email sent to ${adminEmail}`);
  } catch (error) {
    console.error('❌ Failed to send admin order email:', error.message);
  }
}

async function sendStatusUpdateEmail(order) {
  try {
    if (!order.customer_email) return;

    const statusConfig = {
      'confirmed': { emoji: '✅', message: 'Your order has been confirmed and is being prepared.' },
      'processing': { emoji: '🔧', message: 'Your order is currently being processed.' },
      'shipped': { emoji: '🚚', message: 'Great news! Your order has been shipped.' },
      'out-for-delivery': { emoji: '📦', message: 'Your order is out for delivery today!' },
      'delivered': { emoji: '🎉', message: 'Your order has been delivered. Enjoy!' },
      'cancelled': { emoji: '❌', message: 'Your order has been cancelled.' },
    };

    const config = statusConfig[order.status] || { emoji: '📋', message: `Your order status has been updated to: ${order.status}` };

    let trackingBlock = '';
    if (order.tracking_number && order.tracking_carrier) {
      const trackingLink = order.tracking_url
        ? `<a href="${order.tracking_url}" style="color:#c9748f;font-weight:600;">Track your package →</a>`
        : '';
      trackingBlock = `
      <div style="background-color:#fdf2f5;padding:15px;border-radius:8px;margin:15px 0;">
        <p style="margin:0 0 3px;font-size:14px;"><strong>Carrier:</strong> ${order.tracking_carrier}</p>
        <p style="margin:0 0 3px;font-size:14px;"><strong>Tracking #:</strong> ${order.tracking_number}</p>
        ${trackingLink ? `<p style="margin:5px 0 0;">${trackingLink}</p>` : ''}
      </div>`;
    }

    const content = `
      <h2 style="margin:0 0 5px;font-size:20px;color:#333;">${config.emoji} Order Update</h2>
      <p style="margin:0 0 15px;font-size:14px;color:#666;">Hi ${order.customer_name},</p>
      
      <p style="margin:0 0 15px;font-size:15px;color:#333;">${config.message}</p>
      
      <p style="margin:0 0 5px;font-size:14px;color:#666;">Order ID: <strong style="color:#c9748f;">${order.order_id}</strong></p>
      <p style="margin:0 0 15px;font-size:14px;color:#666;">Status: <strong style="text-transform:capitalize;">${order.status.replace(/-/g, ' ')}</strong></p>

      ${trackingBlock}

      <p style="margin:15px 0 0;font-size:14px;color:#666;">Questions? Contact us at <a href="mailto:${process.env.SMTP_USER}" style="color:#c9748f;">${process.env.SMTP_USER}</a>.</p>
    `;

    await transporter.sendMail({
      from: `"Vino'z Fashion" <${process.env.SMTP_USER}>`,
      to: order.customer_email,
      subject: `${config.emoji} Order #${order.order_id} ${order.status.replace(/-/g, ' ')} - Vino'z Fashion`,
      html: baseEmailTemplate(content),
    });

    console.log(`📧 Status update email sent to ${order.customer_email}`);
  } catch (error) {
    console.error('❌ Failed to send status update email:', error.message);
  }
}

async function sendReturnConfirmationEmail(returnRequest) {
  try {
    if (!returnRequest.customer_email) return;

    const content = `
      <h2 style="margin:0 0 5px;font-size:20px;color:#333;">🔁 Return Request Received</h2>
      <p style="margin:0 0 15px;font-size:14px;color:#666;">Hi ${returnRequest.customer_name},</p>
      
      <p style="margin:0 0 15px;font-size:14px;color:#333;">We've received your ${returnRequest.type} request.</p>

      <div style="background-color:#fdf2f5;padding:15px;border-radius:8px;margin:15px 0;">
        <p style="margin:0 0 5px;font-size:16px;"><strong>Return ID:</strong> <span style="color:#c9748f;font-weight:700;">${returnRequest.return_id}</span></p>
        <p style="margin:0 0 3px;font-size:14px;"><strong>Type:</strong> <span style="text-transform:capitalize;">${returnRequest.type}</span></p>
        <p style="margin:0;font-size:14px;"><strong>Reason:</strong> ${returnRequest.reason}</p>
      </div>

      <p style="margin:15px 0;font-size:15px;color:#333;background-color:#fef9e7;padding:12px;border-radius:6px;border-left:4px solid #f39c12;">
        Our team will review your request within <strong>24–48 hours</strong> and get back to you.
      </p>

      <p style="margin:10px 0 0;font-size:14px;color:#666;">Questions? Contact us at <a href="mailto:${process.env.SMTP_USER}" style="color:#c9748f;">${process.env.SMTP_USER}</a>.</p>
    `;

    await transporter.sendMail({
      from: `"Vino'z Fashion" <${process.env.SMTP_USER}>`,
      to: returnRequest.customer_email,
      subject: `🔁 Return Request Received #${returnRequest.return_id} - Vino'z Fashion`,
      html: baseEmailTemplate(content),
    });

    console.log(`📧 Return confirmation email sent to ${returnRequest.customer_email}`);
  } catch (error) {
    console.error('❌ Failed to send return confirmation email:', error.message);
  }
}

module.exports = {
  sendCustomerOrderEmail,
  sendAdminOrderEmail,
  sendStatusUpdateEmail,
  sendReturnConfirmationEmail,
};
