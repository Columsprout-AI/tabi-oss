/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */

"use client";

import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/Redux/store";
import useBackendPolling from "@/hooks/useBackendPolling";
import PromptInput from "./splits/PromptInput";
import ExperimentActions from "./splits/Action";
import CreditConfirmation from "./splits/CreditConfirmation";
import ExperimentResults from "./splits/ExperimentResults";
import ResultsSummary from "./Result"; // Download/Results page
import { Spinner } from "../Loader";

interface ExperimentProps {
  selectedColumn: string;
  sessionId: string;
  backendData: any;
  setBackendData: (data: any) => void;
  setActiveTab: (data: any) => void;
  userCredits: number;
  setStep: (value: number) => void;
  step: number;
}

const Experiment: React.FC<ExperimentProps> = ({
  selectedColumn,
  sessionId,
  backendData,
  setBackendData,
  userCredits,
  setActiveTab,
  setStep,
  step,
}) => {
  // Access experiment response data from Redux
  const { responseData, error } = useSelector(
    (state: RootState) => state.experiment
  );

  // Local states
  const [prompt, setPrompt] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [estimatedCredits, setEstimatedCredits] = useState(0);
  const [userFeedback, setUserFeedback] = useState<"like" | "dislike" | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Track if the user has run at least one experiment
  const [hasRunExperiment, setHasRunExperiment] = useState(false);

  // Poll for backend processing updates
  useBackendPolling(sessionId, isProcessing, setBackendData, setIsProcessing);

  // Auto-transition to step 3 when in step 2 and outputFilePath is available
  useEffect(() => {
    if (step === 2 && backendData?.outputFilePath) {
      console.log("Output file available; transitioning to step 3.");
      setStep(3);
    }
  }, [step, backendData, setStep]);

  if (isProcessing) {
    return (
      <div>
        <Spinner />
        <div className="text-lg flex justify-center items-center">
          Processing with Gen AI. This may take a moment...
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white shadow-md rounded-lg flex flex-col gap-10">
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Experiment with Prompt
        </h2>
        <p className="mb-2 text-gray-700">
          Selected Input Column: <strong>{selectedColumn}</strong>
        </p>

        {/* Prompt Input and Experiment Actions */}
        <PromptInput prompt={prompt} setPrompt={setPrompt} />
        <ExperimentActions
          prompt={prompt}
          sessionId={sessionId}
          setBackendData={(data) => {
            // Overwrite old data with new
            setBackendData(null);
            setBackendData(data);
          }}
          setShowConfirmation={setShowConfirmation}
          setEstimatedCredits={setEstimatedCredits}
          setActiveTab={setActiveTab}
          setStep={setStep} // Passed here if needed elsewhere
          userCredits={userCredits}
          onExperimentComplete={() => setHasRunExperiment(true)}
        />

        {/* Credit Confirmation Popup */}
        {showConfirmation && (
          <CreditConfirmation
            estimatedCredits={estimatedCredits}
            setShowConfirmation={setShowConfirmation}
            sessionId={sessionId}
            prompt={prompt}
            setActiveTab={setActiveTab}
            setIsProcessing={setIsProcessing}
            setStep={setStep} // Now passed but not used for immediate transition
          />
        )}
      </div>

      {/* Step 2: Display experiment results */}
      {step === 2 && (
        <>
          <ExperimentResults
            responseData={responseData}
            userFeedback={userFeedback}
            setUserFeedback={setUserFeedback}
            sessionId={sessionId}
          />
          {/*
            The bottom "Proceed" button has been removed.
            Transition to step 3 will be handled automatically once processing is complete.
          */}
        </>
      )}

      {/* Step 3: Results Summary / Download Page */}
      {step === 3 && (
        <ResultsSummary
          outputFilePath={backendData?.outputFilePath}
          sessionId={sessionId}
          processedCredits={backendData?.projectCredits || 0}
        />
      )}

      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
    </div>
  );
};

export default Experiment;
