import { signInWithCustomToken } from "firebase/auth";
import { assertFirebaseConfig, auth } from "../lib/firebase";
import { httpRequest, authStorage } from "../api/http";

export interface ChatTokenResponse {
  token: string;
}

/**
 * Exchanges the PG Ease JWT for a Firebase custom token and authenticates the Firebase client.
 */
export async function loginToFirebaseChat(userType: "owner" | "staff" = "owner"): Promise<string> {
  // If already authenticated in Firebase with an active session, return user ID
  assertFirebaseConfig();
  if (!auth) {
    throw new Error("Firebase didn't start. Set VITE_FIREBASE_API_KEY in .env and restart the dev server.");
  }

  if (auth.currentUser) {
    return auth.currentUser.uid;
  }

  const endpoint = userType === "staff" ? "/chat/staff/token" : "/chat/owner/token";
  
  try {
    const data = await httpRequest<ChatTokenResponse>(endpoint, {
      method: "GET",
      auth: true,
    });

    if (!data?.token) {
      throw new Error("No custom token received from chat auth service");
    }

    const userCredential = await signInWithCustomToken(auth, data.token);
    return userCredential.user.uid;
  } catch (error: any) {
    console.error("[ChatAuth] Failed to authenticate with Firebase:", error);
    throw error;
  }
}
