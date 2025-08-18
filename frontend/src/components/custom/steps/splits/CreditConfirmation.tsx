import React from "react";
import { useDispatch } from "react-redux";
import { startProcessing } from "@/Redux/Processing/processingSlice";
import { AppDispatch } from "@/Redux/store";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
// import SettingsCredits from "../Credit";

interface CreditConfirmationProps {
  estimatedCredits: number;
  setShowConfirmation: (state: boolean) => void;
  setIsProcessing: (state: boolean) => void;
  sessionId: string;
  prompt: string;
  // userCredits: number;
  setActiveTab: (state: string) => void;
  setStep: (value: number) => void; 
}

const CreditConfirmation: React.FC<CreditConfirmationProps> = ({
  estimatedCredits,
  setShowConfirmation,
  setIsProcessing,
  sessionId,
  prompt,
  // userCredits,
  setActiveTab,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  // useEffect(() => {
  //   if (estimatedCredits > userCredits) {
  //     toast.error("Insufficient Tokens. Redirecting to Credits page...");
  //     setTimeout(() => {
  //       return <SettingsCredits />;
  //     }, 1500);
  //   }
  // }, [estimatedCredits, userCredits]);
  const confirmProcessing = () => {
    setShowConfirmation(false);
    dispatch(
      startProcessing({ sessionId, projectPrompt: prompt, estimatedCredits })
    )
      .unwrap()
      .then(() => {
        setIsProcessing(true);
        toast.success("Processing started");
      })
      .catch((err) => {
        setIsProcessing(false);
        if (err === "Insufficient tokens") {
          toast.error(err);
          setTimeout(() => {
            setActiveTab("Recharge");
          }, 1500);
        }
      });
  };

  // if (estimatedCredits > userCredits) {
  //   return null;
  // }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg flex flex-col gap-5">
        <p className="text-center">
          This operation requires {estimatedCredits.toFixed(0)} sproutTokens. <br />
          Do you want to Proceed?
        </p>
        <div className="flex justify-center gap-4">
          <Button
            className="bg-black text-white hover:bg-gray-500"
            onClick={() => setShowConfirmation(false)}
          >
            No
          </Button>
          <Button
            className="bg-[#423EC7] text-white hover:bg-black"
            onClick={confirmProcessing}
          >
            Proceed
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CreditConfirmation;
