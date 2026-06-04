import { askGemini } from "../services/geminiService.js";

export const compareCountries = async (
  req,
  res
) => {
  try {
    const { country1, country2 } = req.body;

    const prompt = `
Compare traffic laws between
${country1}
and
${country2}

Include:
- driving side
- speed limits
- helmet laws
- seat belts
- mobile phone usage
- DUI limits
`;

    const result = await askGemini(prompt);

    res.json({
      comparison: result
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};