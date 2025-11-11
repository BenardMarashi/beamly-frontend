// functions/src/index.ts
import * as functions from "firebase-functions";
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onCall, HttpsError, onRequest } from "firebase-functions/v2/https";
import { defineSecret, defineString } from "firebase-functions/params";
import axios from "axios";



// One source of truth for your site URL.
const APP_URL = defineString("APP_URL");


// Optional: strict CORS allowlist for callable functions (keep dev + prod)
const ALLOWED_ORIGINS = [
  "https://beamlyapp.com",
  "https://www.beamlyapp.com",
  "https://beamly-app.web.app",
  "http://localhost:5173",
];

// Define secrets
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

// Lazy-loaded instances
let adminApp: any;
let db: any;
let messaging: any;
let storage: any;
let stripe: any;
let FieldValue: any;
let Timestamp: any;

// Lazy-loaded modules
let adminModule: any;
let stripeModule: any;

// Lazy initialization functions
function getAdmin() {
  if (!adminApp) {
    // Lazy load the admin module
    if (!adminModule) {
      adminModule = require("firebase-admin");
    }
    adminApp = adminModule.initializeApp();
    db = adminApp.firestore();
    messaging = adminApp.messaging();
    storage = adminApp.storage();
    // IMPORTANT: Get FieldValue and Timestamp from admin.firestore
    FieldValue = adminModule.firestore.FieldValue;
    Timestamp = adminModule.firestore.Timestamp;
  }
  return { admin: adminApp, db, messaging, storage, FieldValue, Timestamp };
}

// Make getStripe async and only access secret when called
async function getStripe(): Promise<any> {
  if (!stripe) {
    // Lazy load the stripe module
    if (!stripeModule) {
      stripeModule = require("stripe");
    }

    // Only access the secret when this function is actually called
    // NOT during module initialization
    try {
      const secretKey = stripeSecretKey.value();
      if (!secretKey) {
        throw new Error("Stripe secret key not configured");
      }
      stripe = new stripeModule(secretKey);
    } catch (error) {
      console.error("Failed to initialize Stripe:", error);
      throw new HttpsError("failed-precondition", "Stripe configuration not available");
    }
  }
  return stripe;
}

// Trigger: Send notification when a new proposal is received
export const onNewProposal = onDocumentCreated(
  {
    document: "proposals/{proposalId}",
    region: "us-central1",
    maxInstances: 10,
  },
  async (event) => {
    const { db, FieldValue } = getAdmin();
    const proposal = event.data?.data();
    const proposalId = event.params.proposalId;

    if (!proposal) return;

    try {
      // Get job details
      const jobDoc = await db.doc(`jobs/${proposal.jobId}`).get();
      const job = jobDoc.data();

      if (!job) return;

      // Create notification for client
      await db.collection("notifications").add({
        userId: job.clientId,
        title: "New Proposal Received",
        body: `${proposal.freelancerName} submitted a proposal for "${job.title}"`,
        type: "proposal",
        actionUrl: `/proposals/${proposalId}`,
        actionData: {
          proposalId,
          jobId: proposal.jobId,
        },
        read: false,
        pushSent: false,
        createdAt: FieldValue.serverTimestamp(),
      });

      // Send push notification if FCM token exists
      const clientDoc = await db.doc(`users/${job.clientId}`).get();
      const client = clientDoc.data();

      if (client?.fcmToken) {
        const { messaging } = getAdmin();
        await messaging.send({
          token: client.fcmToken,
          notification: {
            title: "New Proposal Received",
            body: `${proposal.freelancerName} submitted a proposal for "${job.title}"`,
          },
          data: {
            type: "proposal",
            proposalId,
            jobId: proposal.jobId,
          },
        });
      }
    } catch (error) {
      console.error("Error in onNewProposal:", error);
    }
  }
);

// Trigger: Send notification when a proposal is accepted
export const onProposalAccepted = onDocumentUpdated(
  {
    document: "proposals/{proposalId}",
    region: "us-central1",
    maxInstances: 10,
  },
  async (event) => {
    const { db, messaging, FieldValue } = getAdmin();
    const before = event.data?.before.data();
    const after = event.data?.after.data();
    const proposalId = event.params.proposalId;

    if (!before || !after) return;

    // Check if proposal was just accepted
    if (before.status !== "accepted" && after.status === "accepted") {
      try {
        // Create notification for freelancer
        await db.collection("notifications").add({
          userId: after.freelancerId,
          title: "Proposal Accepted!",
          body: "Your proposal has been accepted. Payment is being processed.",
          type: "contract",
          actionUrl: "/dashboard",
          actionData: {
            proposalId,
            jobId: after.jobId,
          },
          read: false,
          pushSent: false,
          createdAt: FieldValue.serverTimestamp(),
        });

        // Send push notification
        const freelancerDoc = await db.doc(`users/${after.freelancerId}`).get();
        const freelancer = freelancerDoc.data();

        if (freelancer?.fcmToken) {
          await messaging.send({
            token: freelancer.fcmToken,
            notification: {
              title: "Proposal Accepted!",
              body: "Your proposal has been accepted. Payment is being processed.",
            },
            data: {
              type: "contract",
              proposalId,
              jobId: after.jobId,
            },
          });
        }
      } catch (error) {
        console.error("Error in onProposalAccepted:", error);
      }
    }
  }
);



// Trigger: Send notification for new messages
export const onNewMessage = onDocumentCreated(
  {
    document: "messages/{messageId}",
    region: "us-central1",
    maxInstances: 10,
  },
  async (event) => {
    const { db, messaging, FieldValue } = getAdmin();
    const message = event.data?.data();

    if (!message) return;

    try {
      // Determine recipient
      const conversationParts = message.conversationId.split("_");
      const recipientId = conversationParts.find(
        (id: string) => id !== message.senderId
      );

      if (!recipientId) return;

      // Create notification
      await db.collection("notifications").add({
        userId: recipientId,
        title: "New Message",
        body: `${message.senderName}: ${message.text?.substring(0, 50)}...`,
        type: "message",
        actionUrl: `/messages/${message.conversationId}`,
        actionData: {
          conversationId: message.conversationId,
        },
        read: false,
        pushSent: false,
        createdAt: FieldValue.serverTimestamp(),
      });

      // Update unread count in conversation
      await db.doc(`conversations/${message.conversationId}`).update({
        [`unreadCount.${recipientId}`]: FieldValue.increment(1),
      });

      // Send push notification
      const recipientDoc = await db.doc(`users/${recipientId}`).get();
      const recipient = recipientDoc.data();

      if (recipient?.fcmToken) {
        await messaging.send({
          token: recipient.fcmToken,
          notification: {
            title: `New message from ${message.senderName}`,
            body: message.text?.substring(0, 100) || "Sent an attachment",
          },
          data: {
            type: "message",
            conversationId: message.conversationId,
          },
        });
      }
    } catch (error) {
      console.error("Error in onNewMessage:", error);
    }
  }
);

// Create Stripe Connect Account for Freelancers
const STRIPE_SUPPORTED_COUNTRIES = [
  "AU", "AT", "BE", "BR", "BG", "CA", "HR", "CY", "CZ", "DK",
  "EE", "FI", "FR", "DE", "GI", "GR", "HK", "HU", "IN", "IE",
  "IT", "JP", "LV", "LI", "LT", "LU", "MY", "MT", "MX", "NL",
  "NZ", "NO", "PL", "PT", "RO", "SG", "SK", "SI", "ES", "SE",
  "CH", "TH", "AE", "GB", "US",
];

function isValidCountryCode(country: string): boolean {
  if (!country || typeof country !== "string" || country.length !== 2) {
    return false;
  }
  return STRIPE_SUPPORTED_COUNTRIES.includes(country.toUpperCase());
}

