import { askGemini } from "../services/geminiService.js";

export const violationInfo = async (req, res) => {
  try {
    const { country, city, state, violation } = req.body;

    const locationContext = [city, state, country].filter(Boolean).join(", ");

    const result = await askGemini(`
Location: ${locationContext}
Violation: ${violation}

Explain the following for this specific location:

1. **The Law** — What does ${country}'s national law say about "${violation}"? Are there any stricter local rules in ${state || country} or ${city || country}?

2. **Penalties** — Fines, licence points, imprisonment, vehicle impoundment. Mention if penalties are higher in certain zones (school zones, highways, city centres).

3. **Local Enforcement** — How actively is this enforced in ${city || country}? Any known checkpoints or enforcement patterns worth knowing?

4. **How to Avoid It** — Practical tips specific to driving in ${locationContext}.

Include a legal disclaimer at the end.
`);

    res.json({ violation, details: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};