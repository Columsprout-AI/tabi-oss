export const startProcessingAPI = async ({
  sessionId,
  projectPrompt,
  estimatedCredits,
}: {
  sessionId: string;
  projectPrompt: string;
  estimatedCredits: string;
}) => {
  console.log("📢 Mock API: Starting Processing...", {
    sessionId,
    projectPrompt,
    estimatedCredits,
  });

  return new Promise<{ message?: string; error?: string }>(
    (resolve, reject) =>
      setTimeout(() => {
        // Simulate a failure if estimatedCredits are too high (> 5)
        if (parseFloat(estimatedCredits) > 5) {
          console.log("❌ Mock API: Insufficient tokens!");
          reject({ error: "Insufficient tokens" });
        } else {
          console.log("✅ Mock API: Processing started successfully!");
          resolve({ message: "Processing started successfully" });
        }
      }, 1500) // Simulate 1.5 sec delay
  );
};
