const express = require('express');
const router = express.Router();
const {
    createRide,
    getRideFare,
    confirmRide,
    startRide,
    endRide,
    getCurrentUserRide,
    getPendingCaptainRides,
    getActiveCaptainRide,
} = require('../controllers/ride.controller');
const { authUser, authCaptain } = require('../middleware/auth.middleware');
const { body, validationResult, query } = require('express-validator');

router.post(
    '/create',
    authUser,
    body("pickupLocation").not().isEmpty().withMessage("Pickup location is required"),
    body("dropoffLocation").not().isEmpty().withMessage("Dropoff location is required"),
    body("vehicleType").isIn(["car", "motorcycle", "van"]).withMessage("Vehicle type is required"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            await createRide(req, res);
        } catch (error) {
            console.error("Error in /create route:", error);
            res.status(500).json({ error: "Internal server error" });
        }
    }
);

router.get(
    '/current',
    authUser,
    getCurrentUserRide
);

router.get(
    "/fare",
    authUser,
    query("pickupLocation").not().isEmpty().withMessage("Pickup location is required"),
    query("dropoffLocation").not().isEmpty().withMessage("Dropoff location is required"),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        return getRideFare(req, res, next);
    }
);

router.post(
    "/confirm",
    authCaptain,
    body("rideId").not().isEmpty().withMessage("Ride id is required"),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        return confirmRide(req, res, next);
    }
);

router.get(
    "/captain/pending",
    authCaptain,
    getPendingCaptainRides
);

router.get(
    "/captain/active",
    authCaptain,
    getActiveCaptainRide
);

router.post(
    "/start",
    authCaptain,
    body("rideId").not().isEmpty().withMessage("Ride id is required"),
    body("otp").not().isEmpty().withMessage("OTP is required"),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        return startRide(req, res, next);
    }
);

router.post(
    "/end",
    authCaptain,
    body("rideId").not().isEmpty().withMessage("Ride id is required"),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        return endRide(req, res, next);
    }
);

module.exports = router;
