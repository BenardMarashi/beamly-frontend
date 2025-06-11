import { redirectToCheckout as stripe } from "../stripe";
import { redirectToCheckout as paddle } from "../paddle";

// Use environment variable with fallback
const PAYMENT_PROVIDER = import.meta.env.VITE_PAYMENT_PROVIDER || "stripe";

export const redirectToCheckout =
  PAYMENT_PROVIDER === "paddle" ? paddle : stripe;