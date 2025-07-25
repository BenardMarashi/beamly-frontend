// functions/src/index.ts
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onCall, HttpsError, onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
const Stripe = require("stripe");

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();
const storage = admin.storage();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_dummy_key_for_deployment", {
  apiVersion: "2024-11-20.acacia",
});

// Trigger: Send notification when a new proposal is received
export const onNewProposal = onDocumentCreated("proposals/{proposalId}", async (event) => {
  const proposal = event.data?.data();
  const proposalId = event.params.proposalId;

  if (!proposal) return;

  try {
    // Get job details
    const jobDoc = await db.doc(`job/${proposal.jobId}`).get();
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
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Send push notification if FCM token exists
    const clientDoc = await db.doc(`users/${job.clientId}`).get();
    const client = clientDoc.data();

    if (client?.fcmToken) {
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
});

// Trigger: Send notification when a proposal is accepted
export const onProposalAccepted = onDocumentUpdated("proposals/{proposalId}", async (event) => {
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
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
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
});

// Trigger: Send notification for new messages
export const onNewMessage = onDocumentCreated("messages/{messageId}", async (event) => {
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
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Update unread count in conversation
    await db.doc(`conversations/${message.conversationId}`).update({
      [`unreadCount.${recipientId}`]: admin.firestore.FieldValue.increment(1),
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
});

// Stripe Connect Functions
// Create Stripe Connect Account for Freelancers
export const createStripeConnectAccount = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const { userId } = request.data;

  try {
    // Get user data
    const userDoc = await db.doc(`users/${userId}`).get();
    const userData = userDoc.data();

    if (!userData) {
      throw new HttpsError("not-found", "User not found");
    }

    // Create Express account for freelancer
    const account = await stripe.accounts.create({
      type: "express",
      country: "CZ", // Czech Republic based on your screenshots
      email: userData.email,
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
      refresh_url: `${process.env.APP_URL || "https://localhost:5173"}/profile/edit?stripe_connect=refresh`,
      return_url: `${process.env.APP_URL || "https://localhost:5173"}/profile/edit?stripe_connect=success`,
      type: "account_onboarding",
    });

    // Update user document with Stripe account ID
    await db.doc(`users/${userId}`).update({
      stripeConnectAccountId: account.id,
      stripeConnectStatus: "pending",
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      accountId: account.id,
      onboardingUrl: accountLink.url,
    };
  } catch (error: any) {
    console.error("Error creating Connect account:", error);
    throw new HttpsError("internal", error.message);
  }
});

// Check Stripe Connect Account Status
export const checkStripeConnectStatus = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const { accountId } = request.data;

  try {
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
  } catch (error: any) {
    console.error("Error checking Connect status:", error);
    throw new HttpsError("internal", error.message);
  }
});

// Create Account Link for Re-onboarding
export const createStripeAccountLink = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const { userId, returnUrl, refreshUrl } = request.data;

  try {
    const userDoc = await db.doc(`users/${userId}`).get();
    const accountId = userDoc.data()?.stripeConnectAccountId;

    if (!accountId) {
      throw new HttpsError("not-found", "No Connect account found");
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
    throw new HttpsError("internal", error.message);
  }
});

// Create Payment Intent for Job (Escrow)
export const createJobPaymentIntent = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const { jobId, proposalId, amount } = request.data;

  try {
    // Get job and proposal details
    const jobDoc = await db.doc(`jobs/${jobId}`).get();
    const proposalDoc = await db.doc(`proposals/${proposalId}`).get();

    if (!jobDoc.exists || !proposalDoc.exists) {
      throw new HttpsError("not-found", "Job or proposal not found");
    }
    const proposalData = proposalDoc.data()!;

    // Create payment intent with metadata
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
      // Hold funds but don't transfer yet
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
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error: any) {
    console.error("Error creating payment intent:", error);
    throw new HttpsError("internal", error.message);
  }
});

