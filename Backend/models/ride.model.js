const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    captainId: { type: mongoose.Schema.Types.ObjectId, ref: 'Captain' },
    pickupLocation: { type: String, required: true },
    dropoffLocation: { type: String, required: true },
    vehicleType: {
        type: String,
        enum: ['car', 'motorcycle', 'van'],
        required: true,
    },
    otp: { type: String, select: false },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending',
    },
    status: { type: String, enum: ['requested', 'accepted', 'in_progress', 'completed', 'cancelled'], default: 'requested' },
    fare: { type: Number },
    duration: { type: Number },
    distance: { type: Number },
    paymentID:{
        type: String
    },
    orderID:{
        type: String
    },
    signature:{
        type: String
    },
}, { timestamps: true });

const Ride = mongoose.model('Ride', rideSchema);

module.exports = Ride;
