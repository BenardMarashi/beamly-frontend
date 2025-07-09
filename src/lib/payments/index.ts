import { redirectToCheckout as stripe } from "../stripe";

// Use environment variable with fallback
const PAYMENT_PROVIDER = import.meta.env.VITE_PAYMENT_PROVIDER || "stripe";

// Mock paddle implementation for now
const paddleRedirectToCheckout = async (planId: string) => {
  console.log("Paddle checkout not implemented yet, using Stripe instead");
  return stripe(planId);
};

export const redirectToCheckout =
  PAYMENT_PROVIDER === "paddle" ? paddleRedirectToCheckout : stripe;