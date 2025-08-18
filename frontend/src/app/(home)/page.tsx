/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useEffect } from "react";
import { useAuth, useSession } from "@clerk/nextjs";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/custom/app-sidebar";
import { PageHeader } from "@/components/custom/Header";
import Upload from "@/components/custom/steps/Upload";
import Field from "@/components/custom/steps/Fields";
import Experiment from "@/components/custom/steps/Experiment";
import PromptSelector from "@/components/custom/Prompt";
import toast from "react-hot-toast";
import { Spinner } from "@/components/custom/Loader";
import SettingsCredits from "@/components/custom/steps/Credit";
import { useSelector } from "react-redux";
import { useRouter } from "next/navigation";
import { RootState } from "@/Redux/store";
import ResultsSummary from "@/components/custom/steps/Result";

const Home = () => {
  const userCredits = useSelector((state: RootState) => state.credits.value);
  console.log("User credit from home:", userCredits);

  const { session } = useSession();
  const sessionId = session?.id || "guest-session";

  const [step, setStep] = useState<number>(1);
  const [activeTab, setActiveTab] = useState("Project");
  const [selectedColumn, setSelectedColumn] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [backendData, setBackendData] = useState<any>(null);
  // const [isLoading, setIsLoading] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();

  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn) {
      toast.error("Please Login First");
      router.push("/sign-in");
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div>
        <Spinner />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar onTabChange={(tab) => setActiveTab(tab)} />
      <main className="w-full px-[16px] py-10">
        <SidebarTrigger />
        {activeTab === "Project" && (
          <>
            <PageHeader title="My Project" currentStep={step} />
            {step === 1 && (
              <div>
                {!headers.length ? (
                  <Upload
                    onUpload={(headers: string[]) => {
                      setHeaders(headers);
                      setBackendData(null);
                    }}
                    sessionId={sessionId}
                  />
                ) : !selectedColumn && headers.length > 0 ? (
                  <Field
                    columns={headers}
                    fileName="uploaded_data.csv"
                    sessionId={sessionId}
                    onSelectColumn={(column) => {
                      setSelectedColumn(column);
                      // setStep(2)
                    }}
                    setStep={setStep}
                    // setIsLoading={setIsLoading}
                    // isLoading={isLoading}
                  />
                ) : (
                  <div>
                    <Spinner />
                    {selectedColumn && headers.length > 0 && (
                      <div className="text-lg flex justify-center items-center">
                        GenAI-proofing your data...
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {step === 2 && (
              <Experiment
                selectedColumn={selectedColumn}
                sessionId={sessionId}
                backendData={backendData}
                setBackendData={setBackendData}
                userCredits={userCredits}
                setActiveTab={setActiveTab}
                setStep={setStep}
                step={step}
              />
            )}
            {step === 3 && (
              <ResultsSummary
                outputFilePath={backendData?.outputFilePath}
                sessionId={sessionId}
                processedCredits={backendData?.projectCredits}
              />
            )}
          </>
        )}
        {activeTab === "Prompt" && <PromptSelector />}
        {activeTab === "Recharge" && (
          <SettingsCredits 
            userCredits={userCredits}
            setActiveTab={setActiveTab} />
        )}
      </main>
    </SidebarProvider>
  );
};

export default Home;