function getDefaultCurrencyForCountry(country: string): string {
  const currencyMap: Record<string, string> = {
    "US": "usd", "GB": "gbp", "AU": "aud", "CA": "cad", "JP": "jpy",
    "IN": "inr", "SG": "sgd", "HK": "hkd", "NZ": "nzd", "MX": "mxn",
    "BR": "brl", "TH": "thb", "MY": "myr", "AE": "aed", "CH": "chf",
    "SE": "sek", "NO": "nok", "DK": "dkk", "PL": "pln", "CZ": "czk",
    "HU": "huf", "RO": "ron", "BG": "bgn", "HR": "hrk",
    // EU countries default to EUR
    "AT": "eur", "BE": "eur", "CY": "eur", "EE": "eur", "FI": "eur",
    "FR": "eur", "DE": "eur", "GR": "eur", "IE": "eur", "IT": "eur",
    "LV": "eur", "LT": "eur", "LU": "eur", "MT": "eur", "NL": "eur",
    "PT": "eur", "SK": "eur", "SI": "eur", "ES": "eur", "LI": "eur",
    "GI": "eur",
  };

  return currencyMap[country.toUpperCase()] || "eur";
}

// REPLACE your existing createStripeConnectAccount function with this:
export const createStripeConnectAccount = onCall(
  {
    region: "us-central1",
    maxInstances: 10,
    secrets: [stripeSecretKey],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const { db, FieldValue } = getAdmin();
    const { userId, businessType = "individual" } = request.data;

    // SECURITY FIX: Verify user can only create their own account
    if (userId !== request.auth.uid) {
      throw new HttpsError("permission-denied", "You can only create your own Stripe account");
    }

    // Validate country code
    const country = "CZ";
    if (!isValidCountryCode(country)) {
      throw new HttpsError("invalid-argument", "Configured country is invalid");
    }

    try {
      // Get user data
      const userDoc = await db.doc(`users/${userId}`).get();
      const userData = userDoc.data();

      if (!userData) {
        throw new HttpsError("not-found", "User not found");
      }

      // Check if user already has a Stripe account
      if (userData.stripeConnectAccountId) {
        throw new HttpsError("already-exists", "You already have a Stripe Connect account");
      }

      // Create Express account for freelancer with DYNAMIC COUNTRY

      const stripe = await getStripe();
      const account = await stripe.accounts.create({
        type: "express",
        country: country.toUpperCase(), // Use the country provided by user
        email: userData.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: businessType,
        default_currency: getDefaultCurrencyForCountry(country),
        metadata: {
          userId,
          country,
        },
      });
      /**
       * Prefill address so hosted onboarding shows it by default.
       * IMPORTANT: Only prefill if these details are accurate for the specific freelancer.
       * Stripe will still allow/require the user to edit to their real address if needed.
       */
      if (businessType === "individual") {
        await stripe.accounts.update(account.id, {
          individual: {
            address: {
              line1: "U Jam",
              line2: "1340/11",
              postal_code: "32300",
              city: "Plzen",
              country: "CZ",
            },
          },
        });
      } else {
        // For company-type accounts:
        await stripe.accounts.update(account.id, {
          company: {
            address: {
              line1: "U Jam",
              line2: "1340/11",
              postal_code: "32300",
              city: "Plzen",
              country: "CZ",
            },
          },
        });
      }
      // Create account link for onboarding
      // Build a safe base URL (client can optionally pass baseUrl for previews/dev)
      const base =
        (request.data?.baseUrl as string) || APP_URL.value() || "https://beamlyapp.com";

      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `${base}/profile/edit?stripe_connect=refresh&country=${country}`,
        return_url:  `${base}/profile/edit?stripe_connect=success&country=${country}`,
        type: "account_onboarding",
      });


      // Update user document with Stripe account ID and country
      await db.doc(`users/${userId}`).update({
        stripeConnectAccountId: account.id,
        stripeConnectStatus: "pending",
        stripeCountry: country.toUpperCase(),
        businessType: businessType,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        accountId: account.id,
        onboardingUrl: accountLink.url,
        country: country.toUpperCase(),
      };
    } catch (error: unknown) {
      console.error("Error creating Connect account:", error);

      // Better error handling
      if ((error as any).type === "StripeInvalidRequestError") {
        if ((error as any).message.includes("country")) {
          throw new HttpsError("invalid-argument", "This country is not supported for Stripe Connect");
        }
      }

      throw new HttpsError("internal", (error as Error).message);
    }
  }
);

// ADD this new function AFTER createStripeConnectAccount:
export const getStripeSupportedCountries = onCall(
  {
    region: "us-central1",
    maxInstances: 10,
  },
  async () => {
    // This doesn't require authentication as it's public information

    const countryNames: Record<string, string> = {
      "AU": "Australia", "AT": "Austria", "BE": "Belgium", "BR": "Brazil",
      "BG": "Bulgaria", "CA": "Canada", "HR": "Croatia", "CY": "Cyprus",
      "CZ": "Czech Republic", "DK": "Denmark", "EE": "Estonia", "FI": "Finland",
      "FR": "France", "DE": "Germany", "GI": "Gibraltar", "GR": "Greece",
      "HK": "Hong Kong", "HU": "Hungary", "IN": "India", "IE": "Ireland",
      "IT": "Italy", "JP": "Japan", "LV": "Latvia", "LI": "Liechtenstein",
      "LT": "Lithuania", "LU": "Luxembourg", "MY": "Malaysia", "MT": "Malta",
      "MX": "Mexico", "NL": "Netherlands", "NZ": "New Zealand", "NO": "Norway",
      "PL": "Poland", "PT": "Portugal", "RO": "Romania", "SG": "Singapore",
      "SK": "Slovakia", "SI": "Slovenia", "ES": "Spain", "SE": "Sweden",
      "CH": "Switzerland", "TH": "Thailand", "AE": "United Arab Emirates",
      "GB": "United Kingdom", "US": "United States",
    };

    const countries = STRIPE_SUPPORTED_COUNTRIES.map((code) => ({
      code,
      name: countryNames[code] || code,
      currency: getDefaultCurrencyForCountry(code),
      supported: true,
    }));

    return {
      success: true,
      countries: countries.sort((a, b) => a.name.localeCompare(b.name)),
    };
  }
);

// Check Stripe Connect Account Status
export const checkStripeConnectStatus = onCall(
  {
    region: "us-central1",
    maxInstances: 10,
    secrets: [stripeSecretKey],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const { db } = getAdmin();
    const { accountId } = request.data;

    try {
      const stripe = await getStripe();
      const account = await stripe.accounts.retrieve(accountId);

      await db.doc(`users/${request.auth.uid}`).update({
        stripeConnectStatus: account.details_submitted ? "active" : "pending",
        stripeConnectChargesEnabled: account.charges_enabled,
        stripeConnectPayoutsEnabled: account.payouts_enabled,
        stripeConnectDetailsSubmitted: account.details_submitted,
      });

      return {
        success: true,
        status: account.details_submitted ? "active" : "pending",
        detailsSubmitted: account.details_submitted,
        chargesEnabled: account.charges_enabled,
        payoutsEnabled: account.payouts_enabled,
      };
    } catch (error: unknown) {
      console.error("Error checking Connect status:", error);
      throw new HttpsError("internal", (error as Error).message);
    }
  }
);

// Create Account Link for Re-onboarding
export const createStripeAccountLink = onCall(
  {
    region: "us-central1",
    maxInstances: 10,
    secrets: [stripeSecretKey],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const { db } = getAdmin();
    const { userId, returnUrl, refreshUrl } = request.data;

    try {
      const userDoc = await db.doc(`users/${userId}`).get();
      const accountId = userDoc.data()?.stripeConnectAccountId;

      if (!accountId) {
        throw new HttpsError("not-found", "No Connect account found");
      }

      const stripe = await getStripe();
      const base =
        (request.data?.baseUrl as string) || APP_URL.value() || "https://beamlyapp.com";

      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl || `${base}/profile/edit?stripe_connect=refresh`,
        return_url:  returnUrl  || `${base}/profile/edit?stripe_connect=success`,
        type: "account_onboarding",
      });

      return {
        success: true,
        url: accountLink.url,
      };
    } catch (error: unknown) {
      console.error("Error creating account link:", error);
      throw new HttpsError("internal", (error as Error).message);
    }
  }
);

