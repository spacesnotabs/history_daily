import fetch from 'node-fetch';

const DEFAULT_MODEL = 'gemini-1.5-pro-latest';

function buildPrompt() {
  return `You are an expert historian tasked with selecting a compelling fact or event for today's date.
Return ONLY valid JSON with the following shape:
{
  "title": string,
  "eventDate": string, // ISO-8601 date for the historical event
  "summary": string, // engaging summary, <= 1000 words
  "whyItMatters": string,
  "media": [
    {
      "type": "image" | "video",
      "url": string,
      "caption": string
    }
  ],
  "sources": [
    {
      "title": string,
      "url": string,
      "description": string
    }
  ],
  "books": [
    {
      "title": string,
      "author": string,
      "amazonUrl": string,
      "description": string
    }
  ]
}
Guidance:
- Search for an interesting historical fact or event that occurred on today's month and day within the last several hundred years.
- Consider significant events, notable births or deaths, technological inventions, groundbreaking discoveries, or pivotal cultural moments.
- Ensure the summary is lively, precise, and contains no more than approximately 1000 words.
- Provide at least two reputable sources with descriptive context.
- Gather at least one relevant media link (image or video) with a brief caption.
- Provide at least two related books and include valid Amazon product URLs.
- All URLs must be HTTPS.
- Do not include any markdown or commentary outside the JSON.`;
}

export async function fetchHistoricalFact({
  apiKey,
  model = DEFAULT_MODEL,
}) {
  if (!apiKey) {
    throw new Error('Missing Gemini API key. Set GEMINI_API_KEY.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const prompt = buildPrompt();

  const response = await fetch(endpoint + `?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Gemini API request failed: ${response.status} ${response.statusText} - ${errorBody}`);
  }

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini API response missing text content.');
  }

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error('Failed to parse Gemini JSON response: ' + error.message);
  }
}
