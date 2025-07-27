// functions/src/index.ts
import { setGlobalOptions } from "firebase-functions/v2/options";
import { defineSecret } from "firebase-functions/params";

// Define secrets for Stripe
const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");

// Set global options for all functions
setGlobalOptions({
    maxInstances: 10,
    timeoutSeconds: 540,
    memory: "2GiB",
    region: "us-central1",
});

import { onDocumentCreated, onDocumentUpdated } from "firebase-functions/v2/firestore";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { onCall, HttpsError, onRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import Stripe from "stripe";
import * as functions from "firebase-functions";

// Initialize Firebase Admin
admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

// Get configuration
const config = functions.config();

// ====================================================================
// HEALTH CHECK FUNCTION
// ====================================================================

export const healthCheck = onRequest({ cors: true }, (request, response) => {
    response.send("OK");
});

// ====================================================================
// STRIPE PAYMENT FUNCTIONS
// ====================================================================

// Create Stripe Checkout Session for Subscriptions
export const createStripeCheckoutSession = onCall(
    {
        secrets: [stripeSecretKey],
        cors: true,
    },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "User must be authenticated");
        }

        const { planId } = request.data;
        const userId = request.auth.uid;

        try {
            // Initialize Stripe without specifying apiVersion
            const stripe = new Stripe(stripeSecretKey.value());

            // Get user data
            const userDoc = await db.doc(`users/${userId}`).get();
            const userData = userDoc.data();

            if (!userData) {
                throw new HttpsError("not-found", "User not found");
            }

            // Price IDs mapping
            const priceMap: { [key: string]: string } = {
                monthly: config.stripe?.monthly_price_id || "price_1RoqOADtB4sjDNJywCzlCHBM",
                quarterly: config.stripe?.quarterly_price_id || "price_1RoqOADtB4sjDNJytiOCXLZx",
                yearly: config.stripe?.yearly_price_id || "price_1RoqOADtB4sjDNJyGYFrEVTu",
            };

            const priceId = priceMap[planId];
            if (!priceId) {
                throw new HttpsError("invalid-argument", "Invalid plan ID");
            }

            // Create or get Stripe customer
            let customerId = userData.stripeCustomerId;

            if (!customerId) {
                const customer = await stripe.customers.create({
                    email: userData.email,
                    metadata: {
                        userId: userId,
                    },
                });
                customerId = customer.id;

                // Save customer ID to Firestore
                await db.doc(`users/${userId}`).update({
                    stripeCustomerId: customerId,
                });
            }

            // Create checkout session
            const appUrl = config.app?.url || "https://beamly-app.web.app";
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
                success_url: `${appUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${appUrl}/subscription/cancel`,
                metadata: {
                    userId: userId,
                    planType: planId,
                },
            });

            return {
                sessionId: session.id,
                url: session.url,
            };
        } catch (error: any) {
            console.error("Error creating checkout session:", error);
            throw new HttpsError("internal", error.message || "Failed to create checkout session");
        }
    }
);

// Create Payment Intent for Job Payments
export const createJobPaymentIntent = onCall(
    {
        secrets: [stripeSecretKey],
        cors: true,
    },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "User must be authenticated");
        }

        const { jobId, proposalId, amount } = request.data;
        const userId = request.auth.uid;

        try {
            const stripe = new Stripe(stripeSecretKey.value());

            // Verify job and proposal exist
            const [jobDoc, proposalDoc] = await Promise.all([
                db.doc(`jobs/${jobId}`).get(),
                db.doc(`proposals/${proposalId}`).get(),
            ]);

            if (!jobDoc.exists || !proposalDoc.exists) {
                throw new HttpsError("not-found", "Job or proposal not found");
            }

            const job = jobDoc.data()!;
            const proposal = proposalDoc.data()!;

            // Verify the user is the client who posted the job
            if (job.clientId !== userId) {
                throw new HttpsError("permission-denied", "Only the job client can make payments");
            }

            // Create payment intent
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Convert to cents
                currency: "usd",
                metadata: {
                    jobId,
                    proposalId,
                    clientId: userId,
                    freelancerId: proposal.freelancerId,
                    type: "job_payment",
                },
            });

            // Create payment record in Firestore
            await db.collection("payments").doc(paymentIntent.id).set({
                jobId,
                proposalId,
                clientId: userId,
                freelancerId: proposal.freelancerId,
                amount,
                currency: "usd",
                status: "pending",
                stripePaymentIntentId: paymentIntent.id,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            return {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
            };
        } catch (error: any) {
            console.error("Error creating payment intent:", error);
            throw new HttpsError("internal", error.message || "Failed to create payment");
        }
    }
);

