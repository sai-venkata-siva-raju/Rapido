const express = require("express");
const router = express.Router();
const captainController = require("../controllers/captain.controller");
const {body} = require("express-validator");
const { authCaptain } = require("../middleware/auth.middleware");

router.post("/register", [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("fullname.firstname").isLength({ min: 3 }),
    body("fullname.lastname").isLength({ min: 3 }),
    body("verhicle.color").notEmpty(),
    body("verhicle.model").notEmpty(),
    body("verhicle.capicity").isInt({ min: 1 }),
    body("verhicle.vehicleType").isIn(['car', 'motorcycle', 'van']),
], captainController.registerCaptain);

router.post("/login", captainController.loginCaptain);
router.post("/forgot-password", [
    body("email").isEmail().normalizeEmail(),
], captainController.requestPasswordReset);
router.post("/reset-password", [
    body("email").isEmail().normalizeEmail(),
    body("otp").notEmpty().withMessage("OTP is required"),
    body("newPassword").isLength({ min: 6 }).withMessage("password should be at least 6 characters"),
], captainController.resetPasswordWithOtp);

router.post("/logout", captainController.logoutCaptain);

router.get("/profile",authCaptain, captainController.getCaptainProfile);

router.put("/profile", [
    body("email").optional().isEmail().normalizeEmail(),
    body("password").optional().isLength({ min: 6 }),
    body("fullname.firstname").optional().isLength({ min: 3 }),
    body("fullname.lastname").optional().isLength({ min: 3 }),
    body("verhicle.color").optional().notEmpty(),
    body("verhicle.model").optional().notEmpty(),
    body("verhicle.capicity").optional().isInt({ min: 1 }),
    body("verhicle.vehicleType").optional().isIn(['car', 'motorcycle', 'van']),
], captainController.updateCaptainProfile);

router.post("/location", authCaptain, captainController.updateCaptainLocation);  

module.exports = router;
