// functions/src/index.ts

import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

// Trigger: Send notification when a new proposal is received
export const onNewProposal = functions.firestore
  .document("proposals/{proposalId}")
  .onCreate(async (snap, context) => {
    const proposal = snap.data();
    const proposalId = context.params.proposalId;

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
export const onProposalAccepted = functions.firestore
  .document("proposals/{proposalId}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Check if proposal was just accepted
    if (before.status !== "accepted" && after.status === "accepted") {
      try {
        // Create notification for freelancer
        await db.collection("notifications").add({
          userId: after.freelancerId,
          title: "Proposal Accepted!",
          body: "Your proposal has been accepted. A contract has been created.",
          type: "contract",
          actionUrl: "/contracts",
          actionData: {
            proposalId: context.params.proposalId,
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
              body: "Your proposal has been accepted. A contract has been created.",
            },
            data: {
              type: "contract",
              proposalId: context.params.proposalId,
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
export const onNewMessage = functions.firestore
  .document("messages/{messageId}")
  .onCreate(async (snap, context) => {
    const message = snap.data();

    try {
      // Determine recipient
      const conversationParts = message.conversationId.split("_");
      const recipientId = conversationParts.find((id: string) => id !== message.senderId);

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

// HTTP Function: Process Stripe payment webhook
export const stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers["stripe-signature"] as string;

  try {
    // Verify webhook signature (you'll need to add Stripe SDK)
    // const event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);

    // Handle different event types
    const event = req.body; // Simplified for example

    switch (event.type) {
    case "checkout.session.completed":
      // Handle successful subscription payment
      const session = event.data.object;
      await handleSuccessfulSubscription(session);
      break;

    case "invoice.payment_succeeded":
      // Handle recurring subscription payment
      const invoice = event.data.object;
      await handleRecurringPayment(invoice);
      break;

    case "customer.subscription.deleted":
      // Handle subscription cancellation
      const subscription = event.data.object;
      await handleSubscriptionCancellation(subscription);
      break;
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error in stripeWebhook:", error);
    res.status(400).send(`Webhook Error: ${error}`);
  }
});

// Helper function: Handle successful subscription
async function handleSuccessfulSubscription(session: any) {
  const userId = session.metadata.userId;
  const plan = session.metadata.plan;

  // Calculate end date based on plan
  const now = new Date();
  const endDate = new Date();

  switch (plan) {
  case "monthly":
    endDate.setMonth(endDate.getMonth() + 1);
    break;
  case "quarterly":
    endDate.setMonth(endDate.getMonth() + 3);
    break;
  case "yearly":
    endDate.setFullYear(endDate.getFullYear() + 1);
    break;
  }

  // Update user subscription
  await db.doc(`users/${userId}`).update({
    subscription: {
      plan,
      startDate: admin.firestore.Timestamp.fromDate(now),
      endDate: admin.firestore.Timestamp.fromDate(endDate),
      status: "active",
      stripeCustomerId: session.customer,
      stripeSubscriptionId: session.subscription,
    },
  });

  // Create transaction record
  await db.collection("transactions").add({
    type: "subscription",
    userId,
    userEmail: session.customer_email,
    amount: session.amount_total / 100, // Convert from cents
    currency: session.currency,
    description: `${plan} subscription`,
    provider: "stripe",
    providerId: session.payment_intent,
    subscriptionId: session.subscription,
    status: "completed",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// Helper function: Handle recurring payment
async function handleRecurringPayment(invoice: any) {
  // Update subscription end date
  const subscription = invoice.subscription;
  const userId = invoice.metadata.userId;

  // Create transaction record
  await db.collection("transactions").add({
    type: "subscription",
    userId,
    userEmail: invoice.customer_email,
    amount: invoice.amount_paid / 100,
    currency: invoice.currency,
    description: "Subscription renewal",
    provider: "stripe",
    providerId: invoice.payment_intent,
    subscriptionId: subscription,
    status: "completed",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    completedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

// Helper function: Handle subscription cancellation
async function handleSubscriptionCancellation(subscription: any) {
  const userId = subscription.metadata.userId;

  await db.doc(`users/${userId}`).update({
    "subscription.status": "cancelled",
  });
}

// Scheduled Function: Check expired subscriptions
export const checkExpiredSubscriptions = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();

    try {
      // Find expired subscriptions
      const expiredSubs = await db.collection("users")
        .where("subscription.status", "==", "active")
        .where("subscription.endDate", "<=", now)
        .get();

      const batch = db.batch();

      expiredSubs.forEach((doc) => {
        batch.update(doc.ref, {
          "subscription.status": "expired",
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
export const calculateDailyAnalytics = functions.pubsub
  .schedule("every 24 hours")
  .onRun(async (context) => {
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
        featureBoosts: 0,
        total: 0,
      };

      transactions.forEach((doc) => {
        const transaction = doc.data();
        revenue.total += transaction.amount;

        switch (transaction.type) {
        case "subscription":
          revenue.subscriptions += transaction.amount;
          break;
        case "job-fee":
          revenue.jobFees += transaction.amount;
          break;
        case "feature-boost":
          revenue.featureBoosts += transaction.amount;
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
        contractsCreated: (await db.collection("contracts")
          .where("createdAt", ">=", yesterdayTimestamp)
          .where("createdAt", "<", todayTimestamp)
          .get()).size,
      });

      console.log(`Analytics calculated for ${analyticsId}`);
    } catch (error) {
      console.error("Error in calculateDailyAnalytics:", error);
    }
  });

// HTTP Function: Search jobs with advanced filters
export const searchJobs = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const {
    query,
    category,
    skills,
    budgetMin,
    budgetMax,
    experienceLevel,
    locationType,
    sortBy = "createdAt",
    page = 1,
    limit = 20,
  } = data;

  try {
    let jobsQuery = db.collection("jobs").where("status", "==", "open");

    // Apply filters
    if (category) {
      jobsQuery = jobsQuery.where("category", "==", category);
    }
    if (experienceLevel) {
      jobsQuery = jobsQuery.where("experienceLevel", "==", experienceLevel);
    }
    if (locationType) {
      jobsQuery = jobsQuery.where("locationType", "==", locationType);
    }

    // Get all matching jobs
    const allJobs = await jobsQuery.get();
    let jobs = allJobs.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      score: 0,
    }));

    // Filter by budget range (Firestore doesn't support range queries on multiple fields)
    if (budgetMin || budgetMax) {
      jobs = jobs.filter((job) => {
        const jobBudgetMin = job.budgetMin || job.fixedPrice || 0;
        const jobBudgetMax = job.budgetMax || job.fixedPrice || Infinity;

        if (budgetMin && jobBudgetMax < budgetMin) return false;
        if (budgetMax && jobBudgetMin > budgetMax) return false;
        return true;
      });
    }

    // Filter by skills
    if (skills && skills.length > 0) {
      jobs = jobs.filter((job) =>
        skills.some((skill: string) => job.skills?.includes(skill))
      );
    }

    // Text search scoring (simple implementation)
    if (query) {
      const queryLower = query.toLowerCase();
      const queryWords = queryLower.split(" ");

      jobs = jobs.map((job) => {
        let score = 0;
        const titleLower = job.title.toLowerCase();
        const descLower = job.description.toLowerCase();

        // Exact match in title
        if (titleLower.includes(queryLower)) score += 10;

        // Word matches
        queryWords.forEach((word) => {
          if (titleLower.includes(word)) score += 5;
          if (descLower.includes(word)) score += 2;
          if (job.skills?.some((skill: string) => skill.toLowerCase().includes(word))) score += 3;
        });

        return { ...job, score };
      });

      // Filter out jobs with no matches
      jobs = jobs.filter((job) => job.score > 0);
    }

    // Sort
    jobs.sort((a, b) => {
      if (query && a.score !== b.score) {
        return b.score - a.score; // Higher score first
      }

      switch (sortBy) {
      case "budgetHigh":
        return (b.budgetMax || b.fixedPrice || 0) - (a.budgetMax || a.fixedPrice || 0);
      case "budgetLow":
        return (a.budgetMin || a.fixedPrice || 0) - (b.budgetMin || b.fixedPrice || 0);
      case "newest":
      default:
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      }
    });

    // Paginate
    const startIndex = (page - 1) * limit;
    const paginatedJobs = jobs.slice(startIndex, startIndex + limit);

    return {
      jobs: paginatedJobs.map(({ score, ...job }) => job), // Remove score from response
      total: jobs.length,
      page,
      totalPages: Math.ceil(jobs.length / limit),
      hasMore: startIndex + limit < jobs.length,
    };
  } catch (error) {
    console.error("Error in searchJobs:", error);
    throw new functions.https.HttpsError("internal", "Error searching jobs");
  }
});

// HTTP Function: Get job recommendations for a freelancer
export const getJobRecommendations = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError("unauthenticated", "User must be authenticated");
  }

  const userId = context.auth.uid;

  try {
    // Get user profile
    const userDoc = await db.doc(`users/${userId}`).get();
    const user = userDoc.data();

    if (!user || user.userType === "client") {
      return { jobs: [] };
    }

    // Get user's skills and preferences
    const userSkills = user.skills || [];
    const preferredCategories = user.preferredCategories || [];

    // Get recent proposals to understand user interests
    const recentProposals = await db.collection("proposals")
      .where("freelancerId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(10)
      .get();

    // Extract job categories from recent proposals
    const recentJobIds = recentProposals.docs.map((doc) => doc.data().jobId);
    const recentJobs = await Promise.all(
      recentJobIds.map((jobId) => db.doc(`jobs/${jobId}`).get())
    );

    const recentCategories = recentJobs
      .filter((doc) => doc.exists)
      .map((doc) => doc.data()!.category);

    // Build recommendation query
    const recommendedJobs: any[] = [];

    // 1. Jobs matching user skills
    if (userSkills.length > 0) {
      const skillMatches = await db.collection("jobs")
        .where("status", "==", "open")
        .where("skills", "array-contains-any", userSkills.slice(0, 10)) // Firestore limit
        .orderBy("createdAt", "desc")
        .limit(20)
        .get();

      recommendedJobs.push(...skillMatches.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        matchReason: "skills",
      })));
    }

    // 2. Jobs in preferred categories
    if (preferredCategories.length > 0) {
      const categoryMatches = await db.collection("jobs")
        .where("status", "==", "open")
        .where("category", "in", preferredCategories.slice(0, 10)) // Firestore limit
        .orderBy("createdAt", "desc")
        .limit(20)
        .get();

      recommendedJobs.push(...categoryMatches.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        matchReason: "category",
      })));
    }

    // 3. Jobs similar to recent applications
    const uniqueRecentCategories = [...new Set(recentCategories)];
    if (uniqueRecentCategories.length > 0) {
      const similarMatches = await db.collection("jobs")
        .where("status", "==", "open")
        .where("category", "in", uniqueRecentCategories.slice(0, 10))
        .orderBy("createdAt", "desc")
        .limit(10)
        .get();

      recommendedJobs.push(...similarMatches.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        matchReason: "similar",
      })));
    }

    // Remove duplicates
    const uniqueJobs = new Map();
    recommendedJobs.forEach((job) => {
      if (!uniqueJobs.has(job.id)) {
        uniqueJobs.set(job.id, job);
      }
    });

    // Sort by relevance and recency
    const sortedJobs = Array.from(uniqueJobs.values()).sort((a, b) => {
      // Prioritize skill matches
      if (a.matchReason === "skills" && b.matchReason !== "skills") return -1;
      if (b.matchReason === "skills" && a.matchReason !== "skills") return 1;

      // Then by date
      return b.createdAt.toMillis() - a.createdAt.toMillis();
    });

    return {
      jobs: sortedJobs.slice(0, 20).map(({ matchReason, ...job }) => job),
    };
  } catch (error) {
    console.error("Error in getJobRecommendations:", error);
    throw new functions.https.HttpsError("internal", "Error getting recommendations");
  }
});
