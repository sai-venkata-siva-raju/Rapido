const crypto = require("crypto");
const rideModel = require("../models/ride.model");

const paymentBaseUrl = "https://api.razorpay.com/v1";

function buildAuthHeader() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret || keySecret === "samplekeysecret") {
    const error = new Error(
      "Razorpay credentials are not configured. Set a valid RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in Backend/.env."
    );
    error.code = "RAZORPAY_CONFIG_ERROR";
    throw error;
  }

  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`;
}

function verifySignature(orderId, paymentId, signature) {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const generatedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  return generatedSignature === signature;
}

module.exports.createOrder = async (req, res, next) => {
  try {
    const { rideId } = req.body;
    if (!rideId) {
      return res.status(400).json({ message: "Ride id is required" });
    }

    const ride = await rideModel.findOne({
      _id: rideId,
      userId: req.user._id,
    });

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    const amount = Math.round(Number(ride.fare || 0) * 100);
    if (!amount) {
      return res.status(400).json({ message: "Ride fare is not available" });
    }

    const orderResponse = await fetch(`${paymentBaseUrl}/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: buildAuthHeader(),
      },
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt: `ride_${ride._id}`,
        notes: {
          rideId: String(ride._id),
          pickupLocation: ride.pickupLocation,
          dropoffLocation: ride.dropoffLocation,
          vehicleType: ride.vehicleType,
        },
      }),
    });

    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      return res.status(orderResponse.status).json({
        message: orderData?.error?.description || orderData?.error?.reason || "Unable to create payment order",
        details: orderData,
      });
    }

    await rideModel.findByIdAndUpdate(ride._id, {
      orderID: orderData.id,
      paymentStatus: "pending",
    });

    res.status(201).json({
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: orderData.id,
      amount: orderData.amount,
      currency: orderData.currency,
      rideId: String(ride._id),
      rideFare: ride.fare,
      customerName: req.user?.fullname
        ? `${req.user.fullname.firstname || ""} ${req.user.fullname.lastname || ""}`.trim()
        : req.user?.name || "Rapid-go User",
      customerEmail: req.user?.email || "",
      description: `Payment for ride from ${ride.pickupLocation} to ${ride.dropoffLocation}`,
    });
  } catch (error) {
    if (error.code === "RAZORPAY_CONFIG_ERROR") {
      return res.status(500).json({
        message: error.message,
      });
    }
    next(error);
  }
};

module.exports.verifyPayment = async (req, res, next) => {
  try {
    const {
      rideId,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = req.body;

    if (!rideId || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({ message: "Payment verification fields are required" });
    }

    if (!verifySignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      await rideModel.findByIdAndUpdate(rideId, {
        paymentStatus: "failed",
      });
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    const ride = await rideModel.findOneAndUpdate(
      { _id: rideId, userId: req.user._id },
      {
        paymentStatus: "paid",
        paymentID: razorpay_payment_id,
        orderID: razorpay_order_id,
        signature: razorpay_signature,
      },
      { new: true }
    );

    if (!ride) {
      return res.status(404).json({ message: "Ride not found" });
    }

    res.json({
      message: "Payment verified successfully",
      ride: ride.toObject(),
    });
  } catch (error) {
    next(error);
  }
};
