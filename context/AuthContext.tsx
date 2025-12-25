"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
    onAuthStateChanged,
    User,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    updateProfile
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

interface AuthContextType {
    user: User | null;
    loading: boolean;
    isAdmin: boolean;
    signInWithGoogle: () => Promise<void>;
    signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
    signInWithEmail: (email: string, pass: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    isAdmin: false,
    signInWithGoogle: async () => { },
    signUpWithEmail: async () => { },
    signInWithEmail: async () => { },
    logout: async () => { },
});

export const useAuth = () => useContext(AuthContext);

// Helper function to save user to Firestore
async function saveUserToFirestore(user: User) {
    try {
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || "User",
            photoURL: user.photoURL || null,
            lastLogin: serverTimestamp(),
            updatedAt: serverTimestamp()
        }, { merge: true }); // merge: true preserves existing fields like createdAt
        console.log("[Auth] User saved to Firestore:", user.email);
    } catch (error) {
        console.error("[Auth] Failed to save user to Firestore:", error);
        // Don't throw - login should still work even if Firestore save fails
    }
}

// Helper to set createdAt on first signup
async function createUserInFirestore(user: User, displayName: string) {
    try {
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: displayName || "User",
            photoURL: user.photoURL || null,
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        console.log("[Auth] New user created in Firestore:", user.email);
    } catch (error) {
        console.error("[Auth] Failed to create user in Firestore:", error);
    }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            setUser(user);
            if (user && user.email === "rhushimanumehta@gmail.com") {
                setIsAdmin(true);
                if (typeof window !== 'undefined') localStorage.setItem('isAdmin', 'true');
            } else {
                setIsAdmin(false);
                if (typeof window !== 'undefined') localStorage.removeItem('isAdmin');
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const signInWithGoogle = async () => {
        const provider = new GoogleAuthProvider();
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;

            // Save to Firebase Firestore
            await saveUserToFirestore(user);

        } catch (error: any) {
            console.error("Error signing in with Google", error);
            if (error.code === 'auth/unauthorized-domain') {
                alert(`Configuration Error: This domain (${window.location.hostname}) is not authorized in Firebase. \n\nPlease go to Firebase Console -> Authentication -> Settings -> Authorized Domains and add this domain.`);
            } else if (error.code === 'auth/popup-closed-by-user') {
                // Ignore
            } else {
                alert(`Login Failed: ${error.message}`);
            }
            throw error;
        }
    };

    const signUpWithEmail = async (email: string, pass: string, name: string) => {
        try {
            const result = await createUserWithEmailAndPassword(auth, email, pass);
            await updateProfile(result.user, { displayName: name });

            // Create user in Firebase Firestore
            await createUserInFirestore(result.user, name);
        } catch (error) {
            console.error("Signup failed", error);
            throw error;
        }
    };

    const signInWithEmail = async (email: string, pass: string) => {
        try {
            const result = await signInWithEmailAndPassword(auth, email, pass);

            // Update lastLogin in Firebase Firestore
            await saveUserToFirestore(result.user);

        } catch (error) {
            console.error("Email login failed", error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setIsAdmin(false);
            if (typeof window !== 'undefined') localStorage.removeItem('isAdmin');
        } catch (error) {
            console.error("Error signing out", error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, isAdmin, signInWithGoogle, signUpWithEmail, signInWithEmail, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
