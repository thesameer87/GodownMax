import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

export const sendEmail = async (options: EmailOptions) => {
  if (!process.env.SMTP_USER) {
    console.log('[EMAIL] SMTP not configured, skipping:', options.subject);
    return;
  }
  await transporter.sendMail({
    from: `"GodownMax" <${process.env.SMTP_USER}>`,
    ...options,
  });
};

export const sendLowStockAlert = async (to: string, products: any[]) => {
  const rows = products.map(p => `<tr><td>${p.name}</td><td>${p.sku}</td><td>${p.stock}</td><td>${p.reorderPoint}</td></tr>`).join('');
  await sendEmail({
    to,
    subject: '⚠️ GodownMax: Low Stock Alert',
    html: `
      <h2>Low Stock Alert</h2>
      <p>The following products are running low on stock:</p>
      <table border="1" cellpadding="8">
        <tr><th>Product</th><th>SKU</th><th>Current Stock</th><th>Reorder Point</th></tr>
        ${rows}
      </table>
      <p>Please reorder these items soon to avoid stockouts.</p>
    `,
  });
};
