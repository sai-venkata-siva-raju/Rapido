const userModel=require('../models/user.model');
const jwt=require('jsonwebtoken');
const blacklistTokenModel=require('../models/blacklistToken.model');

module.exports.authUser=async(req,res,next)=>{
    const token=req.header('Authorization')?.replace('Bearer ','') || req.cookies.token; 
    if(!token){
        return res.status(401).json({message:"Unauthorized"});
    }
    try {
        const blacklistedToken = await blacklistTokenModel.findOne({ token });
        if (blacklistedToken) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        const userId=decoded._id || decoded.id;
        const user=await userModel.findById(userId);
        if(!user){
            return res.status(401).json({message:"Unauthorized"});
        }
        req.user=user;
        next();
    } catch (error) {
        return res.status(401).json({message:"Unauthorized"});
    } 
};
