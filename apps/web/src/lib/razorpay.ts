type Handler = (r: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;

export function openRazorpay(opts: {
  orderId: string;
  amount: number;
  name?: string;
  email?: string;
  contact?: string;
  onSuccess: Handler;
  onDismiss?: () => void;
  onFailed?: (reason: string) => void;
}) {
  const key = import.meta.env.VITE_RAZORPAY_KEY_ID;
  const RZP = (window as any).Razorpay;
  // Dev/stub mode: no key or SDK → succeed immediately so the flow stays demoable.
  if (!key || !RZP || opts.orderId.startsWith("order_stub_")) {
    opts.onSuccess({ razorpay_order_id: opts.orderId, razorpay_payment_id: "pay_stub", razorpay_signature: "stub" });
    return;
  }
  const rzp = new RZP({
    key,
    order_id: opts.orderId,
    amount: opts.amount * 100,
    currency: "INR",
    name: "Baxparrow",
    description: "Order payment",
    prefill: { name: opts.name, email: opts.email, contact: opts.contact },
    theme: { color: "#A94D28" },
    handler: opts.onSuccess,
    modal: { ondismiss: opts.onDismiss },
  });
  rzp.on("payment.failed", (response: { error?: { description?: string; reason?: string } }) => {
    const reason = response?.error?.description ?? response?.error?.reason ?? "Payment failed";
    opts.onFailed?.(reason);
  });
  rzp.open();
}
