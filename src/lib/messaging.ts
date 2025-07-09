import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export const markMessageAsRead = async (conversationId: string, messageId: string) => {
  try {
    const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    await updateDoc(messageRef, {
      read: true,
      readAt: new Date()
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
  }
};

export const sendMessage = async (conversationId: string, message: any) => {
  try {
    // Implementation would go here
    console.log('Sending message:', message);
  } catch (error) {
    console.error('Error sending message:', error);
  }
};