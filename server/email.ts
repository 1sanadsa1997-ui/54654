import nodemailer from 'nodemailer';

const SMTP_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};

const FROM_EMAIL = process.env.SMTP_FROM_EMAIL || 'promohive@globalpromonetwork.store';
const FROM_NAME = process.env.SMTP_FROM_NAME || 'PromoHive Team';
const PLATFORM_URL = process.env.PLATFORM_URL || 'https://globalpromonetwork.store';

let transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport(SMTP_CONFIG);
  }
  return transporter;
}

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const transport = getTransporter();
    await transport.sendMail({
      from: `"${FROM_NAME}" <${FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    console.log(`[Email] Sent to ${to}: ${subject}`);
    return true;
  } catch (error) {
    console.error('[Email] Failed to send:', error);
    return false;
  }
}

export async function sendWelcomeEmail(email: string, fullName: string) {
  const subject = 'Welcome to PromoHive - Your Account is Under Review';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to PromoHive!</h1>
        </div>
        <div class="content">
          <h2>Hello ${fullName},</h2>
          <p>Thank you for registering with PromoHive Global Promo Network!</p>
          <p>Your account has been created successfully and is currently under review by our admin team.</p>
          <p><strong>What happens next?</strong></p>
          <ul>
            <li>Our team will review your account within 24-48 hours</li>
            <li>Once approved, you'll receive a $5 welcome bonus</li>
            <li>You'll get another email notification when your account is approved</li>
            <li>Then you can start earning by completing tasks and referring friends!</li>
          </ul>
          <p>We appreciate your patience and look forward to having you in our community.</p>
          <a href="${PLATFORM_URL}" class="button">Visit PromoHive</a>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} PromoHive Global Promo Network. All rights reserved.</p>
          <p>If you have any questions, contact us at ${FROM_EMAIL}</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return await sendEmail(email, subject, html);
}

export async function sendApprovalEmail(email: string, fullName: string) {
  const subject = 'Your PromoHive Account Has Been Approved! 🎉';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .highlight { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
        .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Account Approved!</h1>
        </div>
        <div class="content">
          <h2>Congratulations ${fullName}!</h2>
          <p>Great news! Your PromoHive account has been approved and is now active.</p>
          <div class="highlight">
            <strong>🎁 Welcome Bonus:</strong> We've credited your account with a $5.00 welcome bonus to get you started!
          </div>
          <p><strong>You can now:</strong></p>
          <ul>
            <li>✅ Complete tasks and earn rewards</li>
            <li>✅ Refer friends and earn commission</li>
            <li>✅ Upgrade your level for higher earnings</li>
            <li>✅ Request withdrawals (minimum $10)</li>
          </ul>
          <p>Log in now and start earning!</p>
          <a href="${PLATFORM_URL}" class="button">Login to Your Account</a>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} PromoHive Global Promo Network. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return await sendEmail(email, subject, html);
}

export async function sendRejectionEmail(email: string, fullName: string, reason?: string) {
  const subject = 'PromoHive Account Application Update';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #dc3545; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Account Application Update</h1>
        </div>
        <div class="content">
          <h2>Hello ${fullName},</h2>
          <p>Thank you for your interest in PromoHive Global Promo Network.</p>
          <p>After reviewing your application, we regret to inform you that we are unable to approve your account at this time.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          <p>If you believe this is an error or have questions, please contact our support team.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} PromoHive Global Promo Network. All rights reserved.</p>
          <p>Contact: ${FROM_EMAIL}</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return await sendEmail(email, subject, html);
}

export async function sendMagicLinkEmail(email: string, fullName: string, magicLink: string) {
  const subject = 'Your PromoHive Login Link';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .warning { background: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Login to PromoHive</h1>
        </div>
        <div class="content">
          <h2>Hello ${fullName},</h2>
          <p>Click the button below to securely log in to your PromoHive account:</p>
          <a href="${magicLink}" class="button">Login to PromoHive</a>
          <div class="warning">
            <strong>⚠️ Security Notice:</strong>
            <ul>
              <li>This link expires in 10 minutes</li>
              <li>It can only be used once</li>
              <li>Don't share this link with anyone</li>
            </ul>
          </div>
          <p>If you didn't request this login link, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} PromoHive Global Promo Network. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return await sendEmail(email, subject, html);
}

export async function sendWithdrawalApprovedEmail(
  email: string,
  fullName: string,
  amount: number,
  txHash?: string
) {
  const subject = 'Your Withdrawal Has Been Processed';
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #28a745; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .amount { font-size: 32px; color: #28a745; font-weight: bold; text-align: center; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Withdrawal Completed</h1>
        </div>
        <div class="content">
          <h2>Hello ${fullName},</h2>
          <p>Your withdrawal request has been processed successfully!</p>
          <div class="amount">$${(amount / 100).toFixed(2)}</div>
          ${txHash ? `<p><strong>Transaction Hash:</strong><br><code>${txHash}</code></p>` : ''}
          <p>The funds should appear in your wallet shortly.</p>
          <p>Thank you for using PromoHive!</p>
        </div>
        <div class="footer">
          <p>&copy; ${new Date().getFullYear()} PromoHive Global Promo Network. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return await sendEmail(email, subject, html);
}

