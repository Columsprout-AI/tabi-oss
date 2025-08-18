/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
import { toast } from "react-hot-toast";

const useIngestionPolling = (
  sessionId: string,
  isIngestion: boolean,
  setIngestionBackendData: (data: any) => void,
  setIsIngestion: (state: boolean) => void
) => {
  useEffect(() => {
    if (!isIngestion) {
      console.log("Polling stopped, ingestion not in progress.");
      return;
    }

    console.log("Polling started for session:", sessionId);

    const fetchBackendUpdate = async () => {
      try {
        console.log("Fetching ingestion update from API...");

        const response = await fetch(
          `/api/ingestion-update?sessionId=${encodeURIComponent(sessionId)}`,
          { cache: "no-store" }
        );

        console.log("Response status:", response.status);

        const json = await response.json();
        console.log("Received data from polling API:", json);

        // json shape is { data: { message, fileId } | null }
        const payload = json?.data ?? null;

        // keep polling until BE sets { message: "Ingestion completed", fileId }
        if (!payload || payload.message !== "Ingestion completed") {
          console.log("Still processing, will retry...");
          return;
        }

        console.log("Ingestion completed:", payload);
        setIngestionBackendData(payload); // pass just {message, fileId}
        setIsIngestion(false);
        toast.success("Backend has completed ingestion!");
      } catch (error) {
        console.error("Error fetching ingestion update:", error);
      }
    };

    fetchBackendUpdate(); // fire immediately
    const interval = setInterval(fetchBackendUpdate, 1000);

    return () => {
      console.log("Cleaning up polling...");
      clearInterval(interval);
    };
  }, [isIngestion, sessionId, setIsIngestion, setIngestionBackendData]);
};

export default useIngestionPolling;
