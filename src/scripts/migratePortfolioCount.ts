import { collection, getDocs, doc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

async function migratePortfolioCounts() {
  console.log('Starting portfolio count migration...');
  
  try {
    // 1. Get all freelancers
    const usersQuery = query(
      collection(db, 'users'),
      where('userType', 'in', ['freelancer', 'both'])
    );
    const usersSnapshot = await getDocs(usersQuery);
    
    console.log(`Found ${usersSnapshot.docs.length} freelancers`);
    
    let updated = 0;
    
    // 2. For each freelancer, count their portfolio projects
    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      
      // Count projects for this user
      const projectsQuery = query(
        collection(db, 'projects'),
        where('freelancerId', '==', userId)
      );
      const projectsSnapshot = await getDocs(projectsQuery);
      const portfolioCount = projectsSnapshot.docs.length;
      
      // Update user with portfolioCount
      await updateDoc(doc(db, 'users', userId), {
        portfolioCount: portfolioCount
      });
      
      updated++;
      console.log(`Updated ${userDoc.data().displayName || userId}: ${portfolioCount} projects`);
    }
    
    console.log(`✅ Migration complete! Updated ${updated} users.`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  }
}

migratePortfolioCounts();