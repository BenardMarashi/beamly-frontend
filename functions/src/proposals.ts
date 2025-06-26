export const submitProposal = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const { jobId, coverLetter, proposedRate, estimatedDuration } = request.data;
  const db = admin.firestore();

  try {
    // Verify user is a freelancer
    const userDoc = await db.doc(`users/${request.auth.uid}`).get();
    const userData = userDoc.data();
    
    if (!userData || (userData.userType !== 'freelancer' && userData.userType !== 'both')) {
      throw new HttpsError("permission-denied", "Only freelancers can submit proposals");
    }

    // Check if already applied
    const existingProposal = await db.collection('proposals')
      .where('jobId', '==', jobId)
      .where('freelancerId', '==', request.auth.uid)
      .get();

    if (!existingProposal.empty) {
      throw new HttpsError("already-exists", "You have already applied to this job");
    }

    // Get job details
    const jobDoc = await db.doc(`jobs/${jobId}`).get();
    const jobData = jobDoc.data();

    if (!jobData || jobData.status !== 'open') {
      throw new HttpsError("failed-precondition", "Job is not available for applications");
    }

    // Create proposal
    const proposalRef = db.collection('proposals').doc();
    const proposalData = {
      id: proposalRef.id,
      jobId,
      jobTitle: jobData.title,
      clientId: jobData.clientId,
      clientName: jobData.clientName,
      freelancerId: request.auth.uid,
      freelancerName: userData.displayName,
      freelancerPhotoURL: userData.photoURL || '',
      freelancerRating: userData.rating || 0,
      freelancerCompletedJobs: userData.completedJobs || 0,
      coverLetter,
      proposedRate,
      estimatedDuration,
      budgetType: jobData.budgetType,
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    await proposalRef.set(proposalData);

    // Update job proposal count
    await db.doc(`jobs/${jobId}`).update({
      proposalCount: admin.firestore.FieldValue.increment(1)
    });

    // Notify client
    await db.collection('notifications').add({
      userId: jobData.clientId,
      title: 'New Proposal Received',
      body: `${userData.displayName} submitted a proposal for "${jobData.title}"`,
      type: 'proposal',
      actionUrl: `/proposals/${proposalRef.id}`,
      actionData: { proposalId: proposalRef.id, jobId },
      read: false,
      pushSent: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, proposalId: proposalRef.id };
  } catch (error) {
    console.error("Error submitting proposal:", error);
    throw new HttpsError("internal", "Failed to submit proposal");
  }
});