const userModel=require('../models/user.model');
const jwt=require('jsonwebtoken');
const blacklistTokenModel=require('../models/blacklistToken.model');
const {
    generateResetOtp,
    hashResetOtp,
    getOtpExpiry,
    sendResetOtpEmail,
} = require("../utils/passwordReset");

const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 1000,
};

module.exports.register=async(req,res,next)=>{
    try {
        const { fullname, email, password } = req.body;

        // Check if user already exists
        const existingUser = await userModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Create new user
        const newUser = new userModel({
            fullname,
            email,
            password
        });

        // Hash the password before saving
        newUser.password = await newUser.hashPassword(password);

        // Save user to database
        await newUser.save();

        // Generate auth token
        const token = newUser.generateAuthToken();

        res.cookie('token', token, cookieOptions);
        res.status(201).json({ token, role: "user", user: newUser });
    } catch (error) {
        next(error);
    }
};

module.exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const isPasswordValid = await user.comparePassword(password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid email or password' });
        }

        const token = user.generateAuthToken();

        res.cookie('token', token, cookieOptions);
        res.status(200).json({ token, role: "user", user });
    } catch (error) {
        next(error);
    }
};
module.exports.profile = async (req, res) => {
    try {
        const user = await userModel.findById(req.user._id).select('-password');
        res.status(200).json({ user });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};


module.exports.logout = async (req, res) => {
    const token = req.token || req.header('Authorization')?.replace('Bearer ','') || req.cookies.token;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            await userModel.findByIdAndUpdate(decoded._id || decoded.id, {
                lastLogoutAt: new Date(),
            });
            await blacklistTokenModel.create({
                token,
                userId: decoded._id || decoded.id,
                expiresAt: new Date(decoded.exp * 1000),
            });
        } catch (error) {
            // Ignore invalid or already expired tokens during logout.
        }
    }

    res.clearCookie('token', cookieOptions);
    res.status(200).json({ message: 'Logged out successfully' });
};

module.exports.requestPasswordReset = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "No user account found for that email" });
        }

        const otp = generateResetOtp();
        user.passwordResetOtpHash = hashResetOtp(otp);
        user.passwordResetOtpExpiresAt = getOtpExpiry();
        await user.save();

        const delivery = await sendResetOtpEmail({ email, otp, role: "user" });

        res.status(200).json({
            message: "Password reset OTP sent to your email",
            ...(delivery.delivered ? {} : { devOtp: otp }),
        });
    } catch (error) {
        next(error);
    }
};

module.exports.resetPasswordWithOtp = async (req, res, next) => {
    try {
        const { email, otp, newPassword } = req.body;
        const user = await userModel.findOne({ email }).select("+password");

        if (!user) {
            return res.status(404).json({ message: "No user account found for that email" });
        }

        if (!user.passwordResetOtpHash || !user.passwordResetOtpExpiresAt) {
            return res.status(400).json({ message: "No password reset OTP was requested for this account" });
        }

        if (user.passwordResetOtpExpiresAt < new Date()) {
            user.passwordResetOtpHash = null;
            user.passwordResetOtpExpiresAt = null;
            await user.save();
            return res.status(400).json({ message: "OTP has expired. Please request a new one." });
        }

        if (hashResetOtp(otp) !== user.passwordResetOtpHash) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        user.password = await user.hashPassword(newPassword);
        user.passwordResetOtpHash = null;
        user.passwordResetOtpExpiresAt = null;
        await user.save();

        res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
        next(error);
    }
};
