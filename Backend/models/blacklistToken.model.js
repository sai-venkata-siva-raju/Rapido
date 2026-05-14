const mongoose = require('mongoose');

const blacklistTokenSchema = new mongoose.Schema(
    {
        token: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'user',
            required: true,
        },
        expiresAt: {
            type: Date,
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

blacklistTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const blacklistTokenModel = mongoose.model('blacklistToken', blacklistTokenSchema);

module.exports = blacklistTokenModel;
