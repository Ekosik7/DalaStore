import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '@/shared/types';
import { storage } from '@/shared/utils/storage';
import { authApi } from '@/shared/api/auth';
import { LoginInput, RegisterInput } from '@/shared/types';

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (data: LoginInput) => Promise<void>;
    register: (data: RegisterInput) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const storedUser = storage.getUser();
        if (storedUser) {
            setUser(storedUser);
        }
        setIsLoading(false);
    }, []);

    const login = async (data: LoginInput) => {
        const response = await authApi.login(data);
        storage.setToken(response.token);
        storage.setUser(response.user);
        setUser(response.user);
    };

    const register = async (data: RegisterInput) => {
        const response = await authApi.register(data);
        storage.setToken(response.token);
        storage.setUser(response.user);
        setUser(response.user);
    };

    const logout = () => {
        storage.clear();
        setUser(null);
        window.location.href = '/';
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
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
