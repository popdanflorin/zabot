import { supabase } from './supabaseClient';

export const generateChatResponse = async (messages, situationContext) => {
  try {
    const { data, error } = await supabase.functions.invoke('chat-completion', {
      body: {
        messages,
        situationContext
      }
    });

    if (error) throw error;
    return data.response || "I apologize, but I couldn't generate a response.";
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw new Error('Failed to generate response. Please try again.');
  }
};

export const generateMonitoring = async (messages, situationContext) => {
  try {
    const { data, error } = await supabase.functions.invoke('chat-monitoring', {
      body: {
        messages,
        situationContext
      }
    });

    if (error) throw error;
    return data.response || "I apologize, but I couldn't generate a response.";
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw new Error('Failed to generate response. Please try again.');
  }
};

export const validateApiKey = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('chat-completion', {
      body: {
        messages: [{ role: "user", content: "test" }],
        situationContext: "Validation test"
      }
    });
    
    return !error;
  } catch (error) {
    console.error('API key validation error:', error);
    return false;
  }
}; 