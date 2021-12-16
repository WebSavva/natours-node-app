const nodemailer = require('nodemailer');


module.exports = async (options) => {
    const transport = nodemailer.createTransport({
      host: 'smtp.mailtrap.io',
      port: 2525,
      auth: {
        user: process.env.NODE_MAIL_USER,
        pass: process.env.NODE_MAIL_PASSWORD,
      },
    });

    const mailOptions = {
        from: 'Sava Prokofev <websavvap@gmail.com>',
        to: options.email,
        subject: options.subject,
        text: options.message,
    };

    await transport.sendMail(mailOptions);
};