export const createJobPaymentIntent = onCall(
  {
    region: "us-central1",
    maxInstances: 10,
    secrets: [stripeSecretKey],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const { db, FieldValue } = getAdmin();
    const { jobId, proposalId, amount } = request.data;

    console.log("Received payment request:", { jobId, proposalId, amount });

    try {
      // Get job and proposal details
      const jobDoc = await db.doc(`jobs/${jobId}`).get();
      const proposalDoc = await db.doc(`proposals/${proposalId}`).get();

      if (!jobDoc.exists || !proposalDoc.exists) {
        throw new HttpsError("not-found", "Job or proposal not found");
      }

      const proposalData = proposalDoc.data();
      if (!proposalData) {
        throw new HttpsError("not-found", "Proposal data not found");
      }

      // Validate and calculate amount with client commission
      const numericAmount = typeof amount === "string" ?
        parseFloat(amount.replace(/[^0-9.]/g, "")) : amount;

      // ✅ Validate amount
      if (!numericAmount || numericAmount <= 0 || isNaN(numericAmount)) {
        throw new HttpsError("invalid-argument", "Invalid payment amount");
      }

      // Add 5% client commission
      const clientCommissionRate = 0.05;
      const totalAmount = numericAmount * (1 + clientCommissionRate);
      const amountInCents = Math.round(totalAmount * 100);

      if (amountInCents < 50) {
        throw new HttpsError(
          "invalid-argument",
          `Amount must be at least €0.50. Minimum is 50 cents. Got ${amountInCents} cents`
        );
      }

      // Create payment intent
      const stripe = await getStripe();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amountInCents,
        currency: "eur",
        metadata: {
          jobId,
          proposalId,
          clientId: request.auth.uid,
          freelancerId: proposalData.freelancerId,
          type: "job_payment",
          originalAmount: numericAmount.toString(),
          clientCommission: (totalAmount - numericAmount).toFixed(2),
        },
        capture_method: "automatic",
        setup_future_usage: "off_session",
      });

      // Create payment record in database
      const paymentRef = db.collection("payments").doc(paymentIntent.id);
      await paymentRef.set({
        id: paymentIntent.id,
        jobId,
        proposalId,
        clientId: request.auth.uid,
        freelancerId: proposalData.freelancerId,
        amount: totalAmount,
        originalAmount: numericAmount,
        clientCommission: totalAmount - numericAmount,
        currency: "eur",
        status: "pending",
        type: "job_payment",
        stripePaymentIntentId: paymentIntent.id,
        createdAt: FieldValue.serverTimestamp(),
      });

      // ✅ FIX #6: Create escrow transaction
      await db.collection("transactions").add({
        type: "escrow",
        userId: proposalData.freelancerId,
        amount: Math.round(numericAmount * 100) / 100,
        currency: "eur",
        status: "pending",
        description: `Payment held in escrow for job: ${jobId}`,
        jobId: jobId,
        proposalId: proposalId,
        clientId: request.auth.uid,
        stripePaymentIntentId: paymentIntent.id,
        createdAt: FieldValue.serverTimestamp(),
      });

      console.log(`✅ Created escrow transaction for payment intent ${paymentIntent.id}`);

      return {
        success: true,
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      };
    } catch (error: unknown) {
      console.error("Error creating payment intent:", error);
      throw new HttpsError("internal", (error as Error).message);
    }
  }
);

export const releasePaymentToFreelancer = onCall(
  {
    region: "us-central1",
    maxInstances: 10,
    secrets: [stripeSecretKey],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const { db, FieldValue } = getAdmin();
    const { jobId, freelancerId } = request.data;

    try {
      // Get freelancer's Connect account and data
      const freelancerDoc = await db.doc(`users/${freelancerId}`).get();
      const freelancerData = freelancerDoc.data();
      const connectAccountId = freelancerData?.stripeConnectAccountId;

      if (!connectAccountId) {
        throw new HttpsError("failed-precondition", "Freelancer has no Connect account");
      }

      // Get payment details
      const paymentsQuery = await db.collection("payments")
        .where("jobId", "==", jobId)
        .where("status", "==", "held_in_escrow")
        .limit(1)
        .get();

      if (paymentsQuery.empty) {
        throw new HttpsError("not-found", "No payment found for this job");
      }

      const paymentDoc = paymentsQuery.docs[0];
      const paymentData = paymentDoc.data();

      // Check if freelancer is Pro
      const isProFreelancer = freelancerData?.isPro || false;

      // Calculate commissions
      const totalAmount = paymentData.amount;
      const originalAmount = paymentData.originalAmount || (totalAmount / 1.05);
      const clientCommission = totalAmount - originalAmount;

      // Freelancer commission: 15% for free, 5% for pro
      const freelancerCommissionPercent = isProFreelancer ? 0.05 : 0.15;
      const freelancerCommission = originalAmount * freelancerCommissionPercent;
      const freelancerPayout = originalAmount - freelancerCommission;

      // Platform keeps: client commission + freelancer commission
      const platformTotal = clientCommission + freelancerCommission;

      // Create transfer to freelancer
      const stripe = await getStripe();
      const transfer = await stripe.transfers.create({
        amount: Math.round(freelancerPayout * 100),
        currency: "eur",
        destination: connectAccountId,
        metadata: {
          jobId,
          freelancerId,
          paymentId: paymentDoc.id,
          freelancerCommissionPercent: freelancerCommissionPercent.toString(),
          isProFreelancer: isProFreelancer.toString(),
        },
      });

      // Update payment status
      await paymentDoc.ref.update({
        status: "released",
        releasedAt: FieldValue.serverTimestamp(),
        stripeTransferId: transfer.id,
        originalAmount: originalAmount,
        clientCommission: clientCommission,
        freelancerCommission: freelancerCommission,
        freelancerCommissionPercent,
        freelancerPayout: freelancerPayout,
        platformTotal: platformTotal,
        isProFreelancer,
      });

      // ✅ FIX #1: Create release transaction (with duplicate check)
      const existingReleaseTransaction = await db.collection("transactions")
        .where("paymentId", "==", paymentDoc.id)
        .where("type", "==", "release")
        .limit(1)
        .get();

      if (existingReleaseTransaction.empty) {
        // Validate amount
        if (!freelancerPayout || freelancerPayout <= 0 || isNaN(freelancerPayout)) {
          throw new HttpsError("invalid-argument", "Invalid payout amount");
        }

        // Create release transaction
        await db.collection("transactions").add({
          type: "release",
          userId: freelancerId,
          amount: Math.round(freelancerPayout * 100) / 100,
          currency: "eur",
          status: "completed",
          description: `Payment released for job: ${jobId}`,
          jobId: jobId,
          paymentId: paymentDoc.id,
          stripeTransferId: transfer.id,
          originalAmount: originalAmount,
          freelancerCommission: freelancerCommission,
          platformTotal: platformTotal,
          createdAt: FieldValue.serverTimestamp(),
          completedAt: FieldValue.serverTimestamp(),
        });

        console.log(`✅ Created release transaction for payment ${paymentDoc.id}`);
      } else {
        console.log(`Release transaction already exists for payment ${paymentDoc.id}`);
      }

      // Update freelancer's earnings
      await db.doc(`users/${freelancerId}`).update({
        totalEarnings: FieldValue.increment(freelancerPayout),
        completedJobs: FieldValue.increment(1),
      });

      // Update job status
      await db.doc(`jobs/${jobId}`).update({
        status: "completed",
        paymentStatus: "released",
        completedAt: FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        transferId: transfer.id,
        freelancerPayout: freelancerPayout,
        platformTotal: platformTotal,
      };
    } catch (error: unknown) {
      console.error("Error releasing payment:", error);
      throw new HttpsError("internal", (error as Error).message);
    }
  }
);

// Create Subscription Checkout Session
export const createSubscriptionCheckout = onCall(
  {
    region: "us-central1",
    maxInstances: 10,
    secrets: [stripeSecretKey],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const { db } = getAdmin();
    const { userId, priceId, successUrl, cancelUrl } = request.data;

    try {
      // Check if user already has a Stripe customer ID
      const userDoc = await db.doc(`users/${userId}`).get();
      let customerId = userDoc.data()?.stripeCustomerId;

      // Create customer if doesn't exist
      if (!customerId) {
        const stripe = await getStripe();
        const customer = await stripe.customers.create({
          email: userDoc.data()?.email,
          metadata: {
            userId,
          },
        });
        customerId = customer.id;

        // Save customer ID
        await db.doc(`users/${userId}`).update({
          stripeCustomerId: customerId,
        });
      }

      // Create checkout session
      const stripe = await getStripe();
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ["card"],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          userId,
        },
      });

      return {
        success: true,
        url: session.url,
      };
    } catch (error: unknown) {
      console.error("Error creating subscription checkout:", error);
      throw new HttpsError("internal", (error as Error).message);
    }
  }
);

