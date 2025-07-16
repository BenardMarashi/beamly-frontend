// functions/src/index.ts
import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onCall, HttpsError, onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";

admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();
const storage = admin.storage();

// Trigger: Send notification when a new proposal is received
export const onNewProposal = onDocumentCreated("proposals/{proposalId}", async (event) => {
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
        body: "Your proposal has been accepted. A contract has been created.",
        type: "contract",
        actionUrl: "/contracts",
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
            body: "Your proposal has been accepted. A contract has been created.",
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
        actionUrl: `/jobs/${job.id}`,
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

      if (jobData.status !== "open") {
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

// HTTP Function: Create Contract
export const createContract = onCall(
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
    const clientId = request.auth.uid;

    try {
      // Validate required fields
      if (!data.proposalId || !data.jobId) {
        throw new HttpsError("invalid-argument", "Missing required fields");
      }

      // Get proposal data
      const proposalDoc = await db.doc(`proposals/${data.proposalId}`).get();
      const proposalData = proposalDoc.data();

      if (!proposalDoc.exists || !proposalData) {
        throw new HttpsError("not-found", "Proposal not found");
      }

      // Verify the client owns the job
      if (proposalData.clientId !== clientId) {
        throw new HttpsError("permission-denied", "You can only accept proposals for your own jobs");
      }

      // Check proposal status
      if (proposalData.status !== "pending") {
        throw new HttpsError("failed-precondition", "Proposal has already been processed");
      }

      // Create contract
      const contractRef = db.collection("contracts").doc();
      const now = admin.firestore.FieldValue.serverTimestamp();

      const contractData = {
        id: contractRef.id,
        jobId: proposalData.jobId,
        jobTitle: proposalData.jobTitle,
        proposalId: data.proposalId,
        clientId: clientId,
        clientName: proposalData.clientName,
        freelancerId: proposalData.freelancerId,
        freelancerName: proposalData.freelancerName,
        rate: proposalData.proposedRate,
        budgetType: proposalData.budgetType,
        status: "active",
        totalPaid: 0,
        totalDue: proposalData.proposedRate,
        milestones: data.milestones || [],
        createdAt: now,
        updatedAt: now,
      };

      // Use a transaction to ensure consistency
      await db.runTransaction(async (transaction) => {
        // Create contract
        transaction.set(contractRef, contractData);

        // Update proposal status
        const proposalRef = db.doc(`proposals/${data.proposalId}`);
        transaction.update(proposalRef, {
          status: "accepted",
          respondedAt: now,
          updatedAt: now,
        });

        // Update job status
        const jobRef = db.doc(`jobs/${proposalData.jobId}`);
        transaction.update(jobRef, {
          status: "in-progress",
          hiredFreelancerId: proposalData.freelancerId,
          hiredAt: now,
          updatedAt: now,
        });

        // Reject other proposals for this job
        const otherProposals = await db.collection("proposals")
          .where("jobId", "==", proposalData.jobId)
          .where("status", "==", "pending")
          .get();

        otherProposals.docs.forEach((doc) => {
          if (doc.id !== data.proposalId) {
            transaction.update(doc.ref, {
              status: "rejected",
              respondedAt: now,
              updatedAt: now,
            });
          }
        });
      });

      // Trigger will handle notification creation

      return { success: true, contractId: contractRef.id };
    } catch (error: any) {
      console.error("Error creating contract:", error);

      if (error instanceof HttpsError) {
        throw error;
      }

      throw new HttpsError("internal", "Failed to create contract");
    }
  }
);

// HTTP Function: Process Stripe payment webhook
export const stripeWebhook = onRequest(
  {
    cors: true,
  },
  async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;

    try {
      // TODO: Verify webhook signature with Stripe SDK
      // const event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
      console.log("Stripe signature:", sig); // Use the sig variable

      // Handle different event types
      const event = req.body; // Simplified for example

      switch (event.type) {
      case "checkout.session.completed": {
        // Handle successful subscription payment
        const session = event.data.object;
        await handleSuccessfulSubscription(session);
        break;
      }

      case "invoice.payment_succeeded": {
        // Handle recurring subscription payment
        const invoice = event.data.object;
        await handleRecurringPayment(invoice);
        break;
      }

      case "customer.subscription.deleted": {
        // Handle subscription cancellation
        const subscription = event.data.object;
        await handleSubscriptionCancellation(subscription);
        break;
      }
      }

      res.json({ received: true });
    } catch (error) {
      console.error("Error in stripeWebhook:", error);
      res.status(400).send(`Webhook Error: ${error}`);
    }
  }
);

// HTTP Function: Create Stripe Checkout Session
export const createStripeCheckoutSession = onCall(
  {
    cors: true,
    maxInstances: 10,
  },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "User must be authenticated");
    }

    const { planId: _planId } = request.data; // TODO: Implement when Stripe is ready

    try {
      // TODO: Implement Stripe checkout session creation
      // const session = await stripe.checkout.sessions.create({...});

      // For now, return a mock response
      return {
        success: true,
        sessionId: "mock_session_id",
        url: "https://checkout.stripe.com/mock",
      };
    } catch (error) {
      console.error("Error creating checkout session:", error);
      throw new HttpsError("internal", "Failed to create checkout session");
    }
  }
);

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
export const checkExpiredSubscriptions = onSchedule("every 24 hours", async (event) => {
  console.log("Running scheduled function:", event.scheduleTime);
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
            [data.recipientId]: recipientData.displayName || "Unknown"
          },
          participantPhotos: {
            [senderId]: senderData.photoURL || "",
            [data.recipientId]: recipientData.photoURL || ""
          },
          lastMessage: data.text,
          lastMessageTime: now,
          unreadCount: {
            [senderId]: 0,
            [data.recipientId]: 1
          },
          createdAt: now,
          updatedAt: now
        });
      } else {
        // Update existing conversation
        await conversationRef.update({
          lastMessage: data.text,
          lastMessageTime: now,
          [`unreadCount.${data.recipientId}`]: admin.firestore.FieldValue.increment(1),
          updatedAt: now
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
        createdAt: now
      });

      // Create notification for recipient
      await db.collection("notifications").add({
        userId: data.recipientId,
        title: "New Message",
        message: `${senderData.displayName || "Someone"} sent you a message`,
        type: "message",
        read: false,
        link: "/chat",
        createdAt: now
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

// HTTP Function: Search jobs with advanced filters
export const searchJobs = onCall(async (request) => {
  // Verify user is authenticated
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
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
  } = request.data;

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
      jobs = jobs.filter((job: any) => {
        const jobBudgetMin = job.budgetMin || job.fixedPrice || 0;
        const jobBudgetMax = job.budgetMax || job.fixedPrice || Infinity;

        if (budgetMin && jobBudgetMax < budgetMin) return false;
        if (budgetMax && jobBudgetMin > budgetMax) return false;
        return true;
      });
    }

    // Filter by skills
    if (skills && skills.length > 0) {
      jobs = jobs.filter((job: any) =>
        skills.some((skill: string) => job.skills?.includes(skill))
      );
    }

    // Text search scoring (simple implementation)
    if (query) {
      const queryLower = query.toLowerCase();
      const queryWords = queryLower.split(" ");

      jobs = jobs.map((job: any) => {
        let score = 0;
        const titleLower = job.title.toLowerCase();
        const descLower = job.description.toLowerCase();

        // Exact match in title
        if (titleLower.includes(queryLower)) score += 10;

        // Word matches
        queryWords.forEach((word: string) => {
          if (titleLower.includes(word)) score += 5;
          if (descLower.includes(word)) score += 2;
          if (job.skills?.some((skill: string) => skill.toLowerCase().includes(word))) score += 3;
        });

        return { ...job, score };
      });

      // Filter out jobs with no matches
      jobs = jobs.filter((job: any) => job.score > 0);
    }

    // Sort
    jobs.sort((a: any, b: any) => {
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
      jobs: paginatedJobs.map((job: any) => {
        const { score: _, ...jobData } = job;
        return jobData;
      }), // Remove score from response
      total: jobs.length,
      page,
      totalPages: Math.ceil(jobs.length / limit),
      hasMore: startIndex + limit < jobs.length,
    };
  } catch (error) {
    console.error("Error in searchJobs:", error);
    throw new HttpsError("internal", "Error searching jobs");
  }
});

// HTTP Function: Get job recommendations for a freelancer
export const getJobRecommendations = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const userId = request.auth.uid;

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
      .map((doc) => doc.data()?.category);

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
      jobs: sortedJobs.slice(0, 20).map((job: any) => {
        const { matchReason: _, ...jobData } = job;
        return jobData;
      }),
    };
  } catch (error) {
    console.error("Error in getJobRecommendations:", error);
    throw new HttpsError("internal", "Error getting recommendations");
  }
});

// HTTP Function: Upload file to avoid CORS issues
export const uploadFile = onCall({cors: true}, async (request) => {
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
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const timestamp = Date.now();
    const fullPath = `${path}/${userId}/${timestamp}_${sanitizedFileName}`;

    // Convert base64 to buffer
    const buffer = Buffer.from(fileData, 'base64');
    
    const file = bucket.file(fullPath);
    
    await file.save(buffer, {
      metadata: {
        contentType: contentType || 'application/octet-stream',
        metadata: {
          uploadedBy: userId,
          uploadedAt: new Date().toISOString(),
          originalName: fileName
        }
      }
    });

    // Make file publicly readable
    await file.makePublic();
    
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fullPath}`;
    
    return {
      success: true,
      downloadURL: publicUrl,
      path: fullPath
    };
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new HttpsError("internal", "Error uploading file");
  }
});