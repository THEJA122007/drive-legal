import { askGemini } from "../services/geminiService.js";

export const countryInfo = async (req, res) => {
  try {
    const { country, city, state } = req.body;

    const locationContext = [city, state, country].filter(Boolean).join(", ");

    const result = await askGemini(
      `Provide a traffic-law overview for someone currently in: ${locationContext}.
      
      Structure your response as follows:
      1. Start with a brief note about the specific location (${locationContext}) if there are any local rules, city-specific regulations, or state/province-level variations that differ from national rules.
      2. Then cover the national traffic laws for ${country}:
         - Driving side
         - Speed limits (urban, highway)
         - Alcohol/BAC limits
         - Helmet and seat belt laws
         - Mobile phone laws
         - Required documents
         - Any notable local enforcement trends in ${city || country}
      
      Keep it practical and actionable.`
    );

    res.json({ country, city, state, info: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};