// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { setCredits } from "@/Redux/Credits/userCredit";
import { useEffect } from "react";
import { toast } from "react-hot-toast";
import { useDispatch } from "react-redux";

const useBackendPolling = (
  sessionId: string,
  isProcessing: boolean,
  setBackendData: (data: unknown) => void,
  setIsProcessing: (state: boolean) => void
) => {
  const dispatch = useDispatch();

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!isProcessing) return;

    console.log("Polling backend for updates...");

    const fetchBackendUpdate = async () => {
      try {
        console.log("Fetching process update from API...");

        const response = await fetch(`/api/process-update?sessionId=${sessionId}`, {
          cache: "no-store",
        });

        console.log("Response status:", response.status);
        if (!response.ok) {
          console.error("API Error:", response.status);
          return;
        }

        const data = await response.json();
        console.log("Received data from API:", data);

        if (data.message === "Processing...") {
          console.log("Processing still in progress. Retrying...");
          return; // Wait for the next interval
        }

        // ✅ Processing complete - Update state
        setBackendData(data);
        setIsProcessing(false);
        toast.success("Your Data is Processed!");
        dispatch(setCredits(data.userCredits));
      } catch (error) {
        console.error("Error fetching backend update:", error);
      }
    };

    const interval = setInterval(fetchBackendUpdate, 5000);
    return () => clearInterval(interval);
  }, [isProcessing, sessionId, setBackendData, setIsProcessing]);
};

export default useBackendPolling;
