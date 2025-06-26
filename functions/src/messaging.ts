export const sendMessage = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const { recipientId, text, attachments, jobId } = request.data;
  const senderId = request.auth.uid;
  const db = admin.firestore();

  try {
    // Get sender info
    const senderDoc = await db.doc(`users/${senderId}`).get();
    const senderData = senderDoc.data();

    if (!senderData) {
      throw new HttpsError("not-found", "Sender not found");
    }

    // Create conversation ID (sorted user IDs)
    const conversationId = [senderId, recipientId].sort().join('_');

    // Create or update conversation
    const conversationRef = db.doc(`conversations/${conversationId}`);
    const conversation = await conversationRef.get();

    if (!conversation.exists) {
      // Get recipient info
      const recipientDoc = await db.doc(`users/${recipientId}`).get();
      const recipientData = recipientDoc.data();

      await conversationRef.set({
        id: conversationId,
        participants: [senderId, recipientId],
        participantNames: [senderData.displayName, recipientData?.displayName || 'Unknown'],
        lastMessage: text.substring(0, 100),
        lastMessageTime: admin.firestore.FieldValue.serverTimestamp(),
        lastMessageSenderId: senderId,
        unreadCount: {
          [senderId]: 0,
          [recipientId]: 1
        },
        jobId: jobId || null,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    } else {
      await conversationRef.update({
        lastMessage: text.substring(0, 100),
        lastMessageTime: admin.firestore.FieldValue.serverTimestamp(),
        lastMessageSenderId: senderId,
        [`unreadCount.${recipientId}`]: admin.firestore.FieldValue.increment(1),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    // Create message
    const messageRef = db.collection('messages').doc();
    await messageRef.set({
      id: messageRef.id,
      conversationId,
      senderId,
      senderName: senderData.displayName,
      senderAvatar: senderData.photoURL || '',
      recipientId,
      text,
      attachments: attachments || [],
      status: 'sent',
      jobId: jobId || null,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    return { success: true, messageId: messageRef.id, conversationId };
  } catch (error) {
    console.error("Error sending message:", error);
    throw new HttpsError("internal", "Failed to send message");
  }
});