const express=require('express');
const router=express.Router();
const userController=require('../controllers/user.controller');
const {body}=require('express-validator');
const authMiddleware=require('../middleware/auth.middleware');

router.post('/register',[
    body('fullname.firstname').isLength({min:3}).withMessage("firstname should be at least 3 characters"),
    body('fullname.lastname').isLength({min:3}).withMessage("lastname should be at least 3 characters"),
    body('email').isEmail().withMessage("Please fill a valid email address"),
    body('password').isLength({min:6}).withMessage("password should be at least 6 characters")
],userController.register);

router.post('/login',userController.login);

router.post('/logout',authMiddleware.authUser,userController.logout);

router.get('/profile',authMiddleware.authUser,userController.profile);

module.exports = router;
