// functions/src/index.ts
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onCall, HttpsError, onRequest } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";

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

function getStripe(): any {
  if (!stripe) {
    // Lazy load the stripe module
    if (!stripeModule) {
      stripeModule = require("stripe");
    }
    const secretKey = stripeSecretKey.value();
    if (!secretKey) {
      throw new Error("Stripe secret key not configured");
    }
    stripe = new stripeModule(secretKey);
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
  'AU', 'AT', 'BE', 'BR', 'BG', 'CA', 'HR', 'CY', 'CZ', 'DK',
  'EE', 'FI', 'FR', 'DE', 'GI', 'GR', 'HK', 'HU', 'IN', 'IE',
  'IT', 'JP', 'LV', 'LI', 'LT', 'LU', 'MY', 'MT', 'MX', 'NL',
  'NZ', 'NO', 'PL', 'PT', 'RO', 'SG', 'SK', 'SI', 'ES', 'SE',
  'CH', 'TH', 'AE', 'GB', 'US'
];

function isValidCountryCode(country: string): boolean {
  if (!country || typeof country !== 'string' || country.length !== 2) {
    return false;
  }
  return STRIPE_SUPPORTED_COUNTRIES.includes(country.toUpperCase());
}

function getDefaultCurrencyForCountry(country: string): string {
  const currencyMap: Record<string, string> = {
    'US': 'usd', 'GB': 'gbp', 'AU': 'aud', 'CA': 'cad', 'JP': 'jpy',
    'IN': 'inr', 'SG': 'sgd', 'HK': 'hkd', 'NZ': 'nzd', 'MX': 'mxn',
    'BR': 'brl', 'TH': 'thb', 'MY': 'myr', 'AE': 'aed', 'CH': 'chf',
    'SE': 'sek', 'NO': 'nok', 'DK': 'dkk', 'PL': 'pln', 'CZ': 'czk',
    'HU': 'huf', 'RO': 'ron', 'BG': 'bgn', 'HR': 'hrk',
    // EU countries default to EUR
    'AT': 'eur', 'BE': 'eur', 'CY': 'eur', 'EE': 'eur', 'FI': 'eur',
    'FR': 'eur', 'DE': 'eur', 'GR': 'eur', 'IE': 'eur', 'IT': 'eur',
    'LV': 'eur', 'LT': 'eur', 'LU': 'eur', 'MT': 'eur', 'NL': 'eur',
    'PT': 'eur', 'SK': 'eur', 'SI': 'eur', 'ES': 'eur', 'LI': 'eur',
    'GI': 'eur',
  };
  
  return currencyMap[country.toUpperCase()] || 'usd';
}

// REPLACE your existing createStripeConnectAccount function with this:
export const createStripeConnectAccount = onCall(
  {
    region: "us-central1",
    cors: true,
    maxInstances: 10,
    secrets: [stripeSecretKey],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const { db, FieldValue } = getAdmin();
    const { userId, country, businessType = "individual" } = request.data;

    // SECURITY FIX: Verify user can only create their own account
    if (userId !== request.auth.uid) {
      throw new HttpsError("permission-denied", "You can only create your own Stripe account");
    }

    // Validate country code
    if (!country || !isValidCountryCode(country)) {
      throw new HttpsError("invalid-argument", "Valid country code is required");
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
      const stripe = getStripe();
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

      // Create account link for onboarding
      const accountLink = await stripe.accountLinks.create({
        account: account.id,
        refresh_url: `https://beamly-app.web.app/profile/edit?stripe_connect=refresh&country=${country}`,
        return_url: `https://beamly-app.web.app/profile/edit?stripe_connect=success&country=${country}`,
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
      if ((error as any).type === 'StripeInvalidRequestError') {
        if ((error as any).message.includes('country')) {
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
    cors: true,
    maxInstances: 10,
  },
  async (request) => {
    // This doesn't require authentication as it's public information
    
    const countryNames: Record<string, string> = {
      'AU': 'Australia', 'AT': 'Austria', 'BE': 'Belgium', 'BR': 'Brazil',
      'BG': 'Bulgaria', 'CA': 'Canada', 'HR': 'Croatia', 'CY': 'Cyprus',
      'CZ': 'Czech Republic', 'DK': 'Denmark', 'EE': 'Estonia', 'FI': 'Finland',
      'FR': 'France', 'DE': 'Germany', 'GI': 'Gibraltar', 'GR': 'Greece',
      'HK': 'Hong Kong', 'HU': 'Hungary', 'IN': 'India', 'IE': 'Ireland',
      'IT': 'Italy', 'JP': 'Japan', 'LV': 'Latvia', 'LI': 'Liechtenstein',
      'LT': 'Lithuania', 'LU': 'Luxembourg', 'MY': 'Malaysia', 'MT': 'Malta',
      'MX': 'Mexico', 'NL': 'Netherlands', 'NZ': 'New Zealand', 'NO': 'Norway',
      'PL': 'Poland', 'PT': 'Portugal', 'RO': 'Romania', 'SG': 'Singapore',
      'SK': 'Slovakia', 'SI': 'Slovenia', 'ES': 'Spain', 'SE': 'Sweden',
      'CH': 'Switzerland', 'TH': 'Thailand', 'AE': 'United Arab Emirates',
      'GB': 'United Kingdom', 'US': 'United States',
    };
    
    const countries = STRIPE_SUPPORTED_COUNTRIES.map(code => ({
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
    cors: true,
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
      const stripe = getStripe();
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
    cors: true,
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

      const stripe = getStripe();
      const accountLink = await stripe.accountLinks.create({
        account: accountId,
        refresh_url: refreshUrl || "https://beamly-app.web.app/profile/edit?stripe_connect=refresh",
        return_url: returnUrl || "https://beamly-app.web.app/profile/edit?stripe_connect=success",
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

// Create Payment Intent for Job (Escrow)
export const createJobPaymentIntent = onCall(
  {
    region: "us-central1",
    cors: true,
    maxInstances: 10,
    secrets: [stripeSecretKey],
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const { db, FieldValue } = getAdmin();
    const { jobId, proposalId, amount } = request.data;

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

      // Create payment intent with metadata
      const stripe = getStripe();
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          jobId,
          proposalId,
          clientId: request.auth.uid,
          freelancerId: proposalData.freelancerId,
          type: "job_payment",
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
        amount,
        currency: "usd",
        status: "pending",
        type: "job_payment",
        stripePaymentIntentId: paymentIntent.id,
        createdAt: FieldValue.serverTimestamp(),
      });

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

// Release Payment to Freelancer
export const releasePaymentToFreelancer = onCall(
  {
    region: "us-central1",
    cors: true,
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
      // Get freelancer's Connect account
      const freelancerDoc = await db.doc(`users/${freelancerId}`).get();
      const connectAccountId = freelancerDoc.data()?.stripeConnectAccountId;

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

      // Calculate platform fee (e.g., 10%)
      const platformFeePercent = 0.10;
      const amount = paymentData.amount;
      const platformFee = Math.round(amount * platformFeePercent * 100); // In cents
      const freelancerAmount = Math.round(amount * 100) - platformFee; // In cents

      // Create transfer to freelancer
      const stripe = getStripe();
      const transfer = await stripe.transfers.create({
        amount: freelancerAmount,
        currency: "usd",
        destination: connectAccountId,
        metadata: {
          jobId,
          freelancerId,
          paymentId: paymentDoc.id,
        },
      });

      // Update payment status
      await paymentDoc.ref.update({
        status: "released",
        releasedAt: FieldValue.serverTimestamp(),
        stripeTransferId: transfer.id,
        platformFee: platformFee / 100,
        freelancerAmount: freelancerAmount / 100,
      });

      // Update freelancer's earnings
      await db.doc(`users/${freelancerId}`).update({
        totalEarnings: FieldValue.increment(freelancerAmount / 100),
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
    cors: true,
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
        const stripe = getStripe();
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
      const stripe = getStripe();
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
    cors: true,
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
      const stripe = getStripe();
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
    cors: true,
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
      const stripe = getStripe();
      const payout = await stripe.payouts.create(
        {
          amount: Math.round(amount * 100), // Convert to cents
          currency: "usd",
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
        currency: "usd",
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
    cors: true,
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
        };
      }

      // Get balance from connected account
      const stripe = getStripe();
      const balance = await stripe.balance.retrieve({
        stripeAccount: connectAccountId,
      });

      // Sum available balance across all currencies
      const available = balance.available.reduce((sum: number, bal: any) => sum + bal.amount, 0) / 100;
      const pending = balance.pending.reduce((sum: number, bal: any) => sum + bal.amount, 0) / 100;

      return {
        success: true,
        available,
        pending,
      };
    } catch (error: unknown) {
      console.error("Error getting balance:", error);
      throw new HttpsError("internal", (error as Error).message);
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
      const stripe = getStripe();
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        sig,
        stripeWebhookSecret.value()
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
  if (!userId || !session.subscription) return;

  const stripe = getStripe();
  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);

  // Determine plan type based on price
  let planType = "monthly";
  const priceId = subscription.items.data[0].price.id;
  if (priceId === process.env.STRIPE_QUARTERLY_PRICE_ID) planType = "quarterly";
  if (priceId === process.env.STRIPE_YEARLY_PRICE_ID) planType = "yearly";

  await db.doc(`users/${userId}`).update({
    subscriptionStatus: "active",
    subscriptionPlan: planType,
    stripeSubscriptionId: subscription.id,
    subscriptionStartDate: Timestamp.fromDate(new Date((subscription as any).current_period_start * 1000)),
    subscriptionEndDate: Timestamp.fromDate(new Date((subscription as any).current_period_end * 1000)),
    isPro: true,
  });

  // Create transaction record
  await db.collection("transactions").add({
    type: "subscription",
    userId,
    amount: (session.amount_total || 0) / 100,
    currency: session.currency || "usd",
    status: "completed",
    stripeSessionId: session.id,
    description: `${planType} subscription`,
    createdAt: FieldValue.serverTimestamp(),
    completedAt: FieldValue.serverTimestamp(),
  });
}

async function handleSubscriptionPayment(invoice: any) {
  const { db, FieldValue } = getAdmin();
  // Log the payment for records
  await db.collection("transactions").add({
    type: "subscription",
    userId: invoice.metadata?.userId,
    amount: invoice.amount_paid / 100,
    currency: invoice.currency,
    status: "completed",
    stripeInvoiceId: invoice.id,
    description: "Subscription renewal",
    createdAt: FieldValue.serverTimestamp(),
    completedAt: FieldValue.serverTimestamp(),
  });
}

async function handleSubscriptionCancelled(subscription: any) {
  const { db } = getAdmin();
  const customerId = subscription.customer as string;

  // Find user by customer ID
  const usersQuery = await db.collection("users")
    .where("stripeCustomerId", "==", customerId)
    .limit(1)
    .get();

  if (!usersQuery.empty) {
    const userDoc = usersQuery.docs[0];
    await userDoc.ref.update({
      subscriptionStatus: "cancelled",
      isPro: false,
    });
  }
}

async function handleJobPaymentSucceeded(paymentIntent: any) {
  const { db, FieldValue } = getAdmin();
  const { jobId, proposalId, freelancerId } = paymentIntent.metadata;

  // Update payment record
  await db.doc(`payments/${paymentIntent.id}`).update({
    status: "held_in_escrow",
    paidAt: FieldValue.serverTimestamp(),
  });

  // Update proposal status
  await db.doc(`proposals/${proposalId}`).update({
    status: "accepted",
    acceptedAt: FieldValue.serverTimestamp(),
  });

  // Update job status
  await db.doc(`jobs/${jobId}`).update({
    status: "in_progress",
    paymentStatus: "escrow",
    assignedFreelancerId: freelancerId,
    assignedProposalId: proposalId,
  });

  // Create notification for freelancer
  await db.collection("notifications").add({
    userId: freelancerId,
    type: "proposal",
    title: "Proposal Accepted!",
    body: "Your proposal has been accepted and the client has made the payment.",
    data: { jobId, proposalId },
    read: false,
    createdAt: FieldValue.serverTimestamp(),
  });
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
    cors: true,
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

// HTTP Function: Submit Proposal
export const submitProposal = onCall(
  {
    cors: true,
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

      // Use a transaction to ensure consistency
      await db.runTransaction(async (transaction: any) => {
        // Create proposal
        transaction.set(proposalRef, proposalData);

        // Increment proposal count on job
        const jobRef = db.doc(`jobs/${data.jobId}`);
        transaction.update(jobRef, {
          proposalCount: FieldValue.increment(1),
          updatedAt: now,
        });
      });

      // Trigger will handle notification creation

      return { success: true, proposalId: proposalRef.id };
    } catch (error: unknown) {
      console.error("Error submitting proposal:", error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError("internal", "Failed to submit proposal");
    }
  }
);

// HTTP Function: Send Message
export const sendMessage = onCall(
  {
    cors: true,
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
    cors: true,
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
    cors: true,
  },
  (request, response) => {
    response.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "2.0.0",
    });
  }
);