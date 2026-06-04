import { reverseGeocode } from "../services/geocodingService.js";

export const getLocation = async (req, res) => {
  try {
    console.log("Request Body:", req.body);

    const { latitude, longitude } = req.body;

    const data = await reverseGeocode(latitude, longitude);

    console.log("Location Data:", data);

    res.json(data);
  } catch (error) {
    console.error("Location Error:", error);

    res.status(500).json({
      error: error.message
    });
  }
};