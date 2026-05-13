const userModel=require('../models/user.model');


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
    res.status(200).json({ message: 'Logged out successfully' });
};
