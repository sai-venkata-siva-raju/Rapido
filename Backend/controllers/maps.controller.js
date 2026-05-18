module.exports.getAddressCordinates = async (req, res) => {
  const { address } = req.query;

  if (!address) {
    return res.status(400).json({ error: "Address query parameter is required" });
  }

  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: "Google Maps API key is not configured",
      });
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&components=country:IN&region=in&language=en&key=${apiKey}`
    );
    const data = await response.json();

    if (data.status === "OK" && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      res.json({ latitude: location.lat, longitude: location.lng });
    } else {
      res.status(404).json({
        error: "Address not found",
        googleStatus: data.status,
        googleErrorMessage: data.error_message,
        query: address,
      });
    }
  } catch (error) {
    console.error("Error fetching geocoding data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports.getDistanceAndTime = async (req, res) => {
    const { origin, destination } = req.query;


    if (!origin || !destination) {
        return res.status(400).json({ error: "Origin and destination query parameters are required" });
    }

    try {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            return res.status(500).json({
                error: "Google Maps API key is not configured",
            });
        }

        const response = await fetch(
            `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${encodeURIComponent(origin)}&destinations=${encodeURIComponent(destination)}&key=${apiKey}`
        );
        const data = await response.json();

        if (data.status === "OK" && data.rows.length > 0 && data.rows[0].elements.length > 0) {
            const element = data.rows[0].elements[0];
            if (element.status === "OK") {
                res.json({
                    distance: element.distance.text,
                    duration: element.duration.text,
                });
            } else {
                res.status(404).json({
                    error: "Route not found",
                    googleStatus: element.status,
                });
            }
        } else {
            res.status(404).json({
                error: "No routes found",
                googleStatus: data.status,
                googleErrorMessage: data.error_message,
                query: { origin, destination },
            });
        }
    } catch (error) {
        console.error("Error fetching distance matrix data:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

module.exports.getAddressSuggestions = async (req, res) => {
    const { address } = req.query;

    if (!address) {
        return res.status(400).json({ error: "Address query parameter is required" });
    }

    try {
        const apiKey = process.env.GOOGLE_MAPS_API_KEY;
        if (!apiKey) {
            return res.status(500).json({
                error: "Google Maps API key is not configured",
            });
        }

        const response = await fetch(
            `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(address)}&components=country:IN&region=in&language=en&key=${apiKey}`
        );
        const data = await response.json();

        if (data.status === "OK" && data.predictions.length > 0) {
            res.json({ suggestions: data.predictions });
        } else {
            res.status(404).json({
                error: "Address suggestions not found",
                googleStatus: data.status,
                googleErrorMessage: data.error_message,
                query: address,
            });
        }
    } catch (error) {
        console.error("Error fetching address suggestions:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
