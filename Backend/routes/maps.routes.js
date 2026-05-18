const express = require('express');
const router = express.Router();
const {
    getAddressCordinates,
    getDistanceAndTime,
    getAddressSuggestions,
} = require('../controllers/maps.controller');
const { authUser } = require('../middleware/auth.middleware');
const { query, validationResult } = require('express-validator');

router.get(
    '/get-coordinates',
    authUser,
    query('address').not().isEmpty().withMessage('Address is required'),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        return getAddressCordinates(req, res, next);
    }
);

router.get(
    '/distance-time',
    authUser,
    query('origin').not().isEmpty().withMessage('Origin is required'),
    query('destination').not().isEmpty().withMessage('Destination is required'),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        return getDistanceAndTime(req, res, next);
    }
);

router.get(
    '/get-suggestions',
    authUser,
    query('address').not().isEmpty().withMessage('Address is required'),
    async (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        return getAddressSuggestions(req, res, next);
    }
);

module.exports = router;
