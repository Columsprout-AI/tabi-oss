/* eslint-disable @typescript-eslint/no-explicit-any */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const openRazorpay = (options: any) => {
  const razorpay = new (window as any).Razorpay(options);
  razorpay.open();
};
