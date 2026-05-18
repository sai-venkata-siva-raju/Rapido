const crypto = require("crypto");

const OTP_EXPIRY_MINUTES = 15;

const generateResetOtp = () => {
    return String(Math.floor(100000 + Math.random() * 900000));
};

const hashResetOtp = (otp) => {
    return crypto.createHash("sha256").update(String(otp)).digest("hex");
};

const getOtpExpiry = () => {
    return new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
};

const sendResetOtpEmail = async ({ email, otp, role }) => {
    const fromEmail = process.env.RESEND_FROM_EMAIL;
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey || !fromEmail) {
        console.log(`[password-reset] OTP for ${role}:${email} -> ${otp}`);
        return { delivered: false, provider: "console" };
    }

    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: fromEmail,
            to: email,
            subject: "Your Rapidgo password reset OTP",
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2>Password Reset OTP</h2>
                    <p>Use this one-time password to reset your ${role} account password.</p>
                    <div style="font-size: 32px; font-weight: 700; letter-spacing: 6px; margin: 24px 0;">${otp}</div>
                    <p>This OTP expires in 15 minutes.</p>
                </div>
            `,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to send OTP email: ${errorText}`);
    }

    return { delivered: true, provider: "resend" };
};

module.exports = {
    generateResetOtp,
    hashResetOtp,
    getOtpExpiry,
    sendResetOtpEmail,
};
