const captainmodel = require("../models/captain.model");
const blacklistTokenModel=require('../models/blacklistToken.model');
const jwt = require('jsonwebtoken');

const cookieOptions = {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 1000,
};

module.exports.registerCaptain = async (req, res, next) => {
    try {
        const { fullname, email, password, verhicle } = req.body;

        // Check if captain already exists
        const existingCaptain = await captainmodel.findOne({ email });
        if (existingCaptain) {
            return res.status(400).json({ message: "Captain already exists" });
        }

        // Create new captain
        const newCaptain = new captainmodel({
            fullname,
            email,
            password,
            verhicle
        });

        // Hash the password before saving
        newCaptain.password = await newCaptain.hashPassword(password);

        // Save captain to database
        await newCaptain.save();

        // Generate auth token
        const token = newCaptain.generateAuthToken();

        res.cookie('token', token, cookieOptions);
        res.status(201).json({ token, role: "captain", captain: newCaptain });
    } catch (error) {
        next(error);
    }
};  

module.exports.loginCaptain = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find captain by email
        const captain = await captainmodel.findOne({ email });
        if (!captain) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Compare password
        const isMatch = await captain.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid email or password" });
        }

        // Generate auth token
        const token = captain.generateAuthToken();

        res.cookie('token', token, cookieOptions);
        res.json({ token, role: "captain", captain });
    } catch (error) {
        next(error);
    }
};

module.exports.logoutCaptain = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ','') || req.cookies.token;
        if (token) {
            try {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                await blacklistTokenModel.create({
                    token,
                    userId: decoded._id || decoded.id,
                    expiresAt: new Date(decoded.exp * 1000),
                });
            } catch (error) {
                // Ignore invalid or already expired tokens during logout.
            }
        }
        // Clear cookie even if the token is missing or already invalid.
        res.clearCookie('token', cookieOptions);
        res.json({ message: "Logged out successfully" });
    } catch (error) {
        next(error);
    }
};

module.exports.getCaptainProfile = async (req, res, next) => {
    try {
        const captainId = req.captain.id;
        const captain = await captainmodel.findById(captainId).select('-password');
        if (!captain) {
            return res.status(404).json({ message: "Captain not found" });
        }
        res.json(captain);
    } catch (error) {
        next(error);
    }
};

module.exports.updateCaptainProfile = async (req, res, next) => {
    try {
        const captainId = req.captain.id;
        const updates = req.body;

        if (updates.password) {
            const captain = await captainmodel.findById(captainId);
            updates.password = await captain.hashPassword(updates.password);
        }

        const updatedCaptain = await captainmodel.findByIdAndUpdate(captainId, updates, { new: true }).select('-password');
        if (!updatedCaptain) {
            return res.status(404).json({ message: "Captain not found" });
        }
        res.json(updatedCaptain);
    } catch (error) {
        next(error);
    }
};

module.exports.updateCaptainLocation = async (req, res, next) => {
    try {
        const captainId = req.captain.id;
        const { latitude, longitude } = req.body;

        const updatedCaptain = await captainmodel.findByIdAndUpdate(
            captainId,
            { location: { latitude, longitude } },
            { new: true }
        ).select('-password');

        if (!updatedCaptain) {
            return res.status(404).json({ message: "Captain not found" });
        }
        res.json(updatedCaptain);
    } catch (error) {
        next(error);
    }
};
