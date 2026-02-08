// sending email using nodemailer
import nodemailer from 'nodemailer';

const sendVerificationEmail = async (email, token) => {
    try {
        // create email transporter
        const transporter = nodemailer.createTransport({
            host:process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: false,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // verification URL
        const verificationUrl = `${process.env.BASE_URL}/api/v1/users/verify/${token}`

        // Email content
        const mailOptions = {
            from: `Authentication App <${process.env.EMAIL_USER}`,
            to: email,
            subject: "Please verify your email address",
            text: `please verify your email address to complete your registration
            ${verificationUrl}
            This verification link will expire in 10 mins.
            If you did not create an account, plese ignore this email.
            `,
        };
        // send email
        const info = await transporter.sendMail(mailOptions)
        console.log('Verification email sentL %s', info.messageId)
        return true;

    } catch (error) {
        console.error("Error sending verification email:", error)
        return false;
    }
}

export {sendVerificationEmail}

const verificaitonEmail = async (email, token) => {
    try {
        const transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: process.env.EMAIL_PORT,
            secure: process.env.EMAIL_SECURE,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        })

        // verification Url
        const verificationUrl = `${process.env.BASE_URL}/api/v1/users/verify/${token}`

        // Email contents
        const mailOptions = {
            from: `Authentication App <${process.env.EMAIL_USER}`,
            to: email,
            subject: `Verify your email address`,
            text: `please verify your email address to complete your registration
            ${verificationUrl}
            This verification link will expire in 10 mins.
            If you did not create an account, plese ignore this email.
            `,

        }

        await transporter.sendMail(mailOptions)
    } catch (error) {
        console.error("Eror sending verification email", error.message)
    }
}

