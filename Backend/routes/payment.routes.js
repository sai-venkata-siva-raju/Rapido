const express = require("express");
const router = express.Router();
const { body, validationResult } = require("express-validator");
const { authUser } = require("../middleware/auth.middleware");
const paymentController = require("../controllers/payment.controller");

router.post(
  "/create-order",
  authUser,
  body("rideId").not().isEmpty().withMessage("Ride id is required"),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    return paymentController.createOrder(req, res, next);
  }
);

router.post(
  "/verify",
  authUser,
  body("rideId").not().isEmpty().withMessage("Ride id is required"),
  body("razorpay_payment_id").not().isEmpty().withMessage("Payment id is required"),
  body("razorpay_order_id").not().isEmpty().withMessage("Order id is required"),
  body("razorpay_signature").not().isEmpty().withMessage("Signature is required"),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    return paymentController.verifyPayment(req, res, next);
  }
);

module.exports = router;
