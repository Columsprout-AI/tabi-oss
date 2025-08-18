import ResultsSummary from "@/components/custom/steps/Result";
import React from "react";

function page() {
  return (
    <div>
      <ResultsSummary
        sessionId={"test"}
        outputFilePath={"test"}
        processedCredits={20}
      />
    </div>
  );
}

export default page;