// Create Stripe Connect Account for Freelancers
export const createStripeConnectAccount = onCall(
    {
        secrets: [stripeSecretKey],
        cors: true,
    },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "User must be authenticated");
        }

        const userId = request.auth.uid;

        try {
            const stripe = new Stripe(stripeSecretKey.value());

            // Get user data
            const userDoc = await db.doc(`users/${userId}`).get();
            const userData = userDoc.data();

            if (!userData) {
                throw new HttpsError("not-found", "User not found");
            }

            // Check if Connect account already exists
            if (userData.stripeConnectAccountId) {
                // Return new onboarding link for existing account
                const accountLink = await stripe.accountLinks.create({
                    account: userData.stripeConnectAccountId,
                    refresh_url: `${config.app?.url || "https://beamly-app.web.app"}/settings/payments`,
                    return_url: `${config.app?.url || "https://beamly-app.web.app"}/settings/payments?success=true`,
                    type: "account_onboarding",
                });

                return {
                    url: accountLink.url,
                    accountId: userData.stripeConnectAccountId,
                };
            }

            // Create new Connect account
            const account = await stripe.accounts.create({
                type: "express",
                country: "US",
                email: userData.email,
                metadata: {
                    userId: userId,
                },
                capabilities: {
                    card_payments: { requested: true },
                    transfers: { requested: true },
                },
            });

            // Save account ID to Firestore
            await db.doc(`users/${userId}`).update({
                stripeConnectAccountId: account.id,
            });

            // Create account onboarding link
            const accountLink = await stripe.accountLinks.create({
                account: account.id,
                refresh_url: `${config.app?.url || "https://beamly-app.web.app"}/settings/payments`,
                return_url: `${config.app?.url || "https://beamly-app.web.app"}/settings/payments?success=true`,
                type: "account_onboarding",
            });

            return {
                url: accountLink.url,
                accountId: account.id,
            };
        } catch (error: any) {
            console.error("Error creating Connect account:", error);
            throw new HttpsError("internal", error.message || "Failed to create payment account");
        }
    }
);

