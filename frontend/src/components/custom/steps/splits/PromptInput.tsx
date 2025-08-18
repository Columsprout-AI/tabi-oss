import React from "react";

interface PromptInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
}

const PromptInput: React.FC<PromptInputProps> = ({ prompt, setPrompt }) => {
  const maxLength = 500;

  return (
    <div className="mb-4">
      <textarea
        className="border p-2 w-full rounded resize-none"
        placeholder="Generate Short Product Name for Meta Ads"
        value={prompt}
        onChange={(e) => {
          if (e.target.value.length <= maxLength) {
            setPrompt(e.target.value);
          }
        }}
        rows={3}
        maxLength={maxLength}
      />
      <div className="text-right text-sm text-gray-500 mt-1">
        {prompt.length}/{maxLength} characters
      </div>
    </div>
  );
};

export default PromptInput;
