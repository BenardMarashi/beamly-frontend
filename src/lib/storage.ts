import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';

export class StorageService {
  // Upload profile picture
  static async uploadProfilePicture(userId: string, file: File): Promise<string> {
    const storageRef = ref(storage, `users/${userId}/profile/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
  }
  
  // Upload job attachment
  static async uploadJobAttachment(jobId: string, file: File): Promise<string> {
    const storageRef = ref(storage, `jobs/${jobId}/attachments/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
  }
  
  // Upload proposal attachment
  static async uploadProposalAttachment(proposalId: string, file: File): Promise<string> {
    const storageRef = ref(storage, `proposals/${proposalId}/attachments/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
  }
  
  // Upload message attachment
  static async uploadMessageAttachment(
    conversationId: string, 
    messageId: string, 
    file: File
  ): Promise<string> {
    const storageRef = ref(
      storage, 
      `conversations/${conversationId}/messages/${messageId}/attachments/${Date.now()}_${file.name}`
    );
    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
  }
  
  // Upload portfolio item
  static async uploadPortfolioItem(userId: string, file: File): Promise<string> {
    const storageRef = ref(storage, `users/${userId}/portfolio/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return getDownloadURL(snapshot.ref);
  }
  
  // Delete file
  static async deleteFile(fullPath: string): Promise<void> {
    const storageRef = ref(storage, fullPath);
    await deleteObject(storageRef);
  }
  
  // List all files in a directory
  static async listFiles(path: string): Promise<string[]> {
    const storageRef = ref(storage, path);
    const result = await listAll(storageRef);
    const urls = await Promise.all(
      result.items.map(item => getDownloadURL(item))
    );
    return urls;
  }
}