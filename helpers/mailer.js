// helpers/mailer.js

const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    requireTLS: true,
    auth: {
        user: process.env.SMTP_MAIL,
        pass: process.env.SMTP_PASSWORD
    }
});

const sendVerificationEmail = (email, token) => {
    const url = `http://localhost:3000/user/verify-email?token=${token}`;
    const mailOptions = {
        from: process.env.SMTP_MAIL,
        to: email,
        subject: 'Email Verification',
        html: `<p>Please click <a href="${url}">here</a> to verify your email.</p>`
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error(err);
        else console.log(`Email sent: ${info.response}`);
    });
};

const sendPasswordResetEmail = (email, token) => {
    const url = `http://localhost:3000/user/resetPassword?token=${token}`;
    const mailOptions = {
        from: process.env.SMTP_MAIL,
        to: email,
        subject: 'Password Reset',
        html: `<p>Please click <a href="${url}">here</a> to reset your password.</p>`
    };

    transporter.sendMail(mailOptions, (err, info) => {
        if (err) console.error(err);
        else console.log(`Email sent: ${info.response}`);
    });
};

module.exports = {
    sendVerificationEmail,
    sendPasswordResetEmail
};