// Release Payment to Freelancer
export const releasePaymentToFreelancer = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

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
      stripeTransferId: transfer.id,
      platformFee: platformFee / 100,
      freelancerAmount: freelancerAmount / 100,
    });

    // Update freelancer's earnings
    await db.doc(`users/${freelancerId}`).update({
      totalEarnings: admin.firestore.FieldValue.increment(freelancerAmount / 100),
      completedJobs: admin.firestore.FieldValue.increment(1),
    });

    // Update job status
    await db.doc(`jobs/${jobId}`).update({
      status: "completed",
      paymentStatus: "released",
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      transferId: transfer.id,
    };
  } catch (error: any) {
    console.error("Error releasing payment:", error);
    throw new HttpsError("internal", error.message);
  }
});

// Create Subscription Checkout Session
export const createSubscriptionCheckout = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const { userId, priceId, successUrl, cancelUrl } = request.data;

  try {
    // Check if user already has a Stripe customer ID
    const userDoc = await db.doc(`users/${userId}`).get();
    let customerId = userDoc.data()?.stripeCustomerId;

    // Create customer if doesn't exist
    if (!customerId) {
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
    throw new HttpsError("internal", error.message);
  }
});

// Cancel Subscription
export const cancelSubscription = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const { userId } = request.data;

  try {
    const userDoc = await db.doc(`users/${userId}`).get();
    const subscriptionId = userDoc.data()?.stripeSubscriptionId;

    if (!subscriptionId) {
      throw new HttpsError("not-found", "No active subscription found");
    }

    // Cancel at period end (allow access until end of billing period)
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });

    return {
      success: true,
      endDate: new Date((subscription as any).current_period_end * 1000),
    };
  } catch (error: any) {
    console.error("Error cancelling subscription:", error);
    throw new HttpsError("internal", error.message);
  }
});

// Create Payout for Freelancer
export const createStripePayout = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const { userId, amount } = request.data;

  try {
    const userDoc = await db.doc(`users/${userId}`).get();
    const connectAccountId = userDoc.data()?.stripeConnectAccountId;

    if (!connectAccountId) {
      throw new HttpsError("failed-precondition", "No Connect account found");
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

    // Record transaction
    await db.collection("transactions").add({
      type: "withdrawal",
      userId,
      amount,
      currency: "usd",
      status: "pending",
      stripePayoutId: payout.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      payoutId: payout.id,
    };
  } catch (error: any) {
    console.error("Error creating payout:", error);
    throw new HttpsError("internal", error.message);
  }
});

// Get Stripe Balance
export const getStripeBalance = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

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
  } catch (error: any) {
    console.error("Error getting balance:", error);
    throw new HttpsError("internal", error.message);
  }
});

// Webhook to handle Stripe events
export const stripeWebhook = onRequest(async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: any;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret!);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
  case "checkout.session.completed": {
    const session = event.data.object;

    // Handle subscription creation
    if (session.mode === "subscription" && session.subscription) {
      await handleSubscriptionCreated(session);
    }
    break;
  }

  case "invoice.payment_succeeded": {
    const invoice = event.data.object;

    // Handle recurring subscription payment
    if (invoice.subscription) {
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

    // Handle job payment
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
});

