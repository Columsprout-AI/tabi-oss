import { Button } from "@/components/ui/button";
import { ProgressBar } from "./ProgressBar";
import { useSelector } from "react-redux";
import { RootState } from "@/Redux/store";
import { FaRegQuestionCircle } from "react-icons/fa";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PageHeaderProps {
  title: string;
  currentStep: number;
}

export function PageHeader({ title, currentStep }: PageHeaderProps) {
  const credits = useSelector((state: RootState) => state.credits.value);
  console.log("SproutTokens: ", credits);

  return (
    <div className="w-full mb-8 bg-white">
      <div className="flex justify-between items-center mb-6 text-black">
        <h1 className="text-2xl font-semibold">{title}</h1>
        <div className="flex items-center gap-4">
          {credits !== undefined && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">SproutTokens:</span>
              <span className="font-medium">{Number(credits ?? 0).toFixed(0)}</span>
            </div>
          )}
          <Tooltip>
            <TooltipTrigger
              asChild
              className="border-none shadow-none text-gray-500 "
            >
              <Button>
                <FaRegQuestionCircle />
              </Button>
            </TooltipTrigger>
            <TooltipContent className="bg-[#423EC7] text-white w-60 mr-5">
              <p>
                Low on SproutTokens?
                Visit &apos;Recharge&apos; in the sidebar to top up.
              </p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>
      <ProgressBar currentStep={currentStep} />
    </div>
  );
}
