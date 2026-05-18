const express = require('express');
const router = express.Router();
const { getAddressCordinates } = require('../controllers/maps.controller');
const { authUser } = require('../middleware/auth.middleware');
const {query, validationResult} = require('express-validator');

router.get(
    '/get-coordinates',
    authUser,
    query('address').not().isEmpty().withMessage('Address is required'),
    async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    try {
    await getAddressCordinates(req, res);
    } catch (error) {
        console.error("Error in /get-coordinates route:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

module.exports = router;
