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


interface ParsedBlock {
  type: 'text' | 'code';
  content: string;
}

const parseLuaCodeBlocks = (text: string): ParsedBlock[] => {
  const codeBlockRegex = /```lua\s*([\s\S]*?)\s*```/gs;
  const blocks: ParsedBlock[] = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Add text before this code block (if any)
    const textBefore = text.substring(lastIndex, match.index).trim();
    if (textBefore) {
      blocks.push({ type: 'text', content: textBefore });
    }
    
    // Add the code block
    blocks.push({ type: 'code', content: match[1].trim() });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add any remaining text after the last code block
  const textAfter = text.substring(lastIndex).trim();
  if (textAfter) {
    blocks.push({ type: 'text', content: textAfter });
  }
  
  // If no blocks were found, treat the entire text as a text block
  if (blocks.length === 0 && text.trim()) {
    blocks.push({ type: 'text', content: text.trim() });
  }
  
  return blocks;
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
    const parsedBlocks = parseLuaCodeBlocks(responseText);

    // Instead of creating multiple messages, combine them into one message
    let combinedText = "";
    let codeContent = "";
    
    // Process all blocks to extract code and combine text
    parsedBlocks.forEach((block) => {
      if (block.type === 'text') {
        combinedText += (combinedText ? "\n\n" : "") + block.content;
      } else if (block.type === 'code') {
        // Save the first code block we find
        if (!codeContent) {
          codeContent = block.content;
        } else {
          // If there are multiple code blocks, add them to the text with markdown formatting
          combinedText += (combinedText ? "\n\n" : "") + 
            "```lua\n" + block.content + "\n```";
        }
      }
    });
    
    // Create a single message with both text and code
    aiResponses.push({
      id: `${currentTimestamp}-combined`,
      sender: 'ai',
      text: combinedText || undefined,
      code: codeContent || undefined,
      timestamp: currentTimestamp,
    });
    
    // If nothing parsed but there was responseText
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