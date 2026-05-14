const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const captainSchema = new mongoose.Schema({
    fullname: {
        firstname: { type: String, required: true , minlength: 3 },
        lastname: { type: String, minlength: 3 }
    },  
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String},
    socketid: { type: String },
    status: { type: String, enum: ['active', 'inactive'], default: 'inactive' },
    verhicle: { 
        color: { type: String,required:true },
        model: { type: String,required:true },
        licensePlate: { type: String },
        capicity: { type: Number, required: true, min: 1 },
        vehicleType: { type: String, enum: ['car', 'motorcycle', 'van'], required: true },
    },
    location: {
        latitude: { type: Number },
        longitude: { type: Number }
    }
}, { timestamps: true });

captainSchema.methods.hashPassword = async function(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
};

captainSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

captainSchema.methods.generateAuthToken = function() {
    const payload = { id: this._id, email: this.email };
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });
};

const captainModel = mongoose.model('Captain', captainSchema);

module.exports = captainModel;
