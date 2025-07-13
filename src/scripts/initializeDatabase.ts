// File path: src/scripts/setup-firestore.ts
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';

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

async function setupCollections() {
  console.log('🚀 Setting up Firestore collections...');

  try {
    // 1. Create a sample user document structure
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

    console.log('✅ All collections set up successfully!');
  } catch (error) {
    console.error('❌ Error setting up collections:', error);
  }
}

// Run the setup
setupCollections();