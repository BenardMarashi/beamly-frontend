// src/scripts/initializeDatabase.ts
import { doc, setDoc, collection } from 'firebase/firestore';
import { db } from '../lib/firebase';

async function initializeDatabase() {
  // Create categories
  const categories = [
    { id: 'development', name: 'Development', icon: 'code' },
    { id: 'design', name: 'Design', icon: 'palette' },
    { id: 'marketing', name: 'Marketing', icon: 'megaphone' },
    { id: 'writing', name: 'Writing', icon: 'edit' },
    { id: 'video', name: 'Video & Animation', icon: 'video' }
  ];

  for (const category of categories) {
    await setDoc(doc(db, 'categories', category.id), category);
  }

  // Create common skills
  const skills = [
    { id: 'javascript', name: 'JavaScript', category: 'development' },
    { id: 'react', name: 'React', category: 'development' },
    { id: 'nodejs', name: 'Node.js', category: 'development' },
    { id: 'figma', name: 'Figma', category: 'design' },
    { id: 'photoshop', name: 'Photoshop', category: 'design' },
    // Add more skills...
  ];

  for (const skill of skills) {
    await setDoc(doc(db, 'skills', skill.id), skill);
  }

  console.log('Database initialized successfully!');
}

initializeDatabase().catch(console.error);