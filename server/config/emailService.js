import nodemailer from "nodemailer";

// Create nodemailer transporter using Gmail SMTP
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS,
  },
});

/**
 * Sends a premium HTML email for OTP Verification (Sign Up)
 */
export const sendOtpEmail = async (email, name, otp) => {
  const mailOptions = {
    from: `"NextMind AI" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Verify your NextMind AI account - OTP: " + otp,
    html: `
      <div style="font-family: 'Outfit', 'Inter', system-ui, sans-serif; background-color: #F8FAFC; padding: 40px 20px; color: #1E293B; max-width: 600px; margin: 0 auto; border-radius: 24px; border: 1px border #E2E8F0; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
        
        <!-- Header Brand Logo/Icon -->
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; background-color: #0F172A; color: #FFFFFF; font-size: 24px; font-weight: 900; border-radius: 16px; text-align: center; box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.1);">
            N
          </div>
          <h1 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 16px 0 4px 0; tracking: -0.02em;">NextMind AI</h1>
          <p style="font-size: 12px; font-weight: 700; color: #10A37F; text-transform: uppercase; letter-spacing: 0.05em; margin: 0;">Intelligent Verification</p>
        </div>

        <!-- Content Card -->
        <div style="background-color: #FFFFFF; border-radius: 20px; padding: 32px; border: 1px solid #F1F5F9; box-shadow: 0 1px 3px rgba(0,0,0,0.01);">
          <h2 style="font-size: 18px; font-weight: 700; color: #0F172A; margin-top: 0; margin-bottom: 12px;">Hello ${name},</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
            Thank you for registering with NextMind AI. To activate your account and access your next-generation intelligent assistant, please verify your email address by entering this 6-digit One-Time Password (OTP):
          </p>

          <!-- OTP Code Box -->
          <div style="text-align: center; margin: 32px 0;">
            <div style="display: inline-block; background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 16px 32px; border-radius: 16px; font-size: 32px; font-weight: 800; color: #0F172A; letter-spacing: 0.2em; text-shadow: 0 1px 1px rgba(255,255,255,0.8);">
              ${otp}
            </div>
            <p style="font-size: 11px; color: #94A3B8; margin-top: 12px; font-weight: 500;">This verification code is valid for 15 minutes.</p>
          </div>

          <p style="font-size: 13px; line-height: 1.6; color: #64748B; margin-bottom: 0;">
            If you did not initiate this sign-up request, you can safely ignore this email. Your details remain completely secure.
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 32px; font-size: 11px; color: #94A3B8; line-height: 1.5; font-weight: 500;">
          <p style="margin-bottom: 4px;">&copy; ${new Date().getFullYear()} NextMind AI. All rights reserved.</p>
          <p style="margin: 0;">Secure server verification &bull; Enterprise-grade encryption</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email Verification OTP sent successfully:", info.messageId);
    return { success: true };
  } catch (error) {
    console.error("Nodemailer OTP Email Error:", error);
    throw error;
  }
};

/**
 * Sends a premium HTML email for Resetting Password (Forgot Password)
 */
export const sendResetPasswordEmail = async (email, name, otp) => {
  const mailOptions = {
    from: `"NextMind AI" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Reset your NextMind AI password - OTP: " + otp,
    html: `
      <div style="font-family: 'Outfit', 'Inter', system-ui, sans-serif; background-color: #F8FAFC; padding: 40px 20px; color: #1E293B; max-width: 600px; margin: 0 auto; border-radius: 24px; border: 1px solid #E2E8F0; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
        
        <!-- Header Brand Logo/Icon -->
        <div style="text-align: center; margin-bottom: 32px;">
          <div style="display: inline-block; width: 56px; height: 56px; line-height: 56px; background-color: #0F172A; color: #FFFFFF; font-size: 24px; font-weight: 900; border-radius: 16px; text-align: center; box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.1);">
            N
          </div>
          <h1 style="font-size: 22px; font-weight: 800; color: #0F172A; margin: 16px 0 4px 0; tracking: -0.02em;">NextMind AI</h1>
          <p style="font-size: 12px; font-weight: 700; color: #EF4444; text-transform: uppercase; letter-spacing: 0.05em; margin: 0;">Password Recovery</p>
        </div>

        <!-- Content Card -->
        <div style="background-color: #FFFFFF; border-radius: 20px; padding: 32px; border: 1px solid #F1F5F9; box-shadow: 0 1px 3px rgba(0,0,0,0.01);">
          <h2 style="font-size: 18px; font-weight: 700; color: #0F172A; margin-top: 0; margin-bottom: 12px;">Hello ${name},</h2>
          <p style="font-size: 14px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
            We received a request to reset your password for your NextMind AI account. Please use this 6-digit One-Time Password (OTP) to securely establish your new login credentials:
          </p>

          <!-- OTP Code Box -->
          <div style="text-align: center; margin: 32px 0;">
            <div style="display: inline-block; background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 16px 32px; border-radius: 16px; font-size: 32px; font-weight: 800; color: #0F172A; letter-spacing: 0.2em; text-shadow: 0 1px 1px rgba(255,255,255,0.8);">
              ${otp}
            </div>
            <p style="font-size: 11px; color: #94A3B8; margin-top: 12px; font-weight: 500;">This password reset code is valid for 15 minutes.</p>
          </div>

          <p style="font-size: 13px; line-height: 1.6; color: #64748B; margin-bottom: 0;">
            If you did not request this password reset, please change your credentials immediately or contact support. Your security is our top priority.
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 32px; font-size: 11px; color: #94A3B8; line-height: 1.5; font-weight: 500;">
          <p style="margin-bottom: 4px;">&copy; ${new Date().getFullYear()} NextMind AI. All rights reserved.</p>
          <p style="margin: 0;">Secure server verification &bull; Enterprise-grade encryption</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Password Reset OTP sent successfully:", info.messageId);
    return { success: true };
  } catch (error) {
    console.error("Nodemailer Reset Password Email Error:", error);
    throw error;
  }
};
