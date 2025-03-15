import OpenAI from 'openai';

let openai = null;

// Initialize OpenAI with API key from environment variable
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// Initialize OpenAI instance
openai = new OpenAI({
  apiKey: OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

export const generateChatResponse = async (messages, situationContext) => {
  if (!openai) {
    throw new Error('OpenAI has not been initialized or API key is missing.');
  }

  try {
    const systemMessage = {
      role: "system",
      content: `You are a chatbot in a training scenario. Current situation context: ${situationContext}. 
                Respond naturally and appropriately to the user's messages while staying in character.
                Keep responses concise and relevant to the training scenario.
                Remember to maintain the emotional state described in the context.`
    };

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        systemMessage,
        ...messages.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.text
        }))
      ],
      temperature: 0.7,
      max_tokens: 150
    });

    return completion.choices[0]?.message?.content || "I apologize, but I couldn't generate a response.";
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw new Error('Failed to generate response. Please try again.');
  }
};

export const validateApiKey = async () => {
  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key is not set in environment variables.');
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: "test" }],
      max_tokens: 1
    });

    return true;
  } catch (error) {
    console.error('API key validation error:', error);
    return false;
  }
}; 