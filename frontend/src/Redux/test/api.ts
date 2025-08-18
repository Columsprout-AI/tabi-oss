export const startExperiment = async ({
  sessionId,
  expPrompt,
}: {
  sessionId: string;
  expPrompt: string;
}): Promise<{
  message: string;
  parsedResponse: { outputData: string[] };
  inputData: string[];
  expCredits: string;
  userCredits: number;
}> => {
  console.log("📢 Mock API Triggered:", { sessionId, expPrompt });

  return new Promise(
    (resolve) =>
      setTimeout(() => {
        console.log("✅ Mock API Response: Experiment completed successfully!");

        resolve({
          message: "Experiment completed successfully.",
          parsedResponse: {
            outputData: [
              "Stunning Gel Polish",
              "Stunning Gel Polish",
              "Luxe Matte Lipstick",
              "Intense Matte Lipstick",
              "Kohl Eye Liner",
              "Matte Lip Liner",
              "Matte Lip Liner",
              "Intense Matte Lipstick",
              "Stunning Gel Polish",
              "Luxe Matte Lipstick",
            ],
          },
          inputData: [
            "Make your nails look stunning as you do with our Stunning Gel Nail Polish...",
            "Make your nails look stunning as you do with our Stunning Gel Nail Polish...",
            "Highly pigmented luxe matte lip color...",
            "Experience the power of intense color with our highly pigmented luxe matte lipsticks...",
            "This Kohl Eye Liner Pencil is formulated to provide vibrant color and long-lasting wear...",
            "Make your lips POP! Incredibly smooth, this matte lip liner enhances & defines lips...",
            "Make your lips POP! Incredibly smooth, this matte lip liner enhances & defines lips...",
            "Experience the power of intense color with our highly pigmented luxe matte lipsticks...",
            "Make your nails look stunning as you do with our Stunning Gel Nail Polish...",
            "Highly pigmented luxe matte lip color...",
          ],
          expCredits: "1.8945",
          userCredits: 8.1055,
        });
      }, 1500) // Simulate API delay (1.5 seconds)
  );
};
