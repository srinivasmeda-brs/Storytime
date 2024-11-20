import nodemailer from 'nodemailer';
import ejs from 'ejs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirectory = dirname(currentFilePath);
console.log("Current directory:", currentDirectory);

// Setup Nodemailer with environment variables for Gmail
const transporter = nodemailer.createTransport({
  service: 'gmail', // Using Gmail's SMTP service
  auth: {
    user: "svas77310@gmail.com", // Email from .env file
    pass: "cpuckrqgwqwpfblk", // App password from .env file
  },
});

// Send email verification link
export const sendMailVerificationLink = async (email, token, name) => {
    try {
      const templatePath = resolve(currentDirectory, '../templates/confirm_email.ejs');
      const renderContent = await ejs.renderFile(templatePath, { token, name });
  
      const myMail = "svas77310@gmail.com";
      const mailOptions = {
        from: `"test" <${myMail}>`, // Sender's email
        to: email, // Receiver's email
        subject: 'Storytime - Verify your email', // Email subject
        text: `Hi ${name}`, // Plain text body
        html: renderContent, // HTML body
      };
  
      const verificationInfo = await transporter.sendMail(mailOptions);
      if (verificationInfo.accepted.length > 0) {
        return { success: true };
      } else {
        console.log('Failed to send verification email');
        return { error: 'Failed to send email' };
      }
    } catch (err) {
      console.error('Error rendering email template:', err);
      return { error: err };
    }
  };
  


// send password reset Link 
export const sendPasswordResetLink =  async (email,token,name) => { 
  
  try {
    // Use an absolute path for the template file
    const templatePath = resolve(currentDirectory, "../templates/reset_passwod.ejs");
    const renderContent = await ejs.renderFile(templatePath, {token,name });
    
    let myMail = "svas77310@gmail.com";
    const mailOptions = {
      from: `"test" <${myMail}>`, // Sender's email
      to: email, // Receiver's email
      subject: 'Storytime - Reset your password', // Email subject
      text: `Hi ${name,token}`, // Plain text body
      html: renderContent, // HTML body
    };
    
    const passwordResetInfo = await transporter.sendMail(mailOptions);
    console.log('Password reset email sent successfully');
    return passwordResetInfo;
    
  } catch (err) {
    console.error('Error rendering email template:', err);
    return { error: err };
  }

}