// Release Payment from Escrow to Freelancer
export const releasePayment = onCall(
    {
        secrets: [stripeSecretKey],
        cors: true,
    },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "User must be authenticated");
        }

        const { jobId, paymentId } = request.data;
        const userId = request.auth.uid;

        try {
            const stripe = new Stripe(stripeSecretKey.value());

            // Get payment record
            const paymentDoc = await db.doc(`payments/${paymentId}`).get();
            const payment = paymentDoc.data();

            if (!payment) {
                throw new HttpsError("not-found", "Payment not found");
            }

            // Verify the user is the client
            if (payment.clientId !== userId) {
                throw new HttpsError("permission-denied", "Only the client can release payment");
            }

            // Check payment status
            if (payment.status !== "held_in_escrow") {
                throw new HttpsError("failed-precondition", "Payment is not in escrow");
            }

            // Get freelancer's Connect account
            const freelancerDoc = await db.doc(`users/${payment.freelancerId}`).get();
            const freelancer = freelancerDoc.data();

            if (!freelancer?.stripeConnectAccountId) {
                throw new HttpsError("failed-precondition", "Freelancer has not set up payment account");
            }

            // Calculate platform fee (10%)
            const platformFee = Math.round(payment.amount * 0.1 * 100); // in cents
            const freelancerAmount = Math.round(payment.amount * 100) - platformFee; // in cents

            // Create transfer to freelancer
            const transfer = await stripe.transfers.create({
                amount: freelancerAmount,
                currency: "usd",
                destination: freelancer.stripeConnectAccountId,
                metadata: {
                    jobId,
                    freelancerId: payment.freelancerId,
                    paymentId: paymentDoc.id,
                },
            });

            // Update payment record
            const batch = db.batch();

            // Update payment status
            batch.update(paymentDoc.ref, {
                status: "released",
                releasedAt: admin.firestore.FieldValue.serverTimestamp(),
                stripeTransferId: transfer.id,
                platformFee: platformFee / 100,
                freelancerAmount: freelancerAmount / 100,
            });

            // Update freelancer earnings
            batch.update(db.doc(`users/${payment.freelancerId}`), {
                totalEarnings: admin.firestore.FieldValue.increment(freelancerAmount / 100),
                completedJobs: admin.firestore.FieldValue.increment(1),
            });

            // Update job status
            batch.update(db.doc(`jobs/${jobId}`), {
                status: "completed",
                paymentStatus: "released",
                completedAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            await batch.commit();

            // Send notification to freelancer
            await db.collection("notifications").add({
                userId: payment.freelancerId,
                type: "payment",
                title: "Payment Released!",
                body: `Payment of $${(freelancerAmount / 100).toFixed(2)} has been released for your completed job.`,
                actionUrl: "/earnings",
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            return {
                success: true,
                transferId: transfer.id,
                amount: freelancerAmount / 100,
            };
        } catch (error: any) {
            console.error("Error releasing payment:", error);
            throw new HttpsError("internal", error.message || "Failed to release payment");
        }
    }
);

// Create Payout for Freelancer Withdrawal
export const createStripePayout = onCall(
    {
        secrets: [stripeSecretKey],
        cors: true,
    },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "User must be authenticated");
        }

        const { amount } = request.data;
        const userId = request.auth.uid;

        try {
            const stripe = new Stripe(stripeSecretKey.value());

            // Get user's Connect account
            const userDoc = await db.doc(`users/${userId}`).get();
            const connectAccountId = userDoc.data()?.stripeConnectAccountId;

            if (!connectAccountId) {
                throw new HttpsError("failed-precondition", "No payment account found");
            }

            // Check available balance
            const balance = await stripe.balance.retrieve({
                stripeAccount: connectAccountId,
            });

            const availableBalance = balance.available[0]?.amount || 0;

            if (amount * 100 > availableBalance) {
                throw new HttpsError(
                    "failed-precondition",
                    `Insufficient balance. Available: $${(availableBalance / 100).toFixed(2)}`
                );
            }

            // Create payout
            const payout = await stripe.payouts.create(
                {
                    amount: Math.round(amount * 100),
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
                estimatedArrival: payout.arrival_date,
            };
        } catch (error: any) {
            console.error("Error creating payout:", error);
            throw new HttpsError("internal", error.message || "Failed to create payout");
        }
    }
);

// Get Stripe Balance for Freelancer
export const getStripeBalance = onCall(
    {
        secrets: [stripeSecretKey],
        cors: true,
    },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "User must be authenticated");
        }

        const userId = request.auth.uid;

        try {
            const stripe = new Stripe(stripeSecretKey.value());

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

            // Sum available and pending balances across all currencies
            const available = balance.available.reduce((sum, bal) => sum + bal.amount, 0) / 100;
            const pending = balance.pending.reduce((sum, bal) => sum + bal.amount, 0) / 100;

            return {
                success: true,
                available,
                pending,
            };
        } catch (error: any) {
            console.error("Error getting balance:", error);
            throw new HttpsError("internal", error.message || "Failed to get balance");
        }
    }
);

