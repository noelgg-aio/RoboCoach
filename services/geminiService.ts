import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message, ModelType } from '../types';
import { API_KEY, ROBOCOACH_SYSTEM_INSTRUCTION, CHAT_NAME_PROMPT_TEMPLATE, TEXT_MODEL_NAME, GEMINI_API_KEY_MISSING_ERROR, SERVER_OVERLOAD_ERROR_MESSAGE } from '../constants';

let ai: GoogleGenAI | null = null;

if (API_KEY) {
  ai = new GoogleGenAI({ apiKey: API_KEY });
} else {
  console.error(GEMINI_API_KEY_MISSING_ERROR);
}

export const generateChatName = async (firstUserMessage: string): Promise<string> => {
  if (!ai) return "Chat"; // Default if AI not initialized
  try {
    const prompt = CHAT_NAME_PROMPT_TEMPLATE(firstUserMessage);
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: TEXT_MODEL_NAME,
      contents: prompt,
    });
    return response.text.trim() || "Chat";
  } catch (error) {
    console.error("Error generating chat name:", error);
    if (error instanceof Error && 
        (error.message.includes('429') || 
         error.message.toLowerCase().includes('too many requests') ||
         error.message.toLowerCase().includes('rate limit exceeded') ||
         error.message.toLowerCase().includes('quota exceeded'))) {
      console.warn("Chat name generation failed due to server overload/rate limit.");
    }
    return "Chat"; // Fallback name
  }
};


const parseLuaCodeBlocks = (text: string): { textBefore?: string, code?: string, textAfter?: string } => {
  const codeBlockRegex = /```lua\s*([\s\S]*?)\s*```/s;
  const match = text.match(codeBlockRegex);

  if (match && match[1]) {
    const code = match[1].trim();
    const parts = text.split(match[0]); // Split by the full matched block
    const textBefore = parts[0] ? parts[0].trim() : undefined;
    const textAfter = parts[1] ? parts[1].trim() : undefined;
    return { textBefore, code, textAfter };
  }
  return { textBefore: text.trim() }; // No code block found
};


export const processUserPrompt = async (
  prompt: string,
  chatHistory: Message[]
): Promise<Message[]> => {
  if (!ai) {
    return [{
      id: Date.now().toString(),
      sender: 'ai',
      text: "RoboCoach's Servers are full, try again later please.",
      timestamp: Date.now(),
      isError: true,
    }];
  }

  const aiResponses: Message[] = [];
  const currentTimestamp = Date.now();

  try {
    // Standard text/code generation (and error analysis based on system prompt)
    const turnBasedContents = [
      ...chatHistory.map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'model',
          parts: [{ text: (msg.text || (msg.code ? `\`\`\`lua\n${msg.code}\n\`\`\`` : "")) || ""  }]
        })),
      { role: 'user', parts: [{ text: prompt }] }
    ];

    const response: GenerateContentResponse = await ai.models.generateContent({
      model: TEXT_MODEL_NAME,
      contents: turnBasedContents,
      config: {
        systemInstruction: ROBOCOACH_SYSTEM_INSTRUCTION
      }
    });
    
    const responseText = response.text.trim();
    const parsed = parseLuaCodeBlocks(responseText);

    if (parsed.textBefore) {
      aiResponses.push({
        id: `${currentTimestamp}-pretext`,
        sender: 'ai',
        text: parsed.textBefore,
        timestamp: currentTimestamp,
      });
    }
    if (parsed.code) {
        aiResponses.push({
        id: `${currentTimestamp}-code`,
        sender: 'ai',
        text: parsed.textBefore ? undefined : "Here's the Lua script:", // Add preamble if no textBefore
        code: parsed.code,
        timestamp: currentTimestamp + (parsed.textBefore ? 1 : 0),
      });
    }
    if (parsed.textAfter) {
        aiResponses.push({
        id: `${currentTimestamp}-posttext`,
        sender: 'ai',
        text: parsed.textAfter,
        timestamp: currentTimestamp + (parsed.textBefore ? 1 : 0) + (parsed.code ? 1 : 0),
      });
    }
    // If nothing parsed but there was responseText (e.g. AI just said "OK", or an error explanation)
    if (aiResponses.length === 0 && responseText) {
        aiResponses.push({
        id: `${currentTimestamp}-main`,
        sender: 'ai',
        text: responseText,
        timestamp: currentTimestamp,
      });
    }
    
  } catch (error) {
    console.error("Error processing prompt:", error);
    let errorMessage = "Sorry, I encountered an issue. Please try again."; // Default fallback
    if (error instanceof Error) {
        if (error.message.includes('429') || 
            error.message.toLowerCase().includes('too many requests') ||
            error.message.toLowerCase().includes('rate limit exceeded') ||
            error.message.toLowerCase().includes('quota exceeded')) {
            errorMessage = SERVER_OVERLOAD_ERROR_MESSAGE;
        } else {
            errorMessage = `Error: ${error.message}. Please check your API key and network connection, or the API key may be invalid.`;
        }
    }
    aiResponses.push({
      id: `${currentTimestamp}-error`,
      sender: 'ai',
      text: errorMessage,
      timestamp: currentTimestamp,
      isError: true,
    });
  }
  
  if (aiResponses.length === 0 && API_KEY) { // Only add this if API_KEY was present but still no response generated
      aiResponses.push({
      id: `${currentTimestamp}-noresponse`,
      sender: 'ai',
      text: "I'm not sure how to respond to that. Could you try rephrasing?",
      timestamp: currentTimestamp,
      });
  }


  return aiResponses;
};