// Access keys for RoboCoach
// Add or remove keys by editing this array

// Array of valid access keys
export const validAccessKeys: string[] = [
  "RBC-EA-7f8a9d2e6c5b3a5",  // Example key 1
  "RBC-EA-3e4d5f6g7h8i9j0v",  // Example key 2
  "RBC-EA-2b3c4d5e6f7g8h9i",   // Example key 3
  "RBC-EA-1a2b3c4d5e6f7g8g",
  "RBC-EA-2434134sffw3242s"   // Your new key here
  // Add more keys here as needed
];

// Interface for storing key usage information
interface KeyUsage {
  key: string;
  userId: string;
  timestamp: number;
}

// Map to store keys that are currently in use with user identifiers
const activeKeyMap: Map<string, string> = new Map(); // key -> userId

// Function to generate a unique user ID based on browser fingerprint
const generateUserId = (): string => {
  // Create a simple fingerprint based on available browser information
  const userAgent = navigator.userAgent;
  const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const language = navigator.language;
  
  // Combine and hash the information
  const fingerprint = `${userAgent}-${screenInfo}-${timeZone}-${language}`;
  let hash = 0;
  for (let i = 0; i < fingerprint.length; i++) {
    const char = fingerprint.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return hash.toString(16); // Convert to hex string
};

// Get or create user ID
let userId = localStorage.getItem('robocoach-user-id');
if (!userId) {
  userId = generateUserId();
  localStorage.setItem('robocoach-user-id', userId);
}

// Function to check if a key is valid
export const isValidAccessKey = (keyToCheck: string): boolean => {
  return validAccessKeys.includes(keyToCheck);
};

// Function to check if a key is already in use by another user
export const isKeyInUse = (key: string): boolean => {
  const keyUserId = activeKeyMap.get(key);
  return keyUserId !== undefined && keyUserId !== userId;
};

// Function to mark a key as in use by current user
export const markKeyAsInUse = (key: string): void => {
  if (isValidAccessKey(key)) {
    activeKeyMap.set(key, userId!);
    // Save to localStorage to persist between page refreshes
    saveActiveKeysToStorage();
  }
};

// Function to release a key (when user logs out)
export const releaseKey = (key: string): void => {
  if (activeKeyMap.get(key) === userId) {
    activeKeyMap.delete(key);
    saveActiveKeysToStorage();
  }
};

// Helper function to save active keys to localStorage
const saveActiveKeysToStorage = (): void => {
  const keyUsages: KeyUsage[] = [];
  activeKeyMap.forEach((userId, key) => {
    keyUsages.push({
      key,
      userId,
      timestamp: Date.now()
    });
  });
  localStorage.setItem('robocoach-active-keys', JSON.stringify(keyUsages));
};

// Function to load active keys from localStorage
export const loadActiveKeysFromStorage = (): void => {
  const storedKeys = localStorage.getItem('robocoach-active-keys');
  if (storedKeys) {
    try {
      const keyUsages: KeyUsage[] = JSON.parse(storedKeys);
      activeKeyMap.clear();
      keyUsages.forEach(usage => {
        // Only load keys that are still valid
        if (isValidAccessKey(usage.key)) {
          activeKeyMap.set(usage.key, usage.userId);
        }
      });
    } catch (e) {
      console.error('Error loading active keys from storage:', e);
    }
  }
};

// Add a timestamp for when the keys were last updated
export const keysLastUpdated = Date.now();

// Function to check if a user's key is still valid
export const validateUserKey = (key: string): boolean => {
  // Check if the key is still in the valid keys list
  if (!isValidAccessKey(key)) {
    return false;
  }
  
  // Check if the key is being used by another user
  const keyUserId = activeKeyMap.get(key);
  if (keyUserId && keyUserId !== userId) {
    return false;
  }
  
  // If the key is valid but not marked as in use, mark it
  if (!keyUserId) {
    markKeyAsInUse(key);
  }
  
  return true;
};