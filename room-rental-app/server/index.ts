import express from "express";
import http from "http";
import { Server as IOServer } from "socket.io";
import Stripe from "stripe";
import bodyParser from "body-parser";
import jwt from "jsonwebtoken";

const app = express();
const server = http.createServer(app);
const io = new IOServer(server, { cors: { origin: "*" } });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2025-09-30.clover" });

app.use(bodyParser.json());

// simple JWT middleware
function auth(req: any, res: any, next: any) {
  const h = req.headers.authorization?.split(" ")[1];
  if (!h) return res.status(401).send({ error: "missing token" });
  try {
    req.user = jwt.verify(h, process.env.JWT_SECRET || "dev");
    next();
  } catch (e) { return res.status(401).send({ error: "invalid token" }); }
}
function requireRole(role: string) {
  return (req: any, res: any, next: any) => {
    if (req.user?.role !== role && req.user?.role !== "admin") return res.status(403).send({ error: "forbidden" });
    next();
  };
}

/*
Booking flow:
- POST /api/bookings  -> creates booking record server-side and Stripe PaymentIntent with capture_method='manual' (authorization only)
- Client confirms payment (card) using client_secret -> funds are authorized but not captured.
- POST /api/bookings/:id/verify -> renter calls this to capture the PaymentIntent when they accept the booking.
*/

app.post("/api/bookings", auth, async (req: any, res) => {
  const { listingId, amount, currency = "usd", renterId } = req.body;
  // TODO: create booking in DB (status = "pending", store paymentIntentId)
  const pi = await stripe.paymentIntents.create({
    amount,
    currency,
    capture_method: "manual", // authorize now, capture later when renter confirms
    metadata: { listingId, renterId, createdBy: req.user.id },
  });
  // Return client_secret to confirm on client side
  res.send({ clientSecret: pi.client_secret, paymentIntentId: pi.id /* store in DB */ });
});

// renter verifies and captures payment
app.post("/api/bookings/:id/verify", auth, requireRole("renter"), async (req: any, res) => {
  const bookingId = req.params.id;
  // TODO: lookup booking in DB, get paymentIntentId, check permission
  const paymentIntentId = req.body.paymentIntentId;
  try {
    const captured = await stripe.paymentIntents.capture(paymentIntentId);
    // TODO: mark booking as confirmed in DB, notify parties via socket.io
    io.to(`booking_${bookingId}`).emit("booking:confirmed", { bookingId });
    res.send({ ok: true, captured });
  } catch (err) {
    res.status(400).send({ error: (err as Error).message });
  }
});

// admin endpoints
app.get("/api/admin/bookings", auth, requireRole("admin"), async (req, res) => {
  // TODO: return bookings for admin to monitor
  res.send({ bookings: [] });
});

app.post("/api/complaints", auth, async (req, res) => {
  const { bookingId, message } = req.body;
  // TODO: save complaint to DB
  res.send({ ok: true });
});

// stripe webhook (must use raw body - configure separately in production)
app.post("/api/webhooks/stripe", bodyParser.raw({ type: "application/json" }), (req: any, res) => {
  const sig = req.headers["stripe-signature"];
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig as string, process.env.STRIPE_WEBHOOK_SECRET || "");
    // handle events (payment_intent.captured, payment_intent.payment_failed, etc.)
    console.log("stripe event", event.type);
    res.json({ received: true });
  } catch (err) {
    console.error("webhook error", err);
    res.status(400).send(`Webhook Error: ${(err as Error).message}`);
  }
});

// Socket.io for chat
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error("unauthorized"));
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET || "dev");
    (socket as any).user = user;
    next();
  } catch (e) { next(new Error("unauthorized")); }
});

io.on("connection", (socket) => {
  const user = (socket as any).user;
  // join rooms: user id and booking rooms
  socket.join(`user_${user.id}`);
  socket.on("chat:join", (room) => socket.join(room));
  socket.on("chat:message", (payload) => {
    // payload { room, text }
    io.to(payload.room).emit("chat:message", { ...payload, from: user.id, ts: Date.now() });
    // TODO: persist message in DB
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log("server running on", PORT));