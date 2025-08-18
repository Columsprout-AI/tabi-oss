"use client";

import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { initiateIngestion } from "@/Redux/Ingestion/ingestionSlice";
import { AppDispatch } from "@/Redux/store";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Spinner } from "../Loader";

interface FieldProps {
  columns: string[];
  fileName: string;
  sessionId: string;
  setStep: (value: number) => void;
  onSelectColumn: (column: string) => void;
  // setIsLoading: (state: boolean) => void;
  // isLoading: boolean;
}

const Field: React.FC<FieldProps> = ({
  columns,
  fileName,
  sessionId,
  onSelectColumn,
  setStep,
  // setIsLoading,
  // isLoading,
}) => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(false);

  // Polling function to check ingestion status
  const waitForBackendUpdate = async (sessionId: string) => {
    try {
      while (true) {
        const response = await fetch(
          `/api/ingestion-update?sessionId=${sessionId}`,
          {
            cache: "no-store",
          }
        );
        const result = await response.json();

        if (result?.data?.message === "Ingestion completed") {
          toast.success("Ingestion completed!");
          setIsLoading(false);

          return;
        }
        // Wait for 2 seconds before checking again
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    } catch (error) {
      console.error("Error fetching ingestion update:", error);
      toast.error("Error checking ingestion status");
      setIsLoading(false);
      router.push("/");
    }
  };

  // Handle field selection
  const handleSelect = async (value: string) => {
    if (!value) return;
    onSelectColumn(value);
    setIsLoading(true);
    toast.success("Ingestion started");

    try {
      // Start ingestion
      await dispatch(
        initiateIngestion({ sessionId, inputColumn: value })
      ).unwrap();
      // Start polling for ingestion status
      await waitForBackendUpdate(sessionId);
      await new Promise((resolve) => setTimeout(resolve, 3000)); //for time delay after ingestion
      setStep(2);
    } catch (error) {
      console.error("Ingestion Failed:", error);
      toast.error("Ingestion failed");
      setIsLoading(false);
      router.push("/");
    }
  };

  const filteredColumns = columns
    .map((col) => col.trim())
    .filter((col) => col !== "");

  return (
    <Card className="w-full p-6 shadow-lg border border-gray-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-gray-800">
          Select a Field
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-2">
          File: <strong className="text-gray-800">{fileName}</strong>
        </p>

        {filteredColumns.length === 0 ? (
          <p className="text-red-600 text-sm font-medium mt-2">
            No headers detected. Please check your file! Reload page to upload
            again
          </p>
        ) : (
          <>
            <Label className="text-sm font-medium text-gray-700">
              Select a column
            </Label>
            {isLoading ? (
              <div className="flex justify-center items-center h-32">
                <Spinner />
              </div>
            ) : (
              <Select onValueChange={handleSelect}>
                <SelectTrigger className="w-full mt-2 rounded-md">
                  <SelectValue placeholder="Select a column" />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  {filteredColumns.map((col, index) => (
                    <SelectItem key={index} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default Field;
