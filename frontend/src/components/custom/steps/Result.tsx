"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
// import { FileText, Clock, Database } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/Redux/store"; // Adjust path based on store location
import { fetchRecordExport } from "@/Redux/Exports/exportSlice";
import Link from "next/link";

interface ResultsSummaryProps {
  sessionId: string;
  outputFilePath: string;
  processedCredits: number;
}

const ResultsSummary: React.FC<ResultsSummaryProps> = ({
  sessionId,
  outputFilePath,
  processedCredits,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const { loading, error } = useSelector(
    (state: RootState) => state.recordExport
  );

  useEffect(() => {
    if (error) {
      alert("Error exporting record: " + error);
    }
  }, [error]);

  const handleDownload = async () => {
    if (!outputFilePath) {
      alert("No file available for download.");
      return;
    }

    try {
      await dispatch(fetchRecordExport({ sessionId }));
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Credits Header and Box */}
      <div>
        <h2 className="text-lg font-semibold text-gray-800 mb-2">SproutTokens Used</h2>
        <div className="bg-[#ececff] rounded-md p-2 px-4 w-full">
          <p className="text-3xl font-bold text-[#423EC7]">{processedCredits}</p>
        </div>
      </div>
  
      {/* Grey Container */}
      <div className="flex flex-col gap-8 bg-gray-100 p-4 rounded-lg shadow-md justify-center items-center">
        <div className="flex flex-col gap-5 text-center">
          <div className="text-gray-700">
            SproutTokens were calculated based on rows processed and
            transformations applied. Have questions or need help?
            Just drop us a note at{" "}
            <a href="mailto:connect@columsprout.ai" className="text-[#423EC7] underline">
              connect@columsprout.ai
            </a>
            - happy to connect
          </div>
        </div>
  
        {outputFilePath && (
          <div className="flex items-center">
            <Link href={outputFilePath}>
              <Button
                className="bg-[#423EC7] text-white text-lg lg:rounded-[5px] lg:py-7 px-6 hover:bg-black"
                onClick={handleDownload}
                disabled={loading}
              >
                {loading ? "Processing..." : "Download CSV"}
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsSummary;
