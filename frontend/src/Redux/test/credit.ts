import { EstimateCreditsResponse } from "../Credits/types";

// Mock API to simulate backend responses for testing
export const startExperiment = async ({
  sessionId,
  expPrompt,
}: {
  sessionId: string;
  expPrompt: string;
}): Promise<EstimateCreditsResponse> => {
  console.log("📢 Mock API Triggered: startExperiment", {
    sessionId,
    expPrompt,
  });

  return new Promise((resolve) =>
    setTimeout(() => {
      console.log("✅ Mock API Response: Experiment completed successfully!");

      resolve({
        creditEstimate: 1.8945,
        message: "dummy",
      });
    }, 1500)
  );
};

export const estimateCreditsAPI = async ({
  sessionId,
  projectPrompt,
}: {
  sessionId: string;
  projectPrompt: string;
}): Promise<{ estimatedCredits: string }> => {
  console.log("📢 Mock API Triggered: estimateCredits", {
    sessionId,
    projectPrompt,
  });

  return new Promise(
    (resolve) =>
      setTimeout(() => {
        console.log("✅ Mock API Response: Estimated credits received!");

        resolve({
          estimatedCredits: (Math.random() * 2).toFixed(4), // Random credits for testing
        });
      }, 1000) // Simulate network delay (1 second)
  );
};
