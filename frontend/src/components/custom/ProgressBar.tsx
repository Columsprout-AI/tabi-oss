import { motion } from "framer-motion";

interface ProgressBarProps {
  currentStep: number;
}

const steps = [
  { label: "Upload", id: 1 },
  { label: "Experiment", id: 2 },
  { label: "Finalize", id: 3 },
];

export function ProgressBar({ currentStep }: ProgressBarProps) {
  const progressValue = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <div className="flex flex-col max-w-4xl mx-auto">
      <div className="relative flex justify-between items-center mb-4">
        {steps.map((step) => (
          <div key={step.id} className="flex flex-col items-center">
            <motion.div
              className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${
                currentStep >= step.id
                  ? "bg-[#423EC7] border-[#423EC7] text-white"
                  : "bg-gray-200 border-gray-400 text-gray-500"
              }`}
              initial={{ scale: 0.8 }}
              animate={{ scale: currentStep === step.id ? 1.2 : 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {step.id}
            </motion.div>
            <span
              className={`text-sm mt-2 ${
                currentStep >= step.id
                  ? "text-[#423EC7] font-semibold"
                  : "text-gray-500"
              }`}
            >
              {step.label}
            </span>
          </div>
        ))}
      </div>

      <div className="relative w-full h-2 bg-gray-200 rounded-md">
        <motion.div
          className="absolute top-0 left-0 h-2 bg-[#423EC7] rounded-md"
          style={{ width: `${progressValue}%` }}
          initial={{ width: 0 }}
          animate={{ width: `${progressValue}%` }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        />
      </div>
    </div>
  );
}
