"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { loadRazorpayScript, openRazorpay } from "@/utils/razorpayUtils";
import {
  createOrder,
  failPayment,
  verifyPayment,
} from "@/Redux/Razorpay/index";
import { RootState, AppDispatch } from "@/Redux/store";
import { useAuth } from "@clerk/nextjs";
import toast from "react-hot-toast";
import { FaCheck } from "react-icons/fa";

interface CreditProps {
  userCredits?: number;
  setActiveTab: (data: any) => void;
}

interface CreditOption {
  id: string;
  packName: string;
  credits: number;
  benefits: string[];
  price: number;
}

const SettingsCredits: React.FC<CreditProps> = ({
  userCredits,
  setActiveTab,
}) => {
  const { userId, sessionId } = useAuth();
  const dispatch = useDispatch<AppDispatch>();
  const [selectedCredits, setSelectedCredits] = useState<string | null>(null);
  const { paymentStatus, error } = useSelector(
    (state: RootState) => state.razorpay
  );

  // Load Razorpay on mount
  useEffect(() => {
    loadRazorpayScript().then((loaded) => {
      if (!loaded) {
        console.error("Failed to load Razorpay SDK.");
      }
    });
  }, []);

  // Color strips for pack headings (optional)
  const headingBgColors = ["#6D64E1", "#423EC7", "#1E1560"];

  // Credit options
  const creditOptions: CreditOption[] = [
    {
      id: "starter",
      packName: "STARTER PACK",
      credits: 1000,
      benefits: [
        "Process ~2000 table rows",
        "Great for quick tests",
        "Ideal for solo users",
      ],
      price: 10,
    },
    {
      id: "growth",
      packName: "GROWTH PACK",
      credits: 2000,
      benefits: [
        "Process ~4000 table rows",
        "Great for daily tasks",
        "Made for small teams",
      ],
      price: 20,
    },
    {
      id: "pro",
      packName: "PRO PACK - Test Mode",
      credits: 100,
      benefits: [
        "Process ~10000 table rows",
        "Best for high-volume use",
        "Great for data teams",
      ],
      price: 1,
    },
  ];

  // Checkout function
  const handleCheckout = async () => {
    if (!selectedCredits) return;
    const selectedOption = creditOptions.find(
      (option) => option.id === selectedCredits
    );
    const amount = selectedOption ? selectedOption.price : 0;

    try {
      const orderResponse = await dispatch(
        createOrder({ amount, clerkId: userId || "" })
      ).unwrap();

      if (!orderResponse.order_id) {
        throw new Error("Order creation failed");
      }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
        amount: amount,
        currency: "INR",
        name: "Tabi AI",
        description: `Payment for ${selectedOption ? selectedOption.packName : ""}`,
        image: "/logo2.png",
        order_id: orderResponse.order_id,
        handler: async function (response: any) {
          try {
            await dispatch(
              verifyPayment({
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              })
            ).unwrap();
            toast.success("Payment Successful! Credits Updated.");
            setActiveTab("Project");
          } catch (err) {
            toast.error("Payment failed!");
            await dispatch(
              failPayment({ order_id: response.razorpay_order_id })
            );
          }
        },
        prefill: {
          name: "Columspro Inc",
          email: "connect@columsprout.ai",
          contact: "+91-9437970657",
        },
        theme: {
          color: "#3399cc",
        },
      };
      // Open Razorpay
      openRazorpay(options);
    } catch (error) {
      console.error("Payment Error:", error);
      alert("Failed to create order. Please try again.");
    }
  };

  return (
    <div className="min-h-screen p-4">
      {/* Title row: "Credits" left, user credits right */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Sprout Tokens</h1>
        <p className="text-right mr-4">
          Your SproutTokens:{" "}
          <span className="text-[#423EC7] font-bold ml-1">
            {Math.round(userCredits ?? 0)}
          </span>
        </p>
      </div>

      {/* Light Gray Info Box */}
      <div className="bg-gray-100 p-4 mb-8 rounded-md">
        <p className="mb-1">
          SproutTokens are calculated based on the volume of input and output processed.
        </p>
        <p>
          The final SproutToken usage also depends on the complexity and length of your request.
        </p>
      </div>

      {/* Payment Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 place-items-center">
        {creditOptions.map((option, index) => (
          <Card
            key={option.id}
            onClick={() => setSelectedCredits(option.id)}
            className={`relative w-[290px] rounded-[8px] border hover:shadow-lg cursor-pointer ${
              selectedCredits === option.id ? "border-blue-500" : "border-gray-300"
            }`}
          >
            {/* "Most Bought!" tag in the bottom right for the growth pack */}
            {option.id === "growth" && (
              <div
                className="
                  absolute
                  -bottom-6
                  right-1
                  bg-yellow-500
                  text-white
                  font-bold
                  text-xs
                  px-2
                  py-1
                  rounded-[8px]
                  shadow-lg
                  animate-pulse
                "
              >
                Most Bought!
              </div>
            )}

            {/* Full-width band for pack heading */}
            <div
              className="w-full py-2 text-center rounded-t-[8px]"
              style={{ backgroundColor: headingBgColors[index] }}
            >
              <h2
                className={`font-bold text-lg ${
                  // White text for middle/darker backgrounds
                  index === 0 || index === 1 || index === 2 ? "text-white" : "text-black"
                }`}
              >
                {option.packName}
              </h2>
            </div>

            {/* CardContent */}
            <div className="p-4">
              {/* Credits in primary color, left-aligned */}
              <p className="mt-2 text-[#423EC7] text-xl font-semibold text-left">
                {option.credits} SproutTokens
              </p>

              {/* Benefits with checkmark icons */}
              <CardContent className="mt-4 text-left px-0 pb-0">
                <ul className="space-y-2">
                  {option.benefits.map((benefit, idx) => (
                    <li key={idx} className="flex items-center text-sm text-gray-600">
                      <FaCheck className="text-green-600 mr-2" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </CardContent>

              {/* Extra space above the price */}
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  className="bg-[#D6CFB6] text-[#423EC7] text-xl font-bold px-6 py-2 rounded-[8px]"
                >
                  ${option.price}
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Checkout button */}
      <div className="text-center">
        <Button
          className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800"
          disabled={!selectedCredits || paymentStatus === "loading"}
          onClick={handleCheckout}
        >
          {paymentStatus === "loading" ? "Processing..." : "Checkout"}
        </Button>
      </div>

      {/* Error message */}
      {error && <p className="text-red-500 text-center mt-4">{error}</p>}
    </div>
  );
};

export default SettingsCredits;