// Cancel Subscription
export const cancelSubscription = onCall(
  {
    region: "us-central1",
    maxInstances: 10,
    secrets: [stripeSecretKey],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const { db } = getAdmin();
    const { userId } = request.data;

    try {
      const userDoc = await db.doc(`users/${userId}`).get();
      const subscriptionId = userDoc.data()?.stripeSubscriptionId;

      if (!subscriptionId) {
        throw new HttpsError("not-found", "No active subscription found");
      }

      // Cancel at period end (allow access until end of billing period)
      const stripe = await getStripe();
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      });

      return {
        success: true,
        endDate: new Date((subscription as any).current_period_end * 1000),
      };
    } catch (error: unknown) {
      console.error("Error cancelling subscription:", error);
      throw new HttpsError("internal", (error as Error).message);
    }
  }
);

// Create Payout for Freelancer
export const createStripePayout = onCall(
  {
    region: "us-central1",
    maxInstances: 10,
    secrets: [stripeSecretKey],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const { db, FieldValue } = getAdmin();
    const { userId, amount } = request.data;

    try {
      const userDoc = await db.doc(`users/${userId}`).get();
      const connectAccountId = userDoc.data()?.stripeConnectAccountId;

      if (!connectAccountId) {
        throw new HttpsError("failed-precondition", "No Connect account found");
      }

      // Create payout in connected account
      const stripe = await getStripe();
      const payout = await stripe.payouts.create(
        {
          amount: Math.round(amount * 100), // Convert to cents
          currency: "eur",
          metadata: {
            userId,
          },
        },
        {
          stripeAccount: connectAccountId,
        }
      );

      // Record transaction
      await db.collection("transactions").add({
        type: "withdrawal",
        userId,
        amount,
        currency: "eur",
        status: "pending",
        stripePayoutId: payout.id,
        createdAt: FieldValue.serverTimestamp(),
      });

      return {
        success: true,
        payoutId: payout.id,
      };
    } catch (error: unknown) {
      console.error("Error creating payout:", error);
      throw new HttpsError("internal", (error as Error).message);
    }
  }
);

// Get Stripe Balance
export const getStripeBalance = onCall(
  {
    region: "us-central1",
    maxInstances: 10,
    secrets: [stripeSecretKey],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const { db } = getAdmin();
    const { userId } = request.data;

    try {
      const userDoc = await db.doc(`users/${userId}`).get();
      const connectAccountId = userDoc.data()?.stripeConnectAccountId;

      if (!connectAccountId) {
        return {
          success: true,
          available: 0,
          pending: 0,
          currency: "eur",
        };
      }

      // Get balance from connected account
      const stripe = await getStripe();
      const balance = await stripe.balance.retrieve({
        stripeAccount: connectAccountId,
      });

      // ✅ FIX #5: Prioritize EUR, fallback to sum of all currencies
      const availableEUR = balance.available.find((bal: any) => bal.currency === "eur");
      const pendingEUR = balance.pending.find((bal: any) => bal.currency === "eur");

      const available = availableEUR
        ? availableEUR.amount / 100
        : balance.available.reduce((sum: number, bal: any) => sum + bal.amount, 0) / 100;
      const pending = pendingEUR
        ? pendingEUR.amount / 100
        : balance.pending.reduce((sum: number, bal: any) => sum + bal.amount, 0) / 100;

      return {
        success: true,
        available: Math.round(available * 100) / 100,
        pending: Math.round(pending * 100) / 100,
        currency: availableEUR ? "eur" : "mixed",
      };
    } catch (error: unknown) {
      console.error("Error getting balance:", error);
      return {
        success: false,
        error: (error as Error).message,
        available: 0,
        pending: 0,
      };
    }
  }
);

// Webhook to handle Stripe events
export const stripeWebhook = onRequest(
  {
    region: "us-central1",
    cors: false,
    secrets: [stripeSecretKey, stripeWebhookSecret],
    maxInstances: 10,
    timeoutSeconds: 60,
  },
  async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;

    let event: any;

    try {
      const stripe = await getStripe();  // Make it await
      const webhookSecret = stripeWebhookSecret.value();  // This is OK here since it's inside the function
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        webhookSecret
      );
    } catch (err: unknown) {
      console.error("Webhook signature verification failed:", (err as Error).message);
      res.status(400).send(`Webhook Error: ${(err as Error).message}`);
      return;
    }

    // Handle the event
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        if (session.mode === "subscription" && session.subscription) {
          await handleSubscriptionCreated(session);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object;
        if ((invoice as any).subscription) {
          await handleSubscriptionPayment(invoice);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        await handleSubscriptionCancelled(subscription);
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        if (paymentIntent.metadata.type === "job_payment") {
          await handleJobPaymentSucceeded(paymentIntent);
        }
        break;
      }

      case "account.updated": {
        const account = event.data.object;
        await handleConnectAccountUpdated(account);
        break;
      }
    }

    res.json({ received: true });
  }
);

