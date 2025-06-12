import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import { onAuthUserCreated } from "firebase-functions/v2/auth";

admin.initializeApp();
const db = admin.firestore();

export const createUserProfile = onAuthUserCreated(async (event) => {
  const user = event.data;
  const { uid, email, displayName, photoURL } = user;

  try {
    await db.collection("users").doc(uid).set({
      uid: uid,
      email: email,
      displayName: displayName || "New User", // Set a default display name
      photoURL: photoURL || "", // Set a default photo URL
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      // Add any other initial profile fields you need
    });
    functions.logger.info(`User profile created for ${uid}`);
  } catch (error) {
    functions.logger.error(`Error creating user profile for ${uid}: ${error}`);
  }
});
