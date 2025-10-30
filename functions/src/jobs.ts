import * as admin from "firebase-admin";
import { onCall, HttpsError } from "firebase-functions/v2/https";

export const createJob = onCall(async (request) => {
  // Verify user is authenticated
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const { data } = request;
  const db = admin.firestore();

  try {
    // Validate user is a client
    const userDoc = await db.doc(`users/${request.auth.uid}`).get();
    const userData = userDoc.data();

    if (!userData || (userData.userType !== "client" && userData.userType !== "both")) {
      throw new HttpsError("permission-denied", "Only clients can post jobs");
    }

    // Create job document
    const jobRef = db.collection("jobs").doc();
    const jobData = {
      id: jobRef.id,
      clientId: request.auth.uid,
      clientName: userData.displayName || "Anonymous",
      clientPhotoURL: userData.photoURL || "",
      ...data,
      status: "open",
      proposalCount: 0,
      invitesSent: 0,
      featured: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await jobRef.set(jobData);

    // Send notifications to relevant freelancers
    await notifyFreelancersAboutNewJob(jobData);

    return { success: true, jobId: jobRef.id };
  } catch (error) {
    console.error("Error creating job:", error);
    throw new HttpsError("internal", "Failed to create job");
  }
});

async function notifyFreelancersAboutNewJob(job: any) {
  const db = admin.firestore();

  // Query freelancers with matching skills
  const freelancersSnapshot = await db.collection("users")
    .where("userType", "in", ["freelancer", "both"])
    .where("skills", "array-contains-any", job.skills.slice(0, 10))
    .where("isAvailable", "==", true)
    .limit(50)
    .get();

  const batch = db.batch();

  freelancersSnapshot.docs.forEach((doc) => {
    const notificationRef = db.collection("notifications").doc();
    batch.set(notificationRef, {
      userId: doc.id,
      title: "New Job Match",
      body: `New ${job.category} job: "${job.title}"`,
      type: "new-job",
      actionUrl: `/job/${job.id}`,
      actionData: { jobId: job.id },
      read: false,
      pushSent: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  });

  await batch.commit();
}