// Cancel Subscription
export const cancelSubscription = onCall(
    {
        secrets: [stripeSecretKey],
        cors: true,
    },
    async (request) => {
        if (!request.auth) {
            throw new HttpsError("unauthenticated", "User must be authenticated");
        }

        const userId = request.auth.uid;

        try {
            const stripe = new Stripe(stripeSecretKey.value());

            const userDoc = await db.doc(`users/${userId}`).get();
            const userData = userDoc.data();
            const subscriptionId = userData?.stripeSubscriptionId;

            if (!subscriptionId) {
                throw new HttpsError("not-found", "No active subscription found");
            }

            // Cancel at period end
            const subscription = await stripe.subscriptions.update(subscriptionId, {
                cancel_at_period_end: true,
            });

            // Update user document
            await db.doc(`users/${userId}`).update({
                subscriptionStatus: "cancelling",
                subscriptionCancelAt: admin.firestore.Timestamp.fromDate(
                    new Date(subscription.cancel_at! * 1000)
                ),
            });

            return {
                success: true,
                endDate: new Date(subscription.cancel_at! * 1000).toISOString(),
            };
        } catch (error: any) {
            console.error("Error cancelling subscription:", error);
            throw new HttpsError("internal", error.message || "Failed to cancel subscription");
        }
    }
);

// ====================================================================
// STRIPE WEBHOOK HANDLER
// ====================================================================

// Complete replacement for the stripeWebhook function
// This handles all type issues properly

export const stripeWebhook = onRequest(
    {
        secrets: [stripeSecretKey, stripeWebhookSecret],
        cors: false,
    },
    async (req, res) => {
        const sig = req.headers["stripe-signature"] as string;

        if (!sig) {
            res.status(400).send("No stripe signature");
            return;
        }

        let event: Stripe.Event;

        try {
            const stripe = new Stripe(stripeSecretKey.value());

            event = stripe.webhooks.constructEvent(
                req.rawBody,
                sig,
                stripeWebhookSecret.value()
            );
        } catch (err: any) {
            console.error("Webhook signature verification failed:", err);
            res.status(400).send(`Webhook Error: ${err.message}`);
            return;
        }

        try {
            switch (event.type) {
                case "checkout.session.completed": {
                    const session = event.data.object as any; // Use 'any' to bypass type issues

                    if (session.mode === "subscription" && session.subscription) {
                        const userId = session.metadata?.userId;
                        const planType = session.metadata?.planType || "monthly";

                        if (userId) {
                            const stripe = new Stripe(stripeSecretKey.value());

                            // Retrieve the full subscription object
                            const subscription = await stripe.subscriptions.retrieve(session.subscription);

                            await db.doc(`users/${userId}`).update({
                                subscriptionStatus: "active",
                                subscriptionPlan: planType,
                                stripeSubscriptionId: subscription.id,
                                stripeCustomerId: session.customer,
                                subscriptionStartDate: admin.firestore.Timestamp.fromDate(
                                    new Date((subscription as any).current_period_start * 1000)
                                ),
                                subscriptionEndDate: admin.firestore.Timestamp.fromDate(
                                    new Date((subscription as any).current_period_end * 1000)
                                ),
                                isPro: true,
                                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
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
                                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                            });
                        }
                    }
                    break;
                }

                case "invoice.payment_succeeded": {
                    const invoice = event.data.object as any; // Use 'any' to bypass type issues

                    // Check if this is a subscription invoice
                    if (invoice.subscription) {
                        try {
                            const stripe = new Stripe(stripeSecretKey.value());

                            // Handle subscription as string or object
                            const subscriptionId = typeof invoice.subscription === "string"
                                ? invoice.subscription
                                : invoice.subscription.id;

                            // Get subscription to find the user
                            const subscription = await stripe.subscriptions.retrieve(subscriptionId);

                            // Try to get userId from subscription metadata
                            let userId: string | undefined = (subscription as any).metadata?.userId;

                            // If not found in subscription, try to find by customer
                            if (!userId && invoice.customer) {
                                const customerId = typeof invoice.customer === "string"
                                    ? invoice.customer
                                    : invoice.customer.id;

                                const usersQuery = await db.collection("users")
                                    .where("stripeCustomerId", "==", customerId)
                                    .limit(1)
                                    .get();

                                if (!usersQuery.empty) {
                                    userId = usersQuery.docs[0].id;
                                }
                            }

                            if (userId) {
                                await db.collection("transactions").add({
                                    type: "subscription_renewal",
                                    userId,
                                    amount: invoice.amount_paid / 100,
                                    currency: invoice.currency,
                                    status: "completed",
                                    stripeInvoiceId: invoice.id,
                                    description: "Subscription renewal",
                                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                                });
                            }
                        } catch (error) {
                            console.error("Error processing subscription invoice:", error);
                        }
                    }
                    break;
                }

                case "customer.subscription.deleted": {
                    const subscription = event.data.object as any; // Use 'any' to bypass type issues

                    const customerId = typeof subscription.customer === "string"
                        ? subscription.customer
                        : subscription.customer?.id || subscription.customer;

                    if (customerId) {
                        const usersQuery = await db.collection("users")
                            .where("stripeCustomerId", "==", customerId)
                            .limit(1)
                            .get();

                        if (!usersQuery.empty) {
                            const userDoc = usersQuery.docs[0];
                            await userDoc.ref.update({
                                subscriptionStatus: "cancelled",
                                isPro: false,
                                subscriptionEndDate: admin.firestore.Timestamp.now(),
                                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                            });
                        }
                    }
                    break;
                }

                case "payment_intent.succeeded": {
                    const paymentIntent = event.data.object as any; // Use 'any' to bypass type issues

                    if (paymentIntent.metadata?.type === "job_payment") {
                        const { jobId, proposalId, freelancerId } = paymentIntent.metadata;

                        if (jobId && proposalId && freelancerId) {
                            // Update payment record
                            await db.doc(`payments/${paymentIntent.id}`).update({
                                status: "held_in_escrow",
                                paidAt: admin.firestore.FieldValue.serverTimestamp(),
                            });

                            // Update proposal
                            await db.doc(`proposals/${proposalId}`).update({
                                status: "accepted",
                                acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
                            });

                            // Update job
                            await db.doc(`jobs/${jobId}`).update({
                                status: "in_progress",
                                paymentStatus: "escrow",
                                assignedFreelancerId: freelancerId,
                                assignedProposalId: proposalId,
                                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                            });

                            // Notify freelancer
                            await db.collection("notifications").add({
                                userId: freelancerId,
                                type: "proposal",
                                title: "Proposal Accepted!",
                                body: "Your proposal has been accepted and the client has made the payment.",
                                actionUrl: "/my-jobs",
                                data: { jobId, proposalId },
                                read: false,
                                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                            });
                        }
                    }
                    break;
                }

                case "account.updated": {
                    const account = event.data.object as any; // Use 'any' to bypass type issues

                    const userId = account.metadata?.userId;

                    if (userId) {
                        await db.doc(`users/${userId}`).update({
                            stripeConnectChargesEnabled: account.charges_enabled || false,
                            stripeConnectPayoutsEnabled: account.payouts_enabled || false,
                            stripeConnectDetailsSubmitted: account.details_submitted || false,
                            stripeConnectStatus: account.details_submitted ? "active" : "pending",
                            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
                        });
                    }
                    break;
                }

                case "payout.paid": {
                    const payout = event.data.object as any; // Use 'any' to bypass type issues

                    if (payout.id) {
                        const transactionsQuery = await db.collection("transactions")
                            .where("stripePayoutId", "==", payout.id)
                            .limit(1)
                            .get();

                        if (!transactionsQuery.empty) {
                            const transactionDoc = transactionsQuery.docs[0];
                            await transactionDoc.ref.update({
                                status: "completed",
                                completedAt: admin.firestore.FieldValue.serverTimestamp(),
                            });
                        }
                    }
                    break;
                }

                default: {
                    console.log(`Unhandled event type: ${event.type}`);
                }
            }

            res.json({ received: true });
        } catch (error: any) {
            console.error("Error processing webhook:", error);
            res.status(500).send("Webhook processing error");
        }
    }
);

// ====================================================================
// NOTIFICATION TRIGGERS
// ====================================================================

// Send notification when a new proposal is received
export const onNewProposal = onDocumentCreated(
    {
        document: "proposals/{proposalId}",
        region: "us-central1",
    },
    async (event) => {
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
                type: "proposal",
                title: "New Proposal Received",
                body: `${proposal.freelancerName} submitted a proposal for "${job.title}"`,
                actionUrl: `/jobs/${proposal.jobId}/proposals`,
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
                try {
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
                } catch (fcmError) {
                    console.error("FCM send error:", fcmError);
                }
            }
        } catch (error) {
            console.error("Error in onNewProposal:", error);
        }
    }
);

// Send notification when a proposal is accepted
export const onProposalAccepted = onDocumentUpdated(
    {
        document: "proposals/{proposalId}",
        region: "us-central1",
    },
    async (event) => {
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
                    type: "proposal",
                    title: "Proposal Accepted!",
                    body: "Your proposal has been accepted. Payment is being processed.",
                    actionUrl: "/my-jobs",
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
                    try {
                        await messaging.send({
                            token: freelancer.fcmToken,
                            notification: {
                                title: "Proposal Accepted!",
                                body: "Your proposal has been accepted. Check your dashboard for details.",
                            },
                            data: {
                                type: "proposal_accepted",
                                proposalId,
                                jobId: after.jobId,
                            },
                        });
                    } catch (fcmError) {
                        console.error("FCM send error:", fcmError);
                    }
                }
            } catch (error) {
                console.error("Error in onProposalAccepted:", error);
            }
        }
    }
);

// Send notification when a message is sent
export const onNewMessage = onDocumentCreated(
    {
        document: "conversations/{conversationId}/messages/{messageId}",
        region: "us-central1",
    },
    async (event) => {
        const message = event.data?.data();
        const conversationId = event.params.conversationId;

        if (!message) return;

        try {
            // Get conversation details
            const conversationDoc = await db.doc(`conversations/${conversationId}`).get();
            const conversation = conversationDoc.data();

            if (!conversation) return;

            // Determine recipient
            const recipientId = message.senderId === conversation.freelancerId
                ? conversation.clientId
                : conversation.freelancerId;

            // Create notification
            await db.collection("notifications").add({
                userId: recipientId,
                type: "message",
                title: "New Message",
                body: message.text.substring(0, 100) + (message.text.length > 100 ? "..." : ""),
                actionUrl: `/messages/${conversationId}`,
                actionData: {
                    conversationId,
                    messageId: event.params.messageId,
                },
                read: false,
                pushSent: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });

            // Update conversation with last message
            await conversationDoc.ref.update({
                lastMessage: message.text,
                lastMessageAt: message.createdAt,
                [`unreadCount.${recipientId}`]: admin.firestore.FieldValue.increment(1),
            });
        } catch (error) {
            console.error("Error in onNewMessage:", error);
        }
    }
);

// ====================================================================
// SCHEDULED FUNCTIONS
// ====================================================================

// Send reminder when a contract is about to expire
export const contractExpiryReminder = onSchedule(
    {
        schedule: "every day 09:00",
        timeZone: "UTC",
        region: "us-central1",
    },
    async () => {
        const threeDaysFromNow = new Date();
        threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

        try {
            const expiringContracts = await db.collection("contracts")
                .where("status", "==", "active")
                .where("endDate", "<=", threeDaysFromNow)
                .get();

            const batch = db.batch();
            let notificationCount = 0;

            for (const doc of expiringContracts.docs) {
                const contract = doc.data();

                // Notify freelancer
                const freelancerNotif = db.collection("notifications").doc();
                batch.set(freelancerNotif, {
                    userId: contract.freelancerId,
                    type: "contract",
                    title: "Contract Expiring Soon",
                    body: `Your contract for "${contract.jobTitle}" expires in 3 days.`,
                    actionUrl: `/contracts/${doc.id}`,
                    read: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                // Notify client
                const clientNotif = db.collection("notifications").doc();
                batch.set(clientNotif, {
                    userId: contract.clientId,
                    type: "contract",
                    title: "Contract Expiring Soon",
                    body: `The contract for "${contract.jobTitle}" expires in 3 days.`,
                    actionUrl: `/contracts/${doc.id}`,
                    read: false,
                    createdAt: admin.firestore.FieldValue.serverTimestamp(),
                });

                notificationCount += 2;
            }

            await batch.commit();
            console.log(`Sent ${notificationCount} contract expiry notifications`);
        } catch (error) {
            console.error("Error in contractExpiryReminder:", error);
        }
    }
);

// Clean up old notifications
export const cleanupOldNotifications = onSchedule(
    {
        schedule: "every day 00:00",
        timeZone: "UTC",
        region: "us-central1",
    },
    async () => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        try {
            const oldNotifications = await db.collection("notifications")
                .where("createdAt", "<", thirtyDaysAgo)
                .where("read", "==", true)
                .limit(500)
                .get();

            const batch = db.batch();
            let count = 0;

            oldNotifications.forEach((doc) => {
                batch.delete(doc.ref);
                count++;
            });

            if (count > 0) {
                await batch.commit();
            }

            console.log(`Deleted ${count} old notifications`);
        } catch (error) {
            console.error("Error cleaning up notifications:", error);
        }
    }
);

// Update platform statistics
export const updatePlatformStats = onSchedule(
    {
        schedule: "every day 02:00",
        timeZone: "UTC",
        region: "us-central1",
    },
    async () => {
        try {
            // Count active jobs
            const activeJobsSnapshot = await db.collection("jobs")
                .where("status", "==", "active")
                .count()
                .get();

            // Count completed jobs today
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const completedTodaySnapshot = await db.collection("jobs")
                .where("status", "==", "completed")
                .where("completedAt", ">=", today)
                .count()
                .get();

            // Count active freelancers (logged in last 30 days)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            const activeFreelancersSnapshot = await db.collection("users")
                .where("userType", "in", ["freelancer", "both"])
                .where("lastLoginAt", ">=", thirtyDaysAgo)
                .count()
                .get();

            // Count total transactions this month
            const firstDayOfMonth = new Date();
            firstDayOfMonth.setDate(1);
            firstDayOfMonth.setHours(0, 0, 0, 0);

            const monthlyTransactionsSnapshot = await db.collection("transactions")
                .where("createdAt", ">=", firstDayOfMonth)
                .where("status", "==", "completed")
                .get();

            let monthlyRevenue = 0;
            monthlyTransactionsSnapshot.forEach((doc) => {
                const transaction = doc.data();
                if (transaction.platformFee) {
                    monthlyRevenue += transaction.platformFee;
                }
            });

            // Update stats document
            await db.doc("analytics/platform_stats").set({
                activeJobs: activeJobsSnapshot.data().count,
                completedToday: completedTodaySnapshot.data().count,
                activeFreelancers: activeFreelancersSnapshot.data().count,
                monthlyRevenue,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
            }, { merge: true });

            console.log("Updated platform statistics");
        } catch (error) {
            console.error("Error updating platform stats:", error);
        }
    }
);

// Check for expired jobs and update status
export const updateExpiredJobs = onSchedule(
    {
        schedule: "every day 01:00",
        timeZone: "UTC",
        region: "us-central1",
    },
    async () => {
        try {
            const now = new Date();

            const expiredJobs = await db.collection("jobs")
                .where("status", "==", "active")
                .where("deadline", "<", now)
                .limit(100)
                .get();

            const batch = db.batch();
            let count = 0;

            expiredJobs.forEach((doc) => {
                batch.update(doc.ref, {
                    status: "expired",
                    expiredAt: admin.firestore.FieldValue.serverTimestamp(),
                });
                count++;
            });

            if (count > 0) {
                await batch.commit();
            }

            console.log(`Updated ${count} expired jobs`);
        } catch (error) {
            console.error("Error updating expired jobs:", error);
        }
    }
);