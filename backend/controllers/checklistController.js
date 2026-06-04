import { askGemini } from "../services/geminiService.js";

export const checklist = async (req, res) => {
  try {
    const { destination } = req.body;

    const prompt = `
Create a driving checklist for
${destination}

Include:
- documents
- insurance
- license
- safety requirements
`;

    const result = await askGemini(prompt);

    res.json({
      checklist: result
    });
  } catch (error) {
    res.status(500).json({
      error: error.message
    });
  }
};