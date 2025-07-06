// File path: src/scripts/setup-firestore.ts
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your Firebase config
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function setupCollections() {
  console.log('🚀 Setting up Firestore collections...');

  try {
    // 1. Create a sample user document structure
    const usersRef = collection(db, 'users');
    console.log('✅ Users collection reference created');

    // 2. Create a sample job document structure
    const jobsRef = collection(db, 'jobs');
    const sampleJob = {
      id: 'sample-job-id',
      title: 'Sample Job',
      description: 'This is a sample job to initialize the collection',
      category: 'development',
      subcategory: 'web',
      skills: ['javascript', 'react'],
      budgetType: 'fixed',
      budgetMin: 100,
      budgetMax: 100,
      fixedPrice: 100,
      duration: '1 week',
      experienceLevel: 'intermediate',
      locationType: 'remote',
      location: '',
      projectSize: 'small',
      clientId: 'sample-client-id',
      clientName: 'Sample Client',
      clientPhotoURL: '',
      status: 'draft', // Set as draft so it doesn't show in listings
      proposalCount: 0,
      invitesSent: 0,
      featured: false,
      urgent: false,
      verified: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(doc(jobsRef, 'sample-job-id'), sampleJob);
    console.log('✅ Jobs collection created with sample document');

    // 3. Create proposals collection structure
    const proposalsRef = collection(db, 'proposals');
    const sampleProposal = {
      id: 'sample-proposal-id',
      jobId: 'sample-job-id',
      jobTitle: 'Sample Job',
      clientId: 'sample-client-id',
      clientName: 'Sample Client',
      freelancerId: 'sample-freelancer-id',
      freelancerName: 'Sample Freelancer',
      freelancerPhotoURL: '',
      freelancerRating: 0,
      freelancerCompletedJobs: 0,
      coverLetter: 'Sample cover letter',
      proposedRate: 100,
      estimatedDuration: '1 week',
      budgetType: 'fixed',
      status: 'draft', // Set as draft
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(doc(proposalsRef, 'sample-proposal-id'), sampleProposal);
    console.log('✅ Proposals collection created with sample document');

    // 4. Create contracts collection structure
    const contractsRef = collection(db, 'contracts');
    const sampleContract = {
      id: 'sample-contract-id',
      jobId: 'sample-job-id',
      proposalId: 'sample-proposal-id',
      clientId: 'sample-client-id',
      freelancerId: 'sample-freelancer-id',
      title: 'Sample Contract',
      description: 'Sample contract description',
      amount: 100,
      paymentType: 'fixed',
      status: 'draft',
      milestones: [],
      startDate: serverTimestamp(),
      endDate: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(doc(contractsRef, 'sample-contract-id'), sampleContract);
    console.log('✅ Contracts collection created with sample document');

    // 5. Create messages/conversations structure
    const conversationsRef = collection(db, 'conversations');
    const sampleConversation = {
      id: 'sample-conversation-id',
      participants: ['user1', 'user2'],
      participantNames: {
        user1: 'User One',
        user2: 'User Two'
      },
      lastMessage: 'Sample message',
      lastMessageTime: serverTimestamp(),
      lastMessageSenderId: 'user1',
      unreadCount: {
        user1: 0,
        user2: 0
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(doc(conversationsRef, 'sample-conversation-id'), sampleConversation);
    console.log('✅ Conversations collection created with sample document');

    // 6. Create notifications structure
    const notificationsRef = collection(db, 'notifications');
    const sampleNotification = {
      id: 'sample-notification-id',
      userId: 'sample-user-id',
      title: 'Welcome to Beamly',
      body: 'This is a sample notification',
      type: 'system',
      actionUrl: '/dashboard',
      actionData: {},
      read: true,
      pushSent: false,
      createdAt: serverTimestamp()
    };
    
    await setDoc(doc(notificationsRef, 'sample-notification-id'), sampleNotification);
    console.log('✅ Notifications collection created with sample document');

    // 7. Create reviews structure
    const reviewsRef = collection(db, 'reviews');
    const sampleReview = {
      id: 'sample-review-id',
      contractId: 'sample-contract-id',
      jobId: 'sample-job-id',
      reviewerId: 'sample-reviewer-id',
      revieweeId: 'sample-reviewee-id',
      rating: 5,
      comment: 'Sample review comment',
      createdAt: serverTimestamp()
    };
    
    await setDoc(doc(reviewsRef, 'sample-review-id'), sampleReview);
    console.log('✅ Reviews collection created with sample document');

    // 8. Create transactions structure
    const transactionsRef = collection(db, 'transactions');
    const sampleTransaction = {
      id: 'sample-transaction-id',
      type: 'payment',
      amount: 100,
      currency: 'USD',
      fromUserId: 'sample-client-id',
      toUserId: 'sample-freelancer-id',
      jobId: 'sample-job-id',
      contractId: 'sample-contract-id',
      status: 'completed',
      paymentMethod: 'stripe',
      stripeSessionId: null,
      description: 'Sample transaction',
      createdAt: serverTimestamp(),
      completedAt: serverTimestamp()
    };
    
    await setDoc(doc(transactionsRef, 'sample-transaction-id'), sampleTransaction);
    console.log('✅ Transactions collection created with sample document');

    console.log('🎉 All collections created successfully!');
    console.log('Note: All sample documents have draft/completed status to avoid showing in active listings');
    
  } catch (error) {
    console.error('❌ Error setting up collections:', error);
  }
}

// Run the setup
setupCollections();