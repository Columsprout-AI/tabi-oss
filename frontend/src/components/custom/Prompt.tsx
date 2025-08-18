"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { FiCopy } from "react-icons/fi";
// 1) Import toast
import { toast } from "react-hot-toast";

export default function PromptSelector() {
  const [prompts] = useState([
    {
      title: "Generate product grammage",
      prompt: "Suggest grammage details for a product.",
    },
    {
      title: "Generate short product description",
      prompt: "Write a concise product description.",
    },
    {
      title: "Generate creative product title",
      prompt: "Create an engaging product title.",
    },
    {
      title: "Create promotional tagline",
      prompt: "Write a catchy promotional tagline.",
    },
    {
      title: "Write product usage instructions",
      prompt: "Provide clear usage instructions for a product.",
    },
    {
      title: "Generate product benefits list",
      prompt: "List key benefits of using this product.",
    },
    // ... etc.
  ]);

  // 2) Replace alert with toast.success
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Prompt copied to clipboard!");
  };

  return (
    <div className="min-h-screen p-2">
      <h1 className="text-2xl font-semibold mb-10">Prompts</h1>
      <h2 className="text-lg font-semibold mb-4">
        Select or create a prompt to continue
      </h2>

      <Card className="p-4 border rounded-lg shadow-md overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-100">
              <TableHead className="font-semibold">Title</TableHead>
              <TableHead className="font-semibold">Prompt</TableHead>
              <TableHead className="text-center font-semibold">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {prompts.map((item, index) => (
              <TableRow key={index} className="hover:bg-gray-50">
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell className="text-gray-700">{item.prompt}</TableCell>
                <TableCell className="text-center flex justify-center">
                  <Button
                    onClick={() => handleCopy(item.prompt)}
                    className="flex items-center justify-center gap-2 bg-gray-100 text-black hover:bg-gray-200"
                  >
                    <FiCopy /> Copy
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
