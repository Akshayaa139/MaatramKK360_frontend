const sgMail = require('@sendgrid/mail');
const twilio = require('twilio');

// Configure SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Configure Twilio
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

class NotificationService {
  // Send email notification
  static async sendEmail(to, subject, text, html = null) {
    try {
      const msg = {
        to,
        from: process.env.SENDGRID_FROM_EMAIL,
        subject,
        text,
        html: html || text,
      };

      await sgMail.send(msg);
      console.log(`Email sent successfully to ${to}`);
      return { success: true, message: 'Email sent successfully' };
    } catch (error) {
      console.error('Email sending failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Send SMS notification
  static async sendSMS(to, message) {
    try {
      // Ensure phone number is in international format
      const formattedPhone = to.startsWith('+') ? to : `+91${to}`;
      
      const sms = await twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedPhone,
      });

      console.log(`SMS sent successfully to ${formattedPhone}`);
      return { success: true, message: 'SMS sent successfully', messageId: sms.sid };
    } catch (error) {
      console.error('SMS sending failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Send application submission confirmation
  static async sendApplicationConfirmation(application) {
    const emailSubject = 'Application Submitted Successfully - KK360';
    const emailText = `
      Dear ${application.personalInfo.fullName},
      
      Your application has been submitted successfully!
      
      Application ID: ${application.applicationId}
      Submission Date: ${new Date(application.submittedAt).toLocaleDateString()}
      
      We will review your application and get back to you soon.
      
      Best regards,
      KK360 Team
    `;

    const smsText = `Your application ${application.applicationId} has been submitted successfully. We will review it and get back to you soon. - KK360`;

    // Send both email and SMS
    const emailPromise = this.sendEmail(
      application.personalInfo.email,
      emailSubject,
      emailText
    );

    const smsPromise = this.sendSMS(
      application.personalInfo.phone,
      smsText
    );

    const results = await Promise.allSettled([emailPromise, smsPromise]);
    return results;
  }

  // Send status update notification
  static async sendStatusUpdate(application, newStatus) {
    const statusMessages = {
      'under_review': 'Your application is under review',
      'televerification': 'You have been selected for televerification',
      'panel_interview': 'You have been selected for panel interview',
      'selected': 'Congratulations! You have been selected',
      'rejected': 'Your application has been rejected'
    };

    const emailSubject = `Application Status Update - KK360`;
    const emailText = `
      Dear ${application.personalInfo.fullName},
      
      Your application status has been updated to: ${statusMessages[newStatus] || newStatus}
      
      Application ID: ${application.applicationId}
      
      Best regards,
      KK360 Team
    `;

    const smsText = `Application ${application.applicationId} status: ${statusMessages[newStatus] || newStatus}. - KK360`;

    const emailPromise = this.sendEmail(
      application.personalInfo.email,
      emailSubject,
      emailText
    );

    const smsPromise = this.sendSMS(
      application.personalInfo.phone,
      smsText
    );

    const results = await Promise.allSettled([emailPromise, smsPromise]);
    return results;
  }
  }

  // Send application confirmation
  static async sendApplicationConfirmation(application) {
    const subject = 'Application Received - Karpom Karpippom';
    const text = `Thank you for applying to Karpom Karpippom! Your application has been received successfully. Your Application ID is: ${application.applicationId}`;
    const html = `
      <h1>Thank you for applying to Karpom Karpippom!</h1>
      <p>Your application has been received successfully.</p>
      <p>Your Application ID is: <strong>${application.applicationId}</strong></p>
      <p>We will review your application and get back to you soon.</p>
    `;

    await this.sendEmail(application.email, subject, text, html);
    await this.sendSMS(application.phone, `Hi ${application.name}, your application for Karpom Karpippom has been received. Your Application ID is ${application.applicationId}.`);
  }

}

module.exports = NotificationService;