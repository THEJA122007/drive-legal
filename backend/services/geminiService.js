import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const SYSTEM_PROMPT = `
You are Drive Legal.

You help drivers understand traffic laws in:

- Bangladesh
- Bhutan
- Nepal
- Sri Lanka
- India
- Myanmar
- Thailand

Answer only traffic-law-related questions.

Always:
- Use user's country as context
- Keep answers practical
- Mention when laws may vary locally
- Include a legal-information disclaimer
`;

export async function askGemini(prompt) {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash"
  });

  const result = await model.generateContent(
    `${SYSTEM_PROMPT}\n\n${prompt}`
  );

  return result.response.text();
}