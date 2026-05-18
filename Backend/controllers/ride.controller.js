const crypto = require("crypto");
const rideModel = require("../models/ride.model");
const { getIO } = require("../socket");

async function getDistanceTime(origin, destination) {
    if (!origin || !destination) {
        throw new Error("Origin and destination are required");
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
        throw new Error("Google Maps API key is not configured");
    }

    const response = await fetch(
        `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`
    );
    const data = await response.json();

    if (data.status !== "OK" || !data.rows?.length || !data.rows[0]?.elements?.length) {
        throw new Error(data.error_message || `Unable to calculate distance (${data.status})`);
    }

    const element = data.rows[0].elements[0];
    if (element.status !== "OK") {
        throw new Error(`Unable to calculate distance (${element.status})`);
    }

    return {
        distance: element.distance,
        duration: element.duration,
    };
}

async function getFare(pickupLocation, dropoffLocation) {
    if (!pickupLocation || !dropoffLocation) {
        throw new Error("Pickup and destination are required");
    }

    const distanceTime = await getDistanceTime(pickupLocation, dropoffLocation);
    const distanceInKm = distanceTime.distance.value / 1000;
    const durationInMinutes = distanceTime.duration.value / 60;

    const baseFare = {
        car: 50,
        motorcycle: 20,
        van: 80,
    };

    const perKmRate = {
        car: 15,
        motorcycle: 8,
        van: 20,
    };

    const perMinuteRate = {
        car: 3,
        motorcycle: 1.5,
        van: 4,
    };

    return {
        car: Math.round(baseFare.car + distanceInKm * perKmRate.car + durationInMinutes * perMinuteRate.car),
        motorcycle: Math.round(
            baseFare.motorcycle +
                distanceInKm * perKmRate.motorcycle +
                durationInMinutes * perMinuteRate.motorcycle
        ),
        van: Math.round(baseFare.van + distanceInKm * perKmRate.van + durationInMinutes * perMinuteRate.van),
    };
}

function getOtp(length = 6) {
    return crypto.randomInt(Math.pow(10, length - 1), Math.pow(10, length)).toString();
}

module.exports.createRide = async (req, res, next) => {
    try {
        const { pickupLocation, dropoffLocation, vehicleType } = req.body;
        const normalizedVehicleType = vehicleType?.toLowerCase();
        const fareMap = await getFare(pickupLocation, dropoffLocation);

        if (!fareMap[normalizedVehicleType]) {
            return res.status(400).json({ message: "Invalid vehicle type" });
        }

        const ride = await rideModel.create({
            userId: req.user._id,
            pickupLocation,
            dropoffLocation,
            vehicleType: normalizedVehicleType,
            otp: getOtp(6),
            fare: fareMap[normalizedVehicleType],
            paymentStatus: "pending",
            status: "requested",
        });

        const responseRide = ride.toObject();
        getIO().to(`vehicle:${normalizedVehicleType}`).emit("ride:new", responseRide);
        res.status(201).json(responseRide);
    } catch (error) {
        next(error);
    }
};

module.exports.getRideFare = async (req, res, next) => {
    try {
        const { pickupLocation, dropoffLocation } = req.query;
        const fare = await getFare(pickupLocation, dropoffLocation);
        res.json(fare);
    } catch (error) {
        next(error);
    }
};

module.exports.confirmRide = async (req, res, next) => {
    try {
        const rideId = req.body.rideId;
        const captainVehicleType = req.captain?.verhicle?.vehicleType;
        const existingRide = await rideModel.findById(rideId);

        if (!existingRide) {
            return res.status(404).json({ message: "Ride not found" });
        }

        if (existingRide.status !== "requested") {
            return res.status(400).json({ message: "Ride is no longer available" });
        }

        if (captainVehicleType && existingRide.vehicleType !== captainVehicleType) {
            return res.status(400).json({
                message: "This captain cannot accept a ride for a different vehicle type",
            });
        }

        const ride = await rideModel.findOneAndUpdate(
            { _id: rideId },
            {
                status: "accepted",
                captainId: req.captain._id,
            },
            { new: true }
        );
        if (!ride) {
            return res.status(404).json({ message: "Ride not found" });
        }
        const responseRide = ride.toObject();
        getIO().to(`ride:${ride._id}`).emit("ride:update", {
            rideId: String(ride._id),
            status: ride.status,
            captainId: String(ride.captainId),
        });
        res.json(responseRide);
    } catch (error) {
        next(error);
    }
};

module.exports.startRide = async (req, res, next) => {
    try {
        const { rideId, otp } = req.body;
        const ride = await rideModel.findOne({
            _id: rideId,
        }).select("+otp");

        if (!ride) {
            return res.status(404).json({ message: "Ride not found" });
        }

        if (ride.status !== "accepted") {
            return res.status(400).json({ message: "Ride not accepted" });
        }

        if (!ride.captainId || String(ride.captainId) !== String(req.captain._id)) {
            return res.status(403).json({ message: "You are not assigned to this ride" });
        }

        if (String(ride.otp) !== String(otp)) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        await rideModel.findOneAndUpdate(
            { _id: rideId },
            { status: "in_progress" }
        );

        const updatedRide = await rideModel.findOne({ _id: rideId }).populate("userId").populate("captainId").select("+otp");
        const responseRide = updatedRide.toObject();
        delete responseRide.otp;
        getIO().to(`ride:${rideId}`).emit("ride:update", {
            rideId: String(rideId),
            status: "in_progress",
            captainId: String(updatedRide.captainId?._id || updatedRide.captainId),
        });
        res.json(responseRide);
    } catch (error) {
        next(error);
    }
};

module.exports.endRide = async (req, res, next) => {
    try {
        const { rideId } = req.body;
        const ride = await rideModel.findOne({
            _id: rideId,
            captainId: req.captain._id,
        }).select("+otp");

        if (!ride) {
            return res.status(404).json({ message: "Ride not found" });
        }

        if (ride.status !== "in_progress") {
            return res.status(400).json({ message: "Ride not ongoing" });
        }

        await rideModel.findOneAndUpdate(
            { _id: rideId },
            { status: "completed" }
        );

        const updatedRide = await rideModel.findOne({ _id: rideId }).populate("userId").populate("captainId").select("+otp");
        const responseRide = updatedRide.toObject();
        delete responseRide.otp;
        getIO().to(`ride:${rideId}`).emit("ride:update", {
            rideId: String(rideId),
            status: "completed",
            captainId: String(updatedRide.captainId?._id || updatedRide.captainId),
        });
        res.json(responseRide);
    } catch (error) {
        next(error);
    }
};

module.exports.getCurrentUserRide = async (req, res, next) => {
    try {
        const ride = await rideModel
            .findOne({
                userId: req.user._id,
                status: { $in: ["requested", "accepted", "in_progress"] },
            })
            .sort({ createdAt: -1 })
            .populate("captainId")
            .select("+otp");

        if (!ride) {
            return res.json({ ride: null });
        }

        return res.json({ ride });
    } catch (error) {
        next(error);
    }
};

module.exports.getPendingCaptainRides = async (req, res, next) => {
    try {
        const vehicleType = req.captain?.verhicle?.vehicleType;
        const rides = await rideModel
            .find({
                status: "requested",
                vehicleType: vehicleType || { $in: ["car", "motorcycle", "van"] },
            })
            .sort({ createdAt: -1 })
            .populate("userId");

        res.json({ rides });
    } catch (error) {
        next(error);
    }
};

module.exports.getActiveCaptainRide = async (req, res, next) => {
    try {
        const ride = await rideModel
            .findOne({
                captainId: req.captain._id,
                status: { $in: ["accepted", "in_progress"] },
            })
            .sort({ createdAt: -1 })
            .populate("userId")
            .populate("captainId");

        return res.json({ ride: ride || null });
    } catch (error) {
        next(error);
    }
};
