import { useState, useEffect, useCallback } from "react";
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { auth, firestore } from "../lib/firebase";
import { loginToFirebaseChat } from "../services/chatAuth";

export interface FirestoreChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  sender_role: "owner" | "tenant" | "staff";
  sender_room?: string | null;
  text: string;
  type: "TEXT" | "IMAGE" | "NOTICE";
  media_url?: string | null;
  created_at?: Timestamp | null;
}

export interface FirestoreChatMember {
  id: string;
  user_id: string;
  pg_id: string;
  name: string;
  role: "owner" | "tenant" | "staff";
  status: "ACTIVE" | "INACTIVE";
  room_id?: string | null;
  room_number?: string | null;
  updated_at?: Timestamp | null;
}

export function useGroupChat(propertyId: string | undefined, userType: "owner" | "staff" = "owner", reloadKey = 0) {
  const [messages, setMessages] = useState<FirestoreChatMessage[]>([]);
  const [members, setMembers] = useState<FirestoreChatMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);

  useEffect(() => {
    if (!propertyId || propertyId === "pg-default") {
      setLoading(false);
      return;
    }

    let unsubscribeMessages: (() => void) | undefined;
    let unsubscribeMembers: (() => void) | undefined;
    let isCancelled = false;

    async function initChat() {
      try {
        setLoading(true);
        setError(null);

        if (!firestore) {
          throw new Error("Firebase didn't start. Set VITE_FIREBASE_API_KEY in .env and restart the dev server.");
        }

        // 1. Authenticate with Firebase via backend Custom Token
        await loginToFirebaseChat(userType);

        if (isCancelled) return;
        setIsConnected(true);

        // 2. Real-time message listener
        const messagesRef = collection(firestore, "chat_groups", propertyId, "messages");
        const messagesQuery = query(messagesRef, orderBy("created_at", "asc"), limit(200));

        unsubscribeMessages = onSnapshot(
          messagesQuery,
          (snapshot) => {
            const list: FirestoreChatMessage[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data() as Omit<FirestoreChatMessage, "id">;
              list.push({
                id: doc.id,
                ...data,
              });
            });
            setMessages(list);
            setLoading(false);
          },
          (err) => {
            console.warn("[GroupChat] Messages snapshot listener:", err);
            setError(err.message || "Failed to load live messages");
            setLoading(false);
          }
        );

        // 3. Real-time members listener
        const membersRef = collection(firestore, "chat_groups", propertyId, "members");
        unsubscribeMembers = onSnapshot(
          membersRef,
          (snapshot) => {
            const memberList: FirestoreChatMember[] = [];
            snapshot.forEach((doc) => {
              const data = doc.data() as Omit<FirestoreChatMember, "id">;
              memberList.push({
                id: doc.id,
                ...data,
              });
            });
            setMembers(memberList);
          },
          (err) => {
            console.warn("[GroupChat] Members snapshot listener:", err);
          }
        );
      } catch (err: any) {
        console.warn("[GroupChat] Initialization warning:", err);
        setError(err.message || "Could not connect to Firebase live chat.");
        setLoading(false);
        setIsConnected(false);
      }
    }

    initChat();

    return () => {
      isCancelled = true;
      if (unsubscribeMessages) unsubscribeMessages();
      if (unsubscribeMembers) unsubscribeMembers();
    };
  }, [propertyId, userType, reloadKey]);

  // Send message
  const sendMessage = useCallback(
    async (
      text: string,
      senderName: string,
      roomNumber?: string | null,
      isNotice = false,
      mediaUrl?: string | null
    ) => {
      if (!propertyId) throw new Error("No property selected");
      if (!text.trim() && !mediaUrl) return;

      // Ensure authenticated in Firebase
      if (!auth || !firestore) {
        throw new Error("Firebase didn't start. Set VITE_FIREBASE_API_KEY in .env and restart the dev server.");
      }

      let currentUser = auth.currentUser;
      if (!currentUser) {
        await loginToFirebaseChat(userType);
        currentUser = auth.currentUser;
      }

      if (!currentUser) {
        throw new Error("Unable to authenticate with chat server.");
      }

      const messagesRef = collection(firestore, "chat_groups", propertyId, "messages");
      await addDoc(messagesRef, {
        sender_id: currentUser.uid,
        sender_name: senderName || (userType === "owner" ? "Property Owner" : "Staff"),
        sender_role: userType,
        sender_room: roomNumber || null,
        text: text.trim(),
        type: isNotice ? "NOTICE" : mediaUrl ? "IMAGE" : "TEXT",
        media_url: mediaUrl || null,
        created_at: serverTimestamp(),
      });
    },
    [propertyId, userType]
  );

  return {
    messages,
    members,
    loading,
    error,
    isConnected,
    sendMessage,
  };
}
