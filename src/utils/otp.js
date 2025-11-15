// utils/otp.js
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new twilio(accountSid, authToken);

export const sendOtpToPhone = async (phoneNumber, otp) => {
    try {
        const message = await client.messages.create({
            body: `Your OTP code is ${otp}`,
            from: '+19787189381',
            to: phoneNumber
        });
        console.log(`OTP sent: ${message.sid}`);
        return true;
    } catch (error) {
        console.error('Error sending OTP:', error);
        return false;
    }
};
