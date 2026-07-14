export interface AIConfig {
  provider: 'openai' | 'gemini' | 'groq';
  key: string;
}

const fetchOpenAI = async (key: string, systemPrompt: string, userPrompt: string, baseUrl = 'https://api.openai.com/v1'): Promise<string> => {
  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
  });

  if (!res.ok) throw new Error(`OpenAI API failed: ${res.statusText}`);
  const data = await res.json();
  return data.choices[0].message.content;
};

const fetchGroq = async (key: string, systemPrompt: string, userPrompt: string): Promise<string> => {
  return fetchOpenAI(key, systemPrompt, userPrompt, 'https://api.groq.com/openai/v1');
};

const fetchGemini = async (key: string, systemPrompt: string, userPrompt: string): Promise<string> => {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      system_instruction: {
        parts: { text: systemPrompt }
      },
      contents: [{
        parts: [{ text: userPrompt }]
      }]
    })
  });

  if (!res.ok) throw new Error(`Gemini API failed: ${res.statusText}`);
  const data = await res.json();
  return data.candidates[0].content.parts[0].text;
};

export const queryAI = async (configs: AIConfig[], systemPrompt: string, userPrompt: string): Promise<string> => {
  let lastError: Error | null = null;

  for (const config of configs) {
    try {
      if (config.provider === 'openai') {
        return await fetchOpenAI(config.key, systemPrompt, userPrompt);
      } else if (config.provider === 'groq') {
        return await fetchGroq(config.key, systemPrompt, userPrompt);
      } else if (config.provider === 'gemini') {
        return await fetchGemini(config.key, systemPrompt, userPrompt);
      }
    } catch (e: any) {
      console.warn(`AI Engine: Provider ${config.provider} failed. Trying next...`, e);
      lastError = e;
      continue;
    }
  }

  if (lastError) {
    throw lastError;
  }

  throw new Error('No valid AI configurations found.');
};
