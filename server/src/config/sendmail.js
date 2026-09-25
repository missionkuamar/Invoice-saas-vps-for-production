import nodemailer from 'nodemailer';

const sendMail = async ({ to, subject, html }) => {
  
  const isEmailConfigured = () => {
  return (
    process.env.EMAIL_USERNAME &&
    process.env.EMAIL_PASSWORD
  );
};

if (!isEmailConfigured()) {
  return res.status(503).json({
    success: false,
    message: "Email service is not configured. Please try again later.",
  });
}
  try {
    // Check production environment variables
    if (!process.env.EMAIL_USERNAME || !process.env.EMAIL_PASSWORD) {
      // console.error('❌ Email credentials are missing');
      return false;
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    // Verify SMTP connection
    await transporter.verify();

    //console.log('✅ Gmail SMTP connection successful');

    const info = await transporter.sendMail({
      from: `InvoiceHub <${process.env.EMAIL_USERNAME}>`,
      to,
      subject,
      html,
    });

    // console.log(`✅ Email sent to ${to}`);
    // console.log(`📨 Message ID: ${info.messageId}`);

    return true;

  } catch (error) {
    // console.error('❌ Email Error:', error.message);
    // console.error('❌ Error Code:', error.code);

    return false;
  }
};

export default sendMail;