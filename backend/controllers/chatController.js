import { askGemini } from "../services/geminiService.js";

export const chat = async (req, res) => {
  try {
    const { country, question } = req.body;

    const prompt = `
Current country: ${country}

Question:
${question}
`;

    const response = await askGemini(prompt);

    res.json({
      answer: response
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};