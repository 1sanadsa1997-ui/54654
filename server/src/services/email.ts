import nodemailer from 'nodemailer';
import { logger } from '../utils/logger';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '465'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

async function sendEmail({ to, subject, html }: EmailOptions) {
  try {
    await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME || 'PromoHive'}" <${process.env.SMTP_FROM_EMAIL}>`,
      to,
      subject,
      html,
    });
    logger.info(`Email sent to ${to}: ${subject}`);
  } catch (error) {
    logger.error('Email send failed:', error);
    throw error;
  }
}

export async function sendWelcomeEmail(email: string, fullName: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Welcome to PromoHive! 🎉</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${fullName}</strong>,</p>
          <p>Thank you for registering with PromoHive Global Promo Network!</p>
          <p>Your account is currently <strong>under review</strong> by our admin team. This process typically takes 24-48 hours.</p>
          <p>Once approved, you will receive another email and can start earning immediately with a <strong>$5 welcome bonus</strong>!</p>
          <p>What you can do with PromoHive:</p>
          <ul>
            <li>✅ Complete tasks and earn rewards</li>
            <li>✅ Refer friends and get bonuses</li>
            <li>✅ Upgrade levels for higher earnings</li>
            <li>✅ Withdraw to USDT (TRC20/ERC20/BEP20)</li>
          </ul>
          <p>We'll notify you as soon as your account is approved!</p>
        </div>
        <div class="footer">
          <p>PromoHive Global Promo Network</p>
          <p>© 2025 All rights reserved</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: 'Welcome to PromoHive - Account Under Review',
    html,
  });
}

export async function sendApprovalEmail(email: string, fullName: string) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #11998e; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .bonus { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🎉 Account Approved!</h1>
        </div>
        <div class="content">
          <p>Congratulations <strong>${fullName}</strong>!</p>
          <p>Your PromoHive account has been <strong>approved</strong> and is now active!</p>
          <div class="bonus">
            <h3>🎁 Welcome Bonus Credited!</h3>
            <p>We've added <strong>$5.00</strong> to your wallet to get you started!</p>
          </div>
          <p>You can now:</p>
          <ul>
            <li>✅ Login to your account</li>
            <li>✅ Browse and complete tasks</li>
            <li>✅ Start earning rewards</li>
            <li>✅ Invite friends and earn referral bonuses</li>
          </ul>
          <a href="${process.env.FRONTEND_URL}/login" class="button">Login Now</a>
          <p>Start your earning journey today!</p>
        </div>
        <div class="footer">
          <p>PromoHive Global Promo Network</p>
          <p>© 2025 All rights reserved</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: '🎉 Your PromoHive Account is Approved!',
    html,
  });
}

export async function sendMagicLinkEmail(email: string, token: string, fullName: string) {
  const magicLink = `${process.env.FRONTEND_URL}/auth/magic-link?token=${token}`;
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #667eea; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .warning { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Magic Link Login</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${fullName}</strong>,</p>
          <p>Click the button below to login to your PromoHive account:</p>
          <a href="${magicLink}" class="button">Login to PromoHive</a>
          <div class="warning">
            <p><strong>⚠️ Security Notice:</strong></p>
            <ul>
              <li>This link expires in 10 minutes</li>
              <li>Can only be used once</li>
              <li>If you didn't request this, please ignore this email</li>
            </ul>
          </div>
          <p>Or copy and paste this link:</p>
          <p style="word-break: break-all; background: #fff; padding: 10px; border: 1px solid #ddd;">${magicLink}</p>
        </div>
        <div class="footer">
          <p>PromoHive Global Promo Network</p>
          <p>© 2025 All rights reserved</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: '🔐 Your PromoHive Magic Link',
    html,
  });
}

export async function sendWithdrawalRequestEmail(email: string, fullName: string, amount: number, usdtAmount: number) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .info { background: #d1ecf1; border-left: 4px solid #0c5460; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>💰 Withdrawal Request Received</h1>
        </div>
        <div class="content">
          <p>Hello <strong>${fullName}</strong>,</p>
          <p>We've received your withdrawal request:</p>
          <div class="info">
            <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
            <p><strong>USDT Amount:</strong> ${usdtAmount.toFixed(2)} USDT</p>
            <p><strong>Status:</strong> Pending Review</p>
          </div>
          <p>Your request is being processed by our team. This typically takes 24-48 hours.</p>
          <p>You will receive another email once your withdrawal is approved and processed.</p>
          <p>Thank you for using PromoHive!</p>
        </div>
        <div class="footer">
          <p>PromoHive Global Promo Network</p>
          <p>© 2025 All rights reserved</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: '💰 Withdrawal Request Received',
    html,
  });
}

export async function sendWithdrawalApprovedEmail(
  email: string,
  fullName: string,
  amount: number,
  usdtAmount: number,
  txHash?: string
) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>✅ Withdrawal Approved!</h1>
        </div>
        <div class="content">
          <p>Great news <strong>${fullName}</strong>!</p>
          <p>Your withdrawal has been approved and processed!</p>
          <div class="success">
            <p><strong>Amount:</strong> $${amount.toFixed(2)}</p>
            <p><strong>USDT Amount:</strong> ${usdtAmount.toFixed(2)} USDT</p>
            ${txHash ? `<p><strong>Transaction Hash:</strong> ${txHash}</p>` : ''}
            <p><strong>Status:</strong> Completed ✅</p>
          </div>
          <p>The USDT has been sent to your wallet address. Please check your wallet.</p>
          <p>Thank you for using PromoHive!</p>
        </div>
        <div class="footer">
          <p>PromoHive Global Promo Network</p>
          <p>© 2025 All rights reserved</p>
        </div>
      </div>
    </body>
    </html>
  `;

  await sendEmail({
    to: email,
    subject: '✅ Withdrawal Approved and Processed',
    html,
  });
}