// Helper functions for webhook handlers
async function handleSubscriptionCreated(session: any) {
  const userId = session.metadata?.userId;
  if (!userId || !session.subscription) return;

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
    subscriptionStartDate: admin.firestore.Timestamp.fromDate(new Date(subscription.current_period_start * 1000)),
    subscriptionEndDate: admin.firestore.Timestamp.fromDate(new Date(subscription.current_period_end * 1000)),
    isPro: true,
  });

  // Create transaction record
  await db.collection("transactions").add({
    type: "subscription",
    userId,
    amount: session.amount_total! / 100,
    currency: session.currency!,
    status: "completed",
    stripeSessionId: session.id,
    description: `${planType} subscription`,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function handleSubscriptionPayment(invoice: any) {
  // Log the payment for records
  await db.collection("transactions").add({
    type: "subscription",
    userId: invoice.metadata?.userId,
    amount: invoice.amount_paid / 100,
    currency: invoice.currency,
    status: "completed",
    stripeInvoiceId: invoice.id,
    description: "Subscription renewal",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function handleSubscriptionCancelled(subscription: any) {
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
  const { jobId, proposalId, freelancerId } = paymentIntent.metadata;

  // Update payment record
  await db.doc(`payments/${paymentIntent.id}`).update({
    status: "held_in_escrow",
    paidAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  // Update proposal status
  await db.doc(`proposals/${proposalId}`).update({
    status: "accepted",
    acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
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
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function handleConnectAccountUpdated(account: any) {
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
    cors: true, // Enable CORS
    maxInstances: 10,
  },
  async (request) => {
    // Verify user is authenticated
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

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
      const now = admin.firestore.FieldValue.serverTimestamp();

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
    } catch (error: any) {
      console.error("Error creating job:", error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError("internal", "Failed to create job");
    }
  }
);

// Helper function: Notify freelancers about new job
async function notifyFreelancersAboutNewJob(job: any) {
  try {
    // Query freelancers with matching skills
    const freelancersSnapshot = await db.collection("users")
      .where("userType", "in", ["freelancer", "both"])
      .where("skills", "array-contains-any", job.skills.slice(0, 10))
      .where("isAvailable", "==", true)
      .limit(50)
      .get();

    const batch = db.batch();
    const now = admin.firestore.FieldValue.serverTimestamp();

    freelancersSnapshot.docs.forEach((doc) => {
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
  },
  async (request) => {
    // Verify user is authenticated
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

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
      const now = admin.firestore.FieldValue.serverTimestamp();

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
      await db.runTransaction(async (transaction) => {
        // Create proposal
        transaction.set(proposalRef, proposalData);

        // Increment proposal count on job
        const jobRef = db.doc(`jobs/${data.jobId}`);
        transaction.update(jobRef, {
          proposalCount: admin.firestore.FieldValue.increment(1),
          updatedAt: now,
        });
      });

      // Trigger will handle notification creation

      return { success: true, proposalId: proposalRef.id };
    } catch (error: any) {
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
  },
  async (request) => {
    // Verify user is authenticated
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

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
      const now = admin.firestore.FieldValue.serverTimestamp();

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
          [`unreadCount.${data.recipientId}`]: admin.firestore.FieldValue.increment(1),
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
    } catch (error: any) {
      console.error("Error sending message:", error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError("internal", "Failed to send message");
    }
  }
);

// HTTP Function: Upload file to avoid CORS issues
export const uploadFile = onCall({ cors: true }, async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

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
});

// Scheduled Function: Check expired subscriptions
export const checkExpiredSubscriptions = onSchedule("every 24 hours", async (event) => {
  console.log("Running scheduled function:", event.scheduleTime);
  const now = admin.firestore.Timestamp.now();

  try {
    // Find expired subscriptions
    const expiredSubs = await db.collection("users")
      .where("subscriptionStatus", "==", "active")
      .where("subscriptionEndDate", "<=", now)
      .get();

    const batch = db.batch();

    expiredSubs.forEach((doc) => {
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
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    console.log(`Updated ${expiredSubs.size} expired subscriptions`);
  } catch (error) {
    console.error("Error in checkExpiredSubscriptions:", error);
  }
});

// Scheduled Function: Calculate daily analytics
export const calculateDailyAnalytics = onSchedule("every 24 hours", async (event) => {
  console.log("Calculating daily analytics:", event.scheduleTime);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  yesterday.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterdayTimestamp = admin.firestore.Timestamp.fromDate(yesterday);
  const todayTimestamp = admin.firestore.Timestamp.fromDate(today);

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

    transactions.forEach((doc) => {
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
});