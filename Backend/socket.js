const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const userModel = require("./models/user.model");
const captainModel = require("./models/captain.model");
const rideModel = require("./models/ride.model");

let io;

function parseCookie(cookieHeader = "") {
  return cookieHeader.split(";").reduce((acc, pair) => {
    const [rawKey, ...rawValue] = pair.trim().split("=");
    if (!rawKey) {
      return acc;
    }

    acc[rawKey] = decodeURIComponent(rawValue.join("=") || "");
    return acc;
  }, {});
}

async function identifySocket(socket) {
  const authToken = socket.handshake.auth?.token;
  const cookieToken = parseCookie(socket.handshake.headers.cookie || "").token;
  const token = authToken || cookieToken;

  if (!token) {
    throw new Error("Unauthorized");
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded._id || decoded.id;

  const user = await userModel.findById(userId);
  if (user) {
    return { role: "user", profile: user };
  }

  const captain = await captainModel.findById(userId);
  if (captain) {
    return { role: "captain", profile: captain };
  }

  throw new Error("Unauthorized");
}

function attachSocket(server) {
  io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const identity = await identifySocket(socket);
      socket.data.identity = identity;
      next();
    } catch (error) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket) => {
    const { role, profile } = socket.data.identity;

    socket.join(`${role}:${profile._id}`);
    if (role === "captain" && profile.verhicle?.vehicleType) {
      socket.join(`vehicle:${profile.verhicle.vehicleType}`);
    }

    const activeRideQuery =
      role === "user"
        ? { userId: profile._id, status: { $in: ["requested", "accepted", "in_progress"] } }
        : { captainId: profile._id, status: { $in: ["accepted", "in_progress"] } };

    const activeRides = await rideModel.find(activeRideQuery);
    activeRides.forEach((ride) => socket.join(`ride:${ride._id}`));

    socket.on("ride:captain-location", async (payload = {}, ack) => {
      try {
        if (role !== "captain") {
          throw new Error("Only captains can share location");
        }

        const { latitude, longitude } = payload;
        if (
          typeof latitude !== "number" ||
          typeof longitude !== "number" ||
          Number.isNaN(latitude) ||
          Number.isNaN(longitude)
        ) {
          throw new Error("Invalid coordinates");
        }

        await captainModel.findByIdAndUpdate(profile._id, {
          location: { latitude, longitude },
        });

        const rides = await rideModel.find({
          captainId: profile._id,
          status: { $in: ["accepted", "in_progress"] },
        });

        rides.forEach((ride) => {
          io.to(`ride:${ride._id}`).emit("ride:captain-location", {
            rideId: String(ride._id),
            captainId: String(profile._id),
            latitude,
            longitude,
          });
        });

        if (typeof ack === "function") {
          ack({ ok: true });
        }
      } catch (error) {
        if (typeof ack === "function") {
          ack({ ok: false, message: error.message });
        }
      }
    });

    socket.on("ride:join", async ({ rideId } = {}, ack) => {
      try {
        if (!rideId) {
          throw new Error("Ride id is required");
        }

        socket.join(`ride:${rideId}`);
        if (typeof ack === "function") {
          ack({ ok: true });
        }
      } catch (error) {
        if (typeof ack === "function") {
          ack({ ok: false, message: error.message });
        }
      }
    });

    socket.on("disconnect", () => {
      // Socket room cleanup is automatic.
    });
  });

  return io;
}

function getIO() {
  if (!io) {
    throw new Error("Socket server not initialized");
  }

  return io;
}

module.exports = {
  attachSocket,
  getIO,
};
