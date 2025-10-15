// Removed unused import

export function VerifyBooking({ bookingId, paymentIntentId }: { bookingId: string; paymentIntentId: string; }) {
  async function capture() {
    const res = await fetch(`/api/bookings/${bookingId}/verify`, {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: "Bearer " + localStorage.getItem("token") },
      body: JSON.stringify({ paymentIntentId }),
    });
    const data = await res.json();
    if (data.ok) alert("Payment captured, booking confirmed");
    else alert("Error: " + JSON.stringify(data));
  }
  return <button onClick={capture}>Confirm & Capture Payment</button>;
}