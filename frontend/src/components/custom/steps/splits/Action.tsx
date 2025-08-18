/* eslint-disable @typescript-eslint/no-explicit-any */
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/Redux/store";
import { startExperimentAction } from "@/Redux/Experiment/experimentSlice";
import { estimateCredits } from "@/Redux/Credits/creditSlice";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Spinner } from "../../Loader";
import { useEffect, useState } from "react";

interface ExperimentActionsProps {
  prompt: string;
  sessionId: string;
  setBackendData: (data: any) => void;
  setShowConfirmation: (state: boolean) => void;
  setEstimatedCredits: (credits: number) => void;
  setStep: (value: number) => void;
  setActiveTab: (state: string) => void;
  userCredits: number;
  onExperimentComplete?: () => void; 
}

const ExperimentActions: React.FC<ExperimentActionsProps> = ({
  prompt,
  sessionId,
  setBackendData,
  setShowConfirmation,
  setEstimatedCredits,
  setActiveTab,
  setStep,
  userCredits,
  onExperimentComplete,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const [experimentCompleted, setExperimentCompleted] = useState(false);
  const [isExp, setExp] = useState(false);
  const [promptforProceed, setPromptforProceed] = useState("");

  useEffect(() => {
    console.log(promptforProceed);
  }, [promptforProceed]);

  const handleRunExperiment = () => {
    if (!prompt.trim()) {
      toast.error("Prompt cannot be empty!");
      return;
    }

    if (userCredits < 1) {
       toast.error("Insufficient Credits. Redirecting to Credit Page...");
       setTimeout(() => setActiveTab("Recharge"), 3000);
       return;
     }
    
    const capturedPrompt = prompt;
    setPromptforProceed(capturedPrompt);
    setBackendData(null);
    setExp(true);
    setExperimentCompleted(false);

    dispatch(startExperimentAction({ sessionId, expPrompt: prompt }))
      .unwrap()
      .then(() => {
        toast.success("Experiment Complete!");
        setExperimentCompleted(true);
        setExp(false);
        setStep(2);
        
        // Call onExperimentComplete if provided
      if (onExperimentComplete) {
        onExperimentComplete();
      }
      })
      .catch((err: any) => {
        toast.error(err || "Failed to complete experiment");
        // Reload unconditionally after 3s
        setTimeout(() => {
          window.location.reload();
        }, 3000);
        setExp(false);
      });
      
  };

  const handleProceed = () => {
    dispatch(estimateCredits({ sessionId, projectPrompt: promptforProceed }))
      .unwrap()
      .then((response) => {
        setEstimatedCredits(response.creditEstimate);
        setShowConfirmation(true);
      })
      .catch(() => toast.error("Failed to estimate credits"));
  };

  if (isExp) {
    return (
      <div>
        <Spinner />
        <div className="text-lg flex justify-center items-center">
          Generating your prompt results...
        </div>
      </div>
    );
  }

  return (
    <>
      <Button
        onClick={handleRunExperiment}
        className="bg-black text-white hover:bg-[#423EC7]"
        disabled={isExp} 
      >
        Run Experiment
      </Button>
      <Button
        onClick={handleProceed}
        className="ml-4 bg-[#423EC7] text-white hover:bg-black"
        disabled={isExp || !experimentCompleted}
      >
        Proceed
      </Button>
    </>
  );
};

export default ExperimentActions;
