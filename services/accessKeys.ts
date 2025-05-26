// Access keys for RoboCoach
// Add or remove keys by editing this array

// Array of valid access keys
export const validAccessKeys: string[] = [
  "RBC-EA-7f8a9d2e6c5b3a5",  // Example key 1
  "RBC-EA-3e4d5f6g7h8i9j0v",  // Example key 2
  "RBC-EA-2b3c4d5e6f7g8h9i",   // Example key 3
  "RBC-EA-1a2b3c4d5e6f7g8g",
  "RBC-EA-2434134sffw3242f"   // Your new key here
  // Add more keys here as needed
];

// Function to check if a key is valid
export const isValidAccessKey = (keyToCheck: string): boolean => {
  return validAccessKeys.includes(keyToCheck);
};

// Add a timestamp for when the keys were last updated
export const keysLastUpdated = Date.now();