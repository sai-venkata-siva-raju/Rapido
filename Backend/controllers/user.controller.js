const userModel=require('../models/user.model');
const jwt=require('jsonwebtoken');
const blacklistTokenModel=require('../models/blacklistToken.model');

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
        res.status(201).json({ token, user: newUser });
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
        res.status(200).json({ token, user });
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
            console.error('Error blacklisting token:', error);  
            // Ignoreinvalid or already expired tokens during logout.
        }
    }

    res.clearCookie('token', cookieOptions);
    res.status(200).json({ message: 'Logged out successfully' });
};