// Helper functions for webhook handlers
async function handleSubscriptionCreated(session: any) {
  const { db, FieldValue, Timestamp } = getAdmin();
  const userId = session.metadata?.userId;

  if (!userId || !session.subscription) {
    console.error("Missing userId or subscription in session:", { userId, hasSubscription: !!session.subscription });
    return;
  }

  try {
    const stripe = await getStripe();
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

    const priceId = subscription.items.data[0].price.id;

    // Determine subscription tier
    let subscriptionTier: "messages" | "pro" = "pro";
    let planType = "monthly";

    /*
if (priceId === process.env.STRIPE_MESSAGES_PRICE_ID) {
  subscriptionTier = "messages";
  planType = "messages";
} else {
*/
      subscriptionTier = "pro";
      if (priceId === process.env.STRIPE_QUARTERLY_PRICE_ID) planType = "quarterly";
      if (priceId === process.env.STRIPE_YEARLY_PRICE_ID) planType = "yearly";
      if (priceId === process.env.STRIPE_6MONTHS_PRICE_ID) planType = "sixmonths";
//    }

    // Ensure timestamps are valid numbers
    const startTimestamp = Number(subscription.current_period_start);
    const endTimestamp = Number(subscription.current_period_end);

    // Convert to Firestore Timestamps (Stripe gives seconds, Firestore needs seconds too)
    await db.doc(`users/${userId}`).update({
      subscriptionTier,
      subscriptionStatus: "active",
      subscriptionPlan: planType,
      stripeSubscriptionId: subscription.id,
      subscriptionStartDate: Timestamp.fromMillis(startTimestamp * 1000),
      subscriptionEndDate: Timestamp.fromMillis(endTimestamp * 1000),
      isPro: subscriptionTier === "pro",
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`✅ Subscription created for user ${userId}: ${subscriptionTier} (${planType}) until ${new Date(endTimestamp * 1000).toISOString()}`);

    await db.collection("transactions").add({
      type: "subscription",
      userId,
      amount: (session.amount_total || 0) / 100,
      currency: session.currency || "eur",
      status: "completed",
      stripeSessionId: session.id,
      stripeSubscriptionId: subscription.id,
      description: /*`${subscriptionTier === "messages" ? "Messages-Only" : planType} subscription`*/`Subscription (${planType})`,
      createdAt: FieldValue.serverTimestamp(),
      completedAt: FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error("Error in handleSubscriptionCreated:", error);
    throw error;
  }
}

async function handleSubscriptionPayment(invoice: any) {
  const { db, FieldValue, Timestamp } = getAdmin();

  // Get subscription ID from invoice
  const subscriptionId = invoice.subscription;
  if (!subscriptionId) {
    console.error("No subscription ID in invoice");
    return;
  }

  // Get subscription details from Stripe to update period dates
  const stripe = await getStripe();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Find user by customer ID
  const customerId = invoice.customer;
  const usersQuery = await db.collection("users")
    .where("stripeCustomerId", "==", customerId)
    .limit(1)
    .get();

  if (!usersQuery.empty) {
    const userDoc = usersQuery.docs[0];
    const userId = userDoc.id;

    // ✅ UPDATE SUBSCRIPTION DATES FOR RENEWAL
    const startTimestamp = Number(subscription.current_period_start);
    const endTimestamp = Number(subscription.current_period_end);

    // ✅ UPDATE SUBSCRIPTION DATES FOR RENEWAL
    await userDoc.ref.update({
      subscriptionStartDate: Timestamp.fromMillis(startTimestamp * 1000),
      subscriptionEndDate: Timestamp.fromMillis(endTimestamp * 1000),
      subscriptionStatus: "active",
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`✅ Subscription renewed for user ${userId} until ${new Date(endTimestamp * 1000).toISOString()}`);

    // Log the payment transaction
    await db.collection("transactions").add({
      type: "subscription",
      userId: userId,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency,
      status: "completed",
      stripeInvoiceId: invoice.id,
      stripeSubscriptionId: subscriptionId,
      description: "Subscription renewal",
      createdAt: FieldValue.serverTimestamp(),
      completedAt: FieldValue.serverTimestamp(),
    });
  } else {
    console.error(`User not found for customer ${customerId}`);
  }
}

async function handleSubscriptionCancelled(subscription: any) {
  const { db, FieldValue } = getAdmin();
  const customerId = subscription.customer as string;

  const usersQuery = await db.collection("users")
    .where("stripeCustomerId", "==", customerId)
    .limit(1)
    .get();

  if (!usersQuery.empty) {
    const userDoc = usersQuery.docs[0];
    const userId = userDoc.id;

    await userDoc.ref.update({
      subscriptionTier: "free",
      subscriptionStatus: "cancelled",
      isPro: false,
      // Keep subscriptionEndDate so user still has access until period ends
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log(`✅ Subscription cancelled for user ${userId}, access until ${new Date(subscription.current_period_end * 1000).toISOString()}`);
  } else {
    console.error(`User not found for customer ${customerId} during cancellation`);
  }
}

async function handleJobPaymentSucceeded(paymentIntent: any) {
  const { db, FieldValue } = getAdmin();
  const { jobId, proposalId, freelancerId } = paymentIntent.metadata;

  try {
    console.log(`Processing payment success for ${paymentIntent.id}`);

    // Update payment record
    await db.doc(`payments/${paymentIntent.id}`).update({
      status: "held_in_escrow",
      paidAt: FieldValue.serverTimestamp(),
    });

    // Update proposal status WITH paymentStatus field
    await db.doc(`proposals/${proposalId}`).update({
      status: "accepted",
      acceptedAt: FieldValue.serverTimestamp(),
      paymentStatus: "escrow",
      projectStatus: "ongoing",
    });

    // Update job status
    await db.doc(`jobs/${jobId}`).update({
      status: "in_progress",
      paymentStatus: "escrow",
      assignedFreelancerId: freelancerId,
      assignedProposalId: proposalId,
    });

    // ✅ FIX #7: Update escrow transaction status from "pending" to "completed"
    const transactionsQuery = await db.collection("transactions")
      .where("stripePaymentIntentId", "==", paymentIntent.id)
      .where("type", "==", "escrow")
      .limit(1)
      .get();
      if (!transactionsQuery.empty) {
      await transactionsQuery.docs[0].ref.update({
        status: "completed",
        completedAt: FieldValue.serverTimestamp(),
      });
     console.log(`✅ Updated escrow transaction to completed for payment ${paymentIntent.id}`);
      } else {
      console.warn(`⚠️ No escrow transaction found for payment ${paymentIntent.id}`);
    }

    // Create notification for freelancer
    await db.collection("notifications").add({
      userId: freelancerId,
      type: "proposal",
      title: "Proposal Accepted!",
      body: "Your proposal has been accepted and the payment is secured in escrow.",
      data: { jobId, proposalId },
      read: false,
      createdAt: FieldValue.serverTimestamp(),
    });

    console.log(`✅ Payment success handled for job ${jobId}`);
  } catch (error) {
    console.error("Error handling job payment success:", error);
    throw error;
  }
}

async function handleConnectAccountUpdated(account: any) {
  const { db } = getAdmin();
  const userId = account.metadata?.userId;
  if (!userId) return;

  await db.doc(`users/${userId}`).update({
    stripeConnectChargesEnabled: account.charges_enabled,
    stripeConnectPayoutsEnabled: account.payouts_enabled,
    stripeConnectDetailsSubmitted: account.details_submitted,
    stripeConnectStatus: account.details_submitted ? "active" : "pending",
  });
}

// HTTP Function: Create Job
export const createJob = onCall(
  {
    maxInstances: 10,
    region: "us-central1",
    timeoutSeconds: 60,
  },
  async (request) => {
    // Verify user is authenticated
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const { db, FieldValue } = getAdmin();
    const { data } = request;

    try {
      // Validate user is a client
      const userDoc = await db.doc(`users/${request.auth.uid}`).get();
      const userData = userDoc.data();

      if (!userData) {
        throw new HttpsError("not-found", "User profile not found");
      }

      if (userData.userType !== "client" && userData.userType !== "both") {
        throw new HttpsError("permission-denied", "Only clients can post jobs");
      }

      // Create job document
      const jobRef = db.collection("jobs").doc();
      const now = FieldValue.serverTimestamp();

      const jobData = {
        id: jobRef.id,
        clientId: request.auth.uid,
        clientName: userData.displayName || "Anonymous",
        clientPhotoURL: userData.photoURL || "",
        title: data.title,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory || "",
        skills: data.skills || [],
        budgetType: data.budgetType,
        budgetMin: data.budgetMin || 0,
        budgetMax: data.budgetMax || 0,
        fixedPrice: data.fixedPrice || 0,
        hourlyRateMin: data.hourlyRateMin || 0,
        hourlyRateMax: data.hourlyRateMax || 0,
        duration: data.duration,
        experienceLevel: data.experienceLevel,
        locationType: data.locationType,
        location: data.location || "",
        projectSize: data.projectSize,
        status: "open",
        proposalCount: 0,
        invitesSent: 0,
        featured: false,
        viewCount: 0,
        createdAt: now,
        updatedAt: now,
      };

      await jobRef.set(jobData);

      // Send notifications to relevant freelancers
      await notifyFreelancersAboutNewJob(jobData);

      return { success: true, jobId: jobRef.id };
    } catch (error: unknown) {
      console.error("Error creating job:", error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError("internal", "Failed to create job");
    }
  }
);

// Helper function: Notify freelancers about new job
async function notifyFreelancersAboutNewJob(job: Record<string, unknown>) {
  const { db, FieldValue } = getAdmin();
  try {
    // Query freelancers with matching skills
    const freelancersSnapshot = await db.collection("users")
      .where("userType", "in", ["freelancer", "both"])
      .where("skills", "array-contains-any", (job.skills as string[]).slice(0, 10))
      .where("isAvailable", "==", true)
      .limit(50)
      .get();

    const batch = db.batch();
    const now = FieldValue.serverTimestamp();

    freelancersSnapshot.docs.forEach((doc: any) => {
      const notificationRef = db.collection("notifications").doc();
      batch.set(notificationRef, {
        id: notificationRef.id,
        userId: doc.id,
        title: "New Job Match",
        body: `New ${job.category} job: "${job.title}"`,
        type: "new-job",
        actionUrl: `/job/${job.id}`,
        actionData: { jobId: job.id },
        read: false,
        pushSent: false,
        createdAt: now,
      });
    });

    await batch.commit();
  } catch (error) {
    console.error("Error notifying freelancers:", error);
    // Don't throw - this is not critical for job creation
  }
}

// Check if user can submit proposal (5 per month for free users)
export const checkProposalLimit = onCall(
  {
    region: "us-central1",
    maxInstances: 10,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const { db, Timestamp } = getAdmin();
    const userId = request.auth.uid;

    try {
      const userDoc = await db.doc(`users/${userId}`).get();
      const userData = userDoc.data();

      if (!userData) {
        throw new HttpsError("not-found", "User not found");
      }

      // Pro users have unlimited proposals
      if (userData.isPro === true) {
        return {
          canSubmit: true,
          remaining: -1, // Unlimited
          isPro: true,
        };
      }

      // Check monthly proposal count for free users
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      let monthlyProposals = userData.monthlyProposals || 0;
      const lastReset = userData.lastProposalReset?.toDate();

      // Reset counter if it's a new month
      if (!lastReset ||
          lastReset.getMonth() !== currentMonth ||
          lastReset.getFullYear() !== currentYear) {
        monthlyProposals = 0;
        await userDoc.ref.update({
          monthlyProposals: 0,
          lastProposalReset: Timestamp.now(),
        });
      }

      const canSubmit = monthlyProposals < 5;
      const remaining = Math.max(0, 5 - monthlyProposals);

      return {
        canSubmit,
        remaining,
        isPro: false,
        current: monthlyProposals,
      };
    } catch (error: unknown) {
      console.error("Error checking proposal limit:", error);
      throw new HttpsError("internal", (error as Error).message);
    }
  }
);

// Update the submitProposal function to check limits
export const submitProposal = onCall(
  {
    maxInstances: 10,
    region: "us-central1",
    timeoutSeconds: 60,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const { db, FieldValue, Timestamp } = getAdmin();
    const { data } = request;
    const freelancerId = request.auth.uid;

    try {
      // Validate required fields
      if (!data.jobId || !data.coverLetter || !data.proposedRate) {
        throw new HttpsError("invalid-argument", "Missing required fields");
      }

      // Get freelancer data
      const freelancerDoc = await db.doc(`users/${freelancerId}`).get();
      const freelancerData = freelancerDoc.data();

      if (!freelancerData) {
        throw new HttpsError("not-found", "Freelancer profile not found");
      }

      if (freelancerData.userType !== "freelancer" && freelancerData.userType !== "both") {
        throw new HttpsError("permission-denied", "Only freelancers can submit proposals");
      }

      // Check proposal limit for free users
      if (freelancerData.isPro !== true) {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        let monthlyProposals = freelancerData.monthlyProposals || 0;
        const lastReset = freelancerData.lastProposalReset?.toDate();

        // Reset counter if it's a new month
        if (!lastReset ||
            lastReset.getMonth() !== currentMonth ||
            lastReset.getFullYear() !== currentYear) {
          monthlyProposals = 0;
          // Update immediately to avoid race conditions
          await freelancerDoc.ref.update({
            monthlyProposals: 0,
            lastProposalReset: Timestamp.now(),
          });
        }

        if (monthlyProposals >= 5) {
          throw new HttpsError(
            "resource-exhausted",
            "You've reached your monthly limit of 5 proposals. Upgrade to Pro for unlimited proposals."
          );
        }
      }

      // Get job data
      const jobDoc = await db.doc(`jobs/${data.jobId}`).get();
      const jobData = jobDoc.data();

      if (!jobDoc.exists || !jobData) {
        throw new HttpsError("not-found", "Job not found");
      }

      if (jobData.status !== "open" && jobData.status !== "active") {
        throw new HttpsError("failed-precondition", "Job is not accepting proposals");
      }

      // Check if freelancer already applied
      const existingProposal = await db.collection("proposals")
        .where("jobId", "==", data.jobId)
        .where("freelancerId", "==", freelancerId)
        .get();

      if (!existingProposal.empty) {
        throw new HttpsError("already-exists", "You have already submitted a proposal for this job");
      }

      // Create proposal
      const proposalRef = db.collection("proposals").doc();
      const now = FieldValue.serverTimestamp();

      const proposalData = {
        id: proposalRef.id,
        jobId: data.jobId,
        jobTitle: jobData.title,
        clientId: jobData.clientId,
        clientName: jobData.clientName,
        freelancerId: freelancerId,
        freelancerName: freelancerData.displayName || "Anonymous",
        freelancerPhotoURL: freelancerData.photoURL || "",
        freelancerRating: freelancerData.rating || 0,
        freelancerCompletedJobs: freelancerData.completedProjects || 0,
        coverLetter: data.coverLetter,
        proposedRate: data.proposedRate,
        estimatedDuration: data.estimatedDuration || "",
        budgetType: jobData.budgetType,
        attachments: data.attachments || [],
        status: "pending",
        createdAt: now,
        updatedAt: now,
      };

      // NEW: Track the updated count for return
      let newProposalCount = freelancerData.monthlyProposals || 0;

      // Use a transaction to ensure consistency
      await db.runTransaction(async (transaction: any) => {
        // Re-read the freelancer doc inside transaction for consistency
        const freshFreelancerDoc = await transaction.get(freelancerDoc.ref);
        const freshData = freshFreelancerDoc.data();

        // Create proposal
        transaction.set(proposalRef, proposalData);

        // Increment proposal count on job
        const jobRef = db.doc(`jobs/${data.jobId}`);
        transaction.update(jobRef, {
          proposalCount: FieldValue.increment(1),
          updatedAt: now,
        });

        // Update freelancer's monthly proposal count if not Pro
        if (freshData.isPro !== true) {
          // Calculate the new count
          newProposalCount = (freshData.monthlyProposals || 0) + 1;

          transaction.update(freelancerDoc.ref, {
            monthlyProposals: newProposalCount,
            lastProposalReset: freshData.lastProposalReset || Timestamp.now(),
          });
        }
      });

      // Return success with updated count information
      return {
        success: true,
        proposalId: proposalRef.id,
        newProposalCount: freelancerData.isPro ? -1 : newProposalCount,
        remaining: freelancerData.isPro ? -1 : Math.max(0, 5 - newProposalCount),
      };
    } catch (error: unknown) {
      console.error("Error submitting proposal:", error);
      if (error instanceof HttpsError) {
        throw error;
      }
      throw new HttpsError("internal", "Failed to submit proposal");
    }
  }
);

// Scheduled function to reset monthly proposal counters
export const resetMonthlyProposals = onSchedule(
  {
    schedule: "0 0 1 * *", // Run at midnight on the 1st of each month
    region: "us-central1",
    timeoutSeconds: 540,
    maxInstances: 1,
  },
  async (event) => {
    const { db, FieldValue } = getAdmin();
    console.log("Resetting monthly proposal counters:", event.scheduleTime);

    try {
      const batch = db.batch();

      // Reset all non-Pro users' proposal counts
      const users = await db.collection("users")
        .where("isPro", "==", false)
        .where("monthlyProposals", ">", 0)
        .get();

      users.forEach((doc: any) => {
        batch.update(doc.ref, {
          monthlyProposals: 0,
          lastProposalReset: FieldValue.serverTimestamp(),
        });
      });

      await batch.commit();
      console.log(`Reset proposal counters for ${users.size} users`);
    } catch (error) {
      console.error("Error resetting monthly proposals:", error);
    }
  }
);
// HTTP Function: Send Message
export const sendMessage = onCall(
  {
    maxInstances: 10,
    region: "us-central1",
    timeoutSeconds: 60,
  },
  async (request) => {
    // Verify user is authenticated
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const { db, FieldValue } = getAdmin();
    const { data } = request;
    const senderId = request.auth.uid;

    try {
      // Validate required fields
      if (!data.recipientId || !data.text) {
        throw new HttpsError("invalid-argument", "Missing required fields");
      }

      // Get sender data
      const senderDoc = await db.doc(`users/${senderId}`).get();
      const senderData = senderDoc.data();

      if (!senderData) {
        throw new HttpsError("not-found", "Sender profile not found");
      }

      // Get recipient data
      const recipientDoc = await db.doc(`users/${data.recipientId}`).get();
      const recipientData = recipientDoc.data();

      if (!recipientData) {
        throw new HttpsError("not-found", "Recipient profile not found");
      }

      // Create or get conversation
      const conversationId = data.conversationId || [senderId, data.recipientId].sort().join("_");
      const conversationRef = db.doc(`conversations/${conversationId}`);

      // Check if conversation exists
      const conversationDoc = await conversationRef.get();
      const now = FieldValue.serverTimestamp();

      if (!conversationDoc.exists) {
        // Create new conversation
        await conversationRef.set({
          id: conversationId,
          participants: [senderId, data.recipientId],
          participantNames: {
            [senderId]: senderData.displayName || "Unknown",
            [data.recipientId]: recipientData.displayName || "Unknown",
          },
          participantPhotos: {
            [senderId]: senderData.photoURL || "",
            [data.recipientId]: recipientData.photoURL || "",
          },
          lastMessage: data.text,
          lastMessageTime: now,
          unreadCount: {
            [senderId]: 0,
            [data.recipientId]: 1,
          },
          createdAt: now,
          updatedAt: now,
        });
      } else {
        // Update existing conversation
        await conversationRef.update({
          lastMessage: data.text,
          lastMessageTime: now,
          [`unreadCount.${data.recipientId}`]: FieldValue.increment(1),
          updatedAt: now,
        });
      }

      // Add message to messages subcollection
      const messageRef = db.collection("messages").doc();
      await messageRef.set({
        id: messageRef.id,
        conversationId: conversationId,
        senderId: senderId,
        senderName: senderData.displayName || "Unknown",
        senderAvatar: senderData.photoURL || "",
        text: data.text,
        attachments: data.attachments || [],
        status: "sent",
        createdAt: now,
      });

      // Create notification for recipient
      await db.collection("notifications").add({
        userId: data.recipientId,
        title: "New Message",
        message: `${senderData.displayName || "Someone"} sent you a message`,
        type: "message",
        read: false,
        link: "/chat",
        createdAt: now,
      });

      return { success: true, messageId: messageRef.id, conversationId };
    } catch (error: unknown) {
      console.error("Error sending message:", error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError("internal", "Failed to send message");
    }
  }
);

// HTTP Function: Upload file to avoid CORS issues
export const uploadFile = onCall(
  {
    region: "us-central1",
    maxInstances: 10,
    timeoutSeconds: 120,
    memory: "1GiB",
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const { storage } = getAdmin();
    const { fileData, fileName, contentType, path } = request.data;

    if (!fileData || !fileName || !path) {
      throw new HttpsError("invalid-argument", "Missing required fields");
    }

    try {
      const bucket = storage.bucket();
      const userId = request.auth.uid;
      const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, "_");
      const timestamp = Date.now();
      const fullPath = `${path}/${userId}/${timestamp}_${sanitizedFileName}`;

      // Convert base64 to buffer
      const buffer = Buffer.from(fileData, "base64");

      const file = bucket.file(fullPath);

      await file.save(buffer, {
        metadata: {
          contentType: contentType || "application/octet-stream",
          metadata: {
            uploadedBy: userId,
            uploadedAt: new Date().toISOString(),
            originalName: fileName,
          },
        },
      });

      // Make file publicly readable
      await file.makePublic();

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fullPath}`;

      return {
        success: true,
        downloadURL: publicUrl,
        path: fullPath,
      };
    } catch (error) {
      console.error("Error uploading file:", error);
      throw new HttpsError("internal", "Error uploading file");
    }
  }
);

// Scheduled Function: Check expired subscriptions
export const checkExpiredSubscriptions = onSchedule(
  {
    schedule: "every 24 hours",
    region: "us-central1",
    timeoutSeconds: 540,
    maxInstances: 1,
    memory: "512MiB",
  },
  async (event) => {
    const { db, FieldValue, Timestamp } = getAdmin();
    console.log("Running scheduled function:", event.scheduleTime);
    const now = Timestamp.now();

    try {
      // Find expired subscriptions
      const expiredSubs = await db.collection("users")
        .where("subscriptionStatus", "==", "active")
        .where("subscriptionEndDate", "<=", now)
        .get();

      const batch = db.batch();

      expiredSubs.forEach((doc: any) => {
        batch.update(doc.ref, {
          subscriptionStatus: "expired",
          isPro: false,
        });

        // Create notification
        const notification = db.collection("notifications").doc();
        batch.set(notification, {
          userId: doc.id,
          title: "Subscription Expired",
          body: "Your subscription has expired. Renew to continue enjoying premium features.",
          type: "system",
          actionUrl: "/billing",
          read: false,
          pushSent: false,
          createdAt: FieldValue.serverTimestamp(),
        });
      });

      await batch.commit();

      console.log(`Updated ${expiredSubs.size} expired subscriptions`);
    } catch (error) {
      console.error("Error in checkExpiredSubscriptions:", error);
    }
  }
);

// Scheduled Function: Calculate daily analytics
export const calculateDailyAnalytics = onSchedule(
  {
    schedule: "every 24 hours",
    region: "us-central1",
    timeoutSeconds: 540,
    maxInstances: 1,
    memory: "1GiB",
  },
  async (event) => {
    const { db, Timestamp } = getAdmin();
    console.log("Calculating daily analytics:", event.scheduleTime);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterdayTimestamp = Timestamp.fromDate(yesterday);
    const todayTimestamp = Timestamp.fromDate(today);

    try {
      // Count new users
      const newUsers = await db.collection("users")
        .where("createdAt", ">=", yesterdayTimestamp)
        .where("createdAt", "<", todayTimestamp)
        .get();

      // Count active users (users who logged in)
      const activeUsers = await db.collection("users")
        .where("lastActive", ">=", yesterdayTimestamp)
        .where("lastActive", "<", todayTimestamp)
        .get();

      // Count new jobs
      const newJobs = await db.collection("jobs")
        .where("createdAt", ">=", yesterdayTimestamp)
        .where("createdAt", "<", todayTimestamp)
        .get();

      // Count completed jobs
      const completedJobs = await db.collection("jobs")
        .where("completedAt", ">=", yesterdayTimestamp)
        .where("completedAt", "<", todayTimestamp)
        .get();

      // Calculate revenue
      const transactions = await db.collection("transactions")
        .where("completedAt", ">=", yesterdayTimestamp)
        .where("completedAt", "<", todayTimestamp)
        .where("status", "==", "completed")
        .get();

      const revenue = {
        subscriptions: 0,
        jobFees: 0,
        total: 0,
      };

      transactions.forEach((doc: any) => {
        const transaction = doc.data();
        revenue.total += transaction.amount;

        switch (transaction.type) {
          case "subscription":
            revenue.subscriptions += transaction.amount;
            break;
          case "escrow":
          case "release":
            revenue.jobFees += transaction.amount * 0.1; // 10% platform fee
            break;
        }
      });

      // Save analytics
      const analyticsId = yesterday.toISOString().split("T")[0]; // YYYY-MM-DD
      await db.doc(`analytics/${analyticsId}`).set({
        date: yesterdayTimestamp,
        newUsers: newUsers.size,
        activeUsers: activeUsers.size,
        totalUsers: (await db.collection("users").get()).size,
        newJobs: newJobs.size,
        activeJobs: (await db.collection("jobs").where("status", "==", "open").get()).size,
        completedJobs: completedJobs.size,
        revenue,
        proposalsSubmitted: (await db.collection("proposals")
          .where("createdAt", ">=", yesterdayTimestamp)
          .where("createdAt", "<", todayTimestamp)
          .get()).size,
        messagesSent: (await db.collection("messages")
          .where("createdAt", ">=", yesterdayTimestamp)
          .where("createdAt", "<", todayTimestamp)
          .get()).size,
      });

      console.log(`Analytics calculated for ${analyticsId}`);
    } catch (error) {
      console.error("Error in calculateDailyAnalytics:", error);
    }
  }
);

// Simple health check for testing
export const healthCheck = onRequest(
  {
    region: "us-central1",
    cors: ALLOWED_ORIGINS,
  },
  (_, response) => {
    response.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "2.0.0",
    });
  }
);

interface AppleReceiptValidationRequest {
  "receipt-data": string;
  password?: string;
  "exclude-old-transactions"?: boolean;
}

interface AppleReceiptValidationResponse {
  status: number;
  receipt: any;
  latest_receipt_info?: any[];
  pending_renewal_info?: any[];
  environment?: "Production" | "Sandbox";
}

/**
 * Validate Apple IAP Receipt
 * Called from frontend after successful purchase
 */
export const validateAppleReceipt = onCall(
  {
    region: "us-central1",
    maxInstances: 10,
    secrets: [stripeSecretKey], // Reuse existing secret config
  },
  async (request) => {
    // Ensure user is authenticated
    if (!request.auth) {
      throw new HttpsError(
        "unauthenticated",
        "User must be authenticated to validate receipts"
      );
    }

    const { userId, receiptData, transactionId, productId, planType } = request.data;

    // Validate input
    if (!userId || !receiptData || !productId) {
      throw new HttpsError(
        "invalid-argument",
        "Missing required fields: userId, receiptData, or productId"
      );
    }

    // Ensure user can only validate their own receipts
    if (request.auth.uid !== userId) {
      throw new HttpsError(
        "permission-denied",
        "You can only validate receipts for your own account"
      );
    }

    try {
      console.log(`🍎 Validating Apple receipt for user ${userId}, product ${productId}`);

      // Try production environment first
      let validationResponse = await validateWithApple(receiptData, false);

      // If receipt is from sandbox, try sandbox environment
      if (validationResponse.status === 21007) {
        console.log("Receipt is from sandbox, retrying with sandbox URL...");
        validationResponse = await validateWithApple(receiptData, true);
      }

      // Check validation status
      if (validationResponse.status !== 0) {
        const errorMessage = getAppleStatusMessage(validationResponse.status);
        console.error(`Apple receipt validation failed: ${errorMessage}`);
        throw new HttpsError(
          "invalid-argument",
          `Receipt validation failed: ${errorMessage}`
        );
      }

      console.log("✅ Receipt validated successfully");

      // Process the validated purchase
      await processAppleIAPPurchase({
        userId,
        receiptData: validationResponse.receipt,
        transactionId,
        productId,
        planType,
        environment: validationResponse.environment || "Production",
      });

      return {
        success: true,
        message: "Subscription activated successfully",
        receipt: validationResponse.receipt,
      };

    } catch (error: any) {
      console.error("Error validating Apple receipt:", error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError(
        "internal",
        `Failed to validate receipt: ${error.message}`
      );
    }
  }
);

/**
 * Validate receipt with Apple's servers
 */
async function validateWithApple(
  receiptData: string,
  sandbox: boolean
): Promise<AppleReceiptValidationResponse> {
  const url = sandbox
    ? "https://sandbox.itunes.apple.com/verifyReceipt"
    : "https://buy.itunes.apple.com/verifyReceipt";

  // Get shared secret from Firebase config
  // Set via: firebase functions:config:set apple.shared_secret="YOUR_SECRET"
  const sharedSecret = functions.config().apple?.shared_secret;

  const requestData: AppleReceiptValidationRequest = {
    "receipt-data": receiptData,
    password: sharedSecret,
    "exclude-old-transactions": true,
  };

  try {
    const response = await axios.post(url, requestData, {
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000, // 10 second timeout
    });

    return response.data;
  } catch (error: any) {
    console.error("Error calling Apple validation API:", error.message);
    throw new Error(`Apple API call failed: ${error.message}`);
  }
}

/**
 * Process validated purchase and update Firestore
 */
async function processAppleIAPPurchase(purchaseData: {
  userId: string;
  receiptData: any;
  transactionId: string;
  productId: string;
  planType: string;
  environment: string;
}) {
  const { db, FieldValue, Timestamp } = getAdmin();
  const batch = db.batch();

  const { userId, receiptData, transactionId, productId, environment } = purchaseData;

  // Determine subscription details based on product ID
  let subscriptionTier: "pro" | "messages" = "pro";
  let subscriptionPlan = "monthly";
  let subscriptionDuration = 30; // days

  if (productId === "03") {
    // Messages subscription
    subscriptionTier = "messages";
    subscriptionPlan = "messages";
    subscriptionDuration = 30;
  } else if (productId === "01") {
    // Pro Monthly
    subscriptionTier = "pro";
    subscriptionPlan = "monthly";
    subscriptionDuration = 30;
  } else if (productId === "02") {
    // Pro 6 Months
    subscriptionTier = "pro";
    subscriptionPlan = "sixmonths";
    subscriptionDuration = 180;
  }

  // Calculate subscription dates
  const now = new Date();
  const startDate = Timestamp.now();
  const endDate = Timestamp.fromDate(
    new Date(now.getTime() + subscriptionDuration * 24 * 60 * 60 * 1000)
  );

  // Update user document
  const userRef = db.collection("users").doc(userId);
  batch.update(userRef, {
    subscriptionTier,
    subscriptionStatus: "active",
    subscriptionPlan,
    subscriptionPlatform: "apple",
    subscriptionStartDate: startDate,
    subscriptionEndDate: endDate,
    isPro: subscriptionTier === "pro",
    appleTransactionId: transactionId,
    appleProductId: productId,
    appleEnvironment: environment,
    updatedAt: FieldValue.serverTimestamp(),
  });

  // Log transaction
  const transactionRef = db.collection("transactions").doc();
  batch.set(transactionRef, {
    type: "apple_iap",
    userId,
    subscriptionTier,
    subscriptionPlan,
    productId,
    transactionId,
    amount: getProductPrice(productId),
    currency: "USD",
    platformFee: 0.30, // Apple takes 30%
    status: "completed",
    platform: "apple",
    environment,
    receiptData: JSON.stringify(receiptData),
    createdAt: FieldValue.serverTimestamp(),
    completedAt: FieldValue.serverTimestamp(),
  });

  // Commit batch
  await batch.commit();

  console.log(`✅ User ${userId} subscription updated: ${subscriptionTier} (${subscriptionPlan})`);
}

/**
 * Get product price based on product ID
 */
function getProductPrice(productId: string): number {
  const prices: Record<string, number> = {
    "01": 9.99,   // Pro Monthly
    "02": 47.99,  // Pro 6 Months
    "03": 3.00,    // Messages
  };
  return prices[productId] || 0;
}

/**
 * Get human-readable error message for Apple status codes
 */
function getAppleStatusMessage(status: number): string {
  const messages: Record<number, string> = {
    0: "Success",
    21000: "The App Store could not read the JSON object you provided",
    21002: "The receipt-data property was malformed or missing",
    21003: "The receipt could not be authenticated",
    21004: "The shared secret you provided does not match",
    21005: "The receipt server is not currently available",
    21006: "This receipt is valid but the subscription has expired",
    21007: "This receipt is from the test environment",
    21008: "This receipt is from the production environment",
    21009: "Internal data access error",
    21010: "The user account cannot be found or has been deleted",
  };

  return messages[status] || `Unknown error (status ${status})`;
}

// ========================================
// END OF APPLE IAP FUNCTIONS
// ========================================