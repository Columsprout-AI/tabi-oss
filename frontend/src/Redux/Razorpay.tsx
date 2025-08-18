/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";

export default function PaymentPage() {
  useEffect(() => {
    const loadRazorpay = () => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.async = true;
      document.body.appendChild(script);
    };
    loadRazorpay();
  }, []);

  const handlePayment = () => {
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY,
      amount: 1,
      currency: "INR",
      name: "Your Company",
      description: "Payment for product",
      image: "/logo.png",
      handler: function (response: any) {
        alert("Payment Successful: " + response.razorpay_payment_id);
      },
      prefill: {
        name: "User Name",
        email: "user@example.com",
        contact: "9999999999",
      },
      theme: {
        color: "#3399cc",
      },
    };

    const razorpay = new (window as any).Razorpay(options);
    razorpay.open();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Buy a Product</h2>
      <button
        onClick={handlePayment}
        className="px-6 py-3 bg-[#423EC7] text-white rounded-lg"
      >
        Pay ₹1
      </button>
    </div>
  );
}
