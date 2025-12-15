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
import { auth } from "@/lib/firebase";

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

            // Sync to Shopify
            await fetch('/api/auth/shopify-sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: user.email,
                    displayName: user.displayName,
                    uid: user.uid
                })
            });

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

            // Sync to Shopify
            await fetch('/api/auth/shopify-sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    displayName: name,
                    uid: result.user.uid
                })
            });
        } catch (error) {
            console.error("Signup failed", error);
            throw error;
        }
    };

    const signInWithEmail = async (email: string, pass: string) => {
        try {
            const result = await signInWithEmailAndPassword(auth, email, pass);

            // Sync to Shopify (Updates existing or creates if missing)
            await fetch('/api/auth/shopify-sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email,
                    displayName: result.user.displayName,
                    uid: result.user.uid
                })
            });

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
