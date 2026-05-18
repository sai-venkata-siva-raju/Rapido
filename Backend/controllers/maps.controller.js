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
