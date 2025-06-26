// src/scripts/setup-database.ts
import { 
  collection, 
  getDocs, 
  doc, 
  updateDoc,
  writeBatch,
  Timestamp,
  Firestore
} from 'firebase/firestore';

// Import db properly - your firebase.ts exports it
import { db } from '../lib/firebase';

async function setupDatabase() {
  console.log('🚀 Setting up your database...\n');

  // Check if db is initialized
  if (!db) {
    console.error('❌ Firebase not initialized. Check your environment variables.');
    return;
  }

  // Step 1: Check and fix users
  await checkAndFixUsers();
  
  // Step 2: Verify other collections exist
  await verifyCollections();
  
  // Step 3: Show next steps
  showNextSteps();
}

async function checkAndFixUsers() {
  console.log('📋 Checking users collection...');
  
  try {
    const usersSnapshot = await getDocs(collection(db, 'users'));
    
    if (usersSnapshot.empty) {
      console.log('❌ No users found. Create a user account first!');
      return;
    }

    console.log(`✅ Found ${usersSnapshot.size} users\n`);

    // Batch updates for efficiency
    const batch = writeBatch(db);
    let fixCount = 0;

    usersSnapshot.forEach((userDoc) => {
      const data = userDoc.data();
      const updates: Record<string, any> = {};

      // Add missing required fields
      if (!data.userType) {
        // Smart detection based on existing data
        if (data.skills?.length > 0 || data.hourlyRate) {
          updates.userType = 'freelancer';
        } else if (data.companyName) {
          updates.userType = 'client';
        } else {
          updates.userType = 'both';
        }
      }

      // Add missing defaults
      const defaults = {
        isVerified: false,
        isBlocked: false,
        completedProjects: 0,
        rating: 0,
        totalEarnings: 0,
        totalSpent: 0,
        skills: [],
        isAvailable: true
      };

      Object.entries(defaults).forEach(([key, value]) => {
        if (data[key] === undefined) {
          updates[key] = value;
        }
      });

      // Ensure timestamps
      if (!data.createdAt) {
        updates.createdAt = Timestamp.now();
      }

      // Apply updates if needed
      if (Object.keys(updates).length > 0) {
        batch.update(doc(db, 'users', userDoc.id), updates);
        fixCount++;
        console.log(`  Fixed user: ${data.email || userDoc.id}`);
      }
    });

    if (fixCount > 0) {
      await batch.commit();
      console.log(`\n✅ Fixed ${fixCount} users`);
    } else {
      console.log('✅ All users already have required fields');
    }
  } catch (error) {
    console.error('❌ Error checking users:', error);
  }
}

async function verifyCollections() {
  console.log('\n📂 Checking other collections...');
  
  const collections = ['jobs', 'proposals', 'messages', 'conversations', 'contracts', 'notifications'];
  
  for (const collName of collections) {
    try {
      const snapshot = await getDocs(collection(db, collName));
      if (snapshot.empty) {
        console.log(`  📭 ${collName}: Empty (will be created when used)`);
      } else {
        console.log(`  ✅ ${collName}: ${snapshot.size} documents`);
      }
    } catch (error) {
      console.log(`  📭 ${collName}: Not created yet`);
    }
  }
}

function showNextSteps() {
  console.log('\n' + '='.repeat(50));
  console.log('✅ DATABASE SETUP COMPLETE!\n');
  console.log('📌 NEXT STEPS:');
  console.log('1. Deploy security rules:');
  console.log('   firebase deploy --only firestore:rules\n');
  console.log('2. Test your features:');
  console.log('   - Post a job → Creates jobs collection');
  console.log('   - Send a message → Creates messages collection');
  console.log('   - Apply to job → Creates proposals collection\n');
  console.log('3. Collections create automatically as you use them!');
  console.log('='.repeat(50));
}

// Run the setup
setupDatabase().catch(console.error);