import React, { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

export function BookingForm({ listingId, amount }: { listingId: string; amount: number; }) {
  return <Elements stripe={stripePromise}><InnerForm listingId={listingId} amount={amount} /></Elements>;
}

function InnerForm({ listingId, amount }: any) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: "Bearer " + localStorage.getItem("token") },
      body: JSON.stringify({ listingId, amount }),
    });
    const data = await res.json();
    const result = await stripe!.confirmCardPayment(data.clientSecret, {
      payment_method: { card: elements!.getElement(CardElement) as any },
    });
    if (result.error) {
      alert("Payment failed: " + result.error.message);
    } else if (result.paymentIntent && result.paymentIntent.status === "requires_capture") {
      // authorized — waiting for renter to capture
      alert("Payment authorized. Waiting for renter confirmation.");
    }
    setLoading(false);
  }
  return (
    <form onSubmit={handleSubmit}>
      <CardElement />
      <button disabled={!stripe || loading}>Book & Authorize</button>
    </form>
  );
}