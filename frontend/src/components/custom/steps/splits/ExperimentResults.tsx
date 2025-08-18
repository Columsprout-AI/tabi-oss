/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { useDispatch } from "react-redux";
import { recordUserRemark } from "@/Redux/Remark/remarkSlice";
import { AppDispatch } from "@/Redux/store";
import { toast } from "react-hot-toast";

interface ExperimentResultsProps {
  responseData: any;
  userFeedback: "like" | "dislike" | null;
  setUserFeedback: (feedback: "like" | "dislike") => void;
  sessionId: string;
}

const ExperimentResults: React.FC<ExperimentResultsProps> = ({
  responseData,
  userFeedback,
  setUserFeedback,
  sessionId,
}) => {
  const dispatch = useDispatch<AppDispatch>();

  const handleFeedback = (remark: "like" | "dislike") => {
    setUserFeedback(remark);
    dispatch(recordUserRemark({ sessionId, userRemark: remark }))
      .unwrap()
      .then(() => toast.success(`Feedback recorded: ${remark.toUpperCase()}`))
      .catch((error: any) => toast.error(error));
  };

  if (!responseData) return null;

  // Normalize shapes
  const inputs: string[] = Array.isArray(responseData?.inputData)
    ? responseData.inputData
    : [];

  const outputs: string[] = Array.isArray(responseData?.parsedResponse?.outputData)
    ? responseData.parsedResponse.outputData
    : Array.isArray(responseData?.parsedResponse)
      ? responseData.parsedResponse
      : [];

  // Debug: see the actual shape in console
  console.log("ExperimentResults responseData:", responseData);

  return (
    <div className=" p-4 border rounded-lg">
      <h3 className="font-medium text-gray-800">Experiment Results</h3>
      {/* <p className="text-sm text-gray-600 mt-2">
        <strong>Experiment Cost:</strong> {responseData?.expCredits.toFixed()}{" "}
        credits
      </p> */}
      {/* <p className="text-sm text-gray-600">
        <strong>Remaining Credits:</strong>{" "}
        {responseData?.userCredits.toFixed(0)} credits
      </p> */}

      <table className="table-fixed w-full border border-gray-300">
        <colgroup>
          {/* Input column has a min width of 150px, max of 400px */}
          <col className="min-w-[150px] max-w-[400px]" />
          {/* Output column has a min width of 250px, max of 600px */}
          <col className="min-w-[250px] max-w-[600px]" />
        </colgroup>
        <thead>
          <tr className="bg-gray-100">
            <th className="border p-2">Input Data</th>
            <th className="border p-2">Output Data</th>
          </tr>
        </thead>
        <tbody>
          {inputs.map((input: string, idx: number) => {
            const output = outputs[idx] ?? "";
            const safeInput = typeof input === "string" ? input : String(input ?? "");
            return (
              <tr key={idx}>
                <td className="border p-2 break-words">
                  {safeInput.length > 600 ? safeInput.slice(0, 600) + "..." : safeInput}
                </td>
                <td className="border p-2 break-words">{output}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* User Feedback Section */}
      <div className="flex justify-center mt-4 gap-6">
        <ThumbsUp
          className={`cursor-pointer w-6 h-6 ${
            userFeedback === "like" ? "text-green-600" : "text-gray-400"
          }`}
          onClick={() => handleFeedback("like")}
        />
        <ThumbsDown
          className={`cursor-pointer w-6 h-6 ${
            userFeedback === "dislike" ? "text-red-600" : "text-gray-400"
          }`}
          onClick={() => handleFeedback("dislike")}
        />
      </div>
    </div>
  );
};

export default ExperimentResults;
