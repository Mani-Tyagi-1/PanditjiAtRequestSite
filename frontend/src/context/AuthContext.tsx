import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
    _id: string;
    name?: string;
    phone: string;
    email?: string;
    [key: string]: any;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoginModalOpen: boolean;
    login: (token: string, user: User) => void;
    logout: () => void;
    openLoginModal: () => void;
    closeLoginModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    useEffect(() => {
        // Check local storage for existing session
        const storedToken = localStorage.getItem('user_token');
        const storedUser = localStorage.getItem('user_data');

        if (storedToken && storedUser) {
            try {
                setToken(storedToken);
                setUser(JSON.parse(storedUser));
            } catch (err) {
                console.error("Failed to parse stored user session", err);
                logout();
            }
        }
    }, []);

    const login = (newToken: string, newUser: User) => {
        setToken(newToken);
        setUser(newUser);
        localStorage.setItem('user_token', newToken);
        localStorage.setItem('user_data', JSON.stringify(newUser));
        // Also set 'user' used by BookingModal currently
        localStorage.setItem('user', JSON.stringify(newUser));
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('user_token');
        localStorage.removeItem('user_data');
        localStorage.removeItem('user');
    };

    const openLoginModal = () => setIsLoginModalOpen(true);
    const closeLoginModal = () => setIsLoginModalOpen(false);

    return (
        <AuthContext.Provider value={{ user, token, isLoginModalOpen, login, logout, openLoginModal, closeLoginModal }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
