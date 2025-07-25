// functions/src/stripe.ts
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import Stripe from "stripe";

// Initialize Stripe with your secret key
const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: "2023-10-16",
});

const db = admin.firestore();

// Create Stripe Connect Account for Freelancers
export const createStripeConnectAccount = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const { userId } = data;

  try {
    // Create Express account for freelancer
    const account = await stripe.accounts.create({
      type: "express",
      country: "CZ", // Czech Republic based on your screenshots
      email: context.auth.token.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",
      metadata: {
        userId,
      },
    });

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${functions.config().app.url}/billing?stripe_connect=refresh`,
      return_url: `${functions.config().app.url}/billing?stripe_connect=success`,
      type: "account_onboarding",
    });

    return {
      success: true,
      accountId: account.id,
      onboardingUrl: accountLink.url,
    };
  } catch (error: any) {
    console.error("Error creating Connect account:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Check Stripe Connect Account Status
export const checkStripeConnectStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const { accountId } = data;

  try {
    const account = await stripe.accounts.retrieve(accountId);

    await db.doc(`users/${context.auth.uid}`).update({
      stripeConnectStatus: account.details_submitted ? "active" : "pending",
      stripeConnectChargesEnabled: account.charges_enabled,
      stripeConnectPayoutsEnabled: account.payouts_enabled,
    });

    return {
      success: true,
      status: account.details_submitted ? "active" : "pending",
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
    };
  } catch (error: any) {
    console.error("Error checking Connect status:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Create Account Link for Re-onboarding
export const createStripeAccountLink = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const { userId, returnUrl, refreshUrl } = data;

  try {
    const userDoc = await db.doc(`users/${userId}`).get();
    const accountId = userDoc.data()?.stripeConnectAccountId;

    if (!accountId) {
      throw new functions.https.HttpsError("not-found", "No Connect account found");
    }

    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: "account_onboarding",
    });

    return {
      success: true,
      url: accountLink.url,
    };
  } catch (error: any) {
    console.error("Error creating account link:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Create Payment Intent for Job (Escrow)
export const createJobPaymentIntent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const { jobId, proposalId, amount } = data;

  try {
    // Get job and proposal details
    const jobDoc = await db.doc(`jobs/${jobId}`).get();
    const proposalDoc = await db.doc(`proposals/${proposalId}`).get();

    if (!jobDoc.exists || !proposalDoc.exists) {
      throw new functions.https.HttpsError("not-found", "Job or proposal not found");
    }

    const jobData = jobDoc.data()!;
    const proposalData = proposalDoc.data()!;

    // Create payment intent with metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      metadata: {
        jobId,
        proposalId,
        clientId: context.auth.uid,
        freelancerId: proposalData.freelancerId,
        type: "job_payment",
      },
      // Hold funds but don't transfer yet
      capture_method: "automatic",
      setup_future_usage: "off_session",
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error: any) {
    console.error("Error creating payment intent:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Release Payment to Freelancer
export const releasePaymentToFreelancer = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const { jobId, freelancerId } = data;

  try {
    // Get freelancer's Connect account
    const freelancerDoc = await db.doc(`users/${freelancerId}`).get();
    const connectAccountId = freelancerDoc.data()?.stripeConnectAccountId;

    if (!connectAccountId) {
      throw new functions.https.HttpsError("failed-precondition", "Freelancer has no Connect account");
    }

    // Get payment details
    const paymentsQuery = await db.collection("payments")
      .where("jobId", "==", jobId)
      .where("status", "==", "held_in_escrow")
      .limit(1)
      .get();

    if (paymentsQuery.empty) {
      throw new functions.https.HttpsError("not-found", "No payment found for this job");
    }

    const paymentDoc = paymentsQuery.docs[0];
    const paymentData = paymentDoc.data();

    // Calculate platform fee (e.g., 10%)
    const platformFeePercent = 0.10;
    const amount = paymentData.amount;
    const platformFee = Math.round(amount * platformFeePercent * 100); // In cents
    const freelancerAmount = Math.round(amount * 100) - platformFee; // In cents

    // Create transfer to freelancer
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
      releasedAt: admin.firestore.FieldValue.serverTimestamp(),
      transferId: transfer.id,
      platformFee: platformFee / 100,
      freelancerAmount: freelancerAmount / 100,
    });

    // Update freelancer's earnings
    await db.doc(`users/${freelancerId}`).update({
      totalEarnings: admin.firestore.FieldValue.increment(freelancerAmount / 100),
      completedJobs: admin.firestore.FieldValue.increment(1),
    });

    return {
      success: true,
      transferId: transfer.id,
    };
  } catch (error: any) {
    console.error("Error releasing payment:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Create Subscription Checkout Session
export const createSubscriptionCheckout = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const { userId, priceId, successUrl, cancelUrl } = data;

  try {
    // Check if user already has a Stripe customer ID
    const userDoc = await db.doc(`users/${userId}`).get();
    let customerId = userDoc.data()?.stripeCustomerId;

    // Create customer if doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: context.auth.token.email,
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
  } catch (error: any) {
    console.error("Error creating subscription checkout:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Cancel Subscription
export const cancelSubscription = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const { userId } = data;

  try {
    const userDoc = await db.doc(`users/${userId}`).get();
    const subscriptionId = userDoc.data()?.stripeSubscriptionId;

    if (!subscriptionId) {
      throw new functions.https.HttpsError("not-found", "No active subscription found");
    }

    // Cancel at period end (allow access until end of billing period)
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    return {
      success: true,
      endDate: new Date(subscription.current_period_end * 1000),
    };
  } catch (error: any) {
    console.error("Error cancelling subscription:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Create Payout for Freelancer
export const createStripePayout = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const { userId, amount } = data;

  try {
    const userDoc = await db.doc(`users/${userId}`).get();
    const connectAccountId = userDoc.data()?.stripeConnectAccountId;

    if (!connectAccountId) {
      throw new functions.https.HttpsError("failed-precondition", "No Connect account found");
    }

    // Create payout in connected account
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

    return {
      success: true,
      payoutId: payout.id,
    };
  } catch (error: any) {
    console.error("Error creating payout:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Get Stripe Balance
export const getStripeBalance = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const { userId } = data;

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
    const balance = await stripe.balance.retrieve({
      stripeAccount: connectAccountId,
    });

    // Sum available balance across all currencies
    const available = balance.available.reduce((sum, bal) => sum + bal.amount, 0) / 100;
    const pending = balance.pending.reduce((sum, bal) => sum + bal.amount, 0) / 100;

    return {
      success: true,
      available,
      pending,
    };
  } catch (error: any) {
    console.error("Error getting balance:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});

// Webhook to handle Stripe events
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;
  const endpointSecret = functions.config().stripe.webhook_secret;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      
      // Handle subscription creation
      if (session.mode === "subscription") {
        await handleSubscriptionCreated(session);
      }
      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      
      // Handle recurring subscription payment
      if (invoice.subscription) {
        await handleSubscriptionPayment(invoice);
      }
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionCancelled(subscription);
      break;
    }

    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      
      // Handle job payment
      if (paymentIntent.metadata.type === "job_payment") {
        await handleJobPaymentSucceeded(paymentIntent);
      }
      break;
    }

    case "account.updated": {
      const account = event.data.object as Stripe.Account;
      await handleConnectAccountUpdated(account);
      break;
    }
  }

  res.json({ received: true });
});

// Helper functions for webhook handlers
async function handleSubscriptionCreated(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) return;

  const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
  
  // Determine plan type based on price
  let planType = "monthly";
  const priceId = subscription.items.data[0].price.id;
  if (priceId === functions.config().stripe.quarterly_price_id) planType = "quarterly";
  if (priceId === functions.config().stripe.yearly_price_id) planType = "yearly";

  await db.doc(`users/${userId}`).update({
    subscriptionStatus: "active",
    subscriptionPlan: planType,
    stripeSubscriptionId: subscription.id,
    subscriptionStartDate: admin.firestore.Timestamp.fromDate(new Date(subscription.current_period_start * 1000)),
    subscriptionEndDate: admin.firestore.Timestamp.fromDate(new Date(subscription.current_period_end * 1000)),
    isPro: true,
  });
}

async function handleSubscriptionPayment(invoice: Stripe.Invoice) {
  // Log the payment for records
  await db.collection("transactions").add({
    type: "subscription",
    userId: invoice.metadata?.userId,
    amount: invoice.amount_paid / 100,
    currency: invoice.currency,
    status: "completed",
    stripeInvoiceId: invoice.id,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
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

async function handleJobPaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  const { jobId, proposalId, clientId, freelancerId } = paymentIntent.metadata;

  // Update payment record
  await db.collection("payments")
    .where("stripePaymentIntentId", "==", paymentIntent.id)
    .get()
    .then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        doc.ref.update({
          status: "held_in_escrow",
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });
    });

  // Update proposal status
  await db.doc(`proposals/${proposalId}`).update({
    status: "accepted",
    acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Create notification for freelancer
  await db.collection("notifications").add({
    userId: freelancerId,
    type: "proposal_accepted",
    title: "Proposal Accepted!",
    body: "Your proposal has been accepted and the client has made the payment.",
    data: { jobId, proposalId },
    read: false,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function handleConnectAccountUpdated(account: Stripe.Account) {
  const userId = account.metadata?.userId;
  if (!userId) return;

  await db.doc(`users/${userId}`).update({
    stripeConnectChargesEnabled: account.charges_enabled,
    stripeConnectPayoutsEnabled: account.payouts_enabled,
    stripeConnectDetailsSubmitted: account.details_submitted,
  });
}