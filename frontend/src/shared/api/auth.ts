import apiClient from './client';
import { AuthResponse, LoginInput, RegisterInput } from '../types';

export const authApi = {
    async register(data: RegisterInput): Promise<AuthResponse> {
        const response = await apiClient.post<AuthResponse>('/api/auth/register', data);
        return response.data;
    },

    async login(data: LoginInput): Promise<AuthResponse> {
        const response = await apiClient.post<AuthResponse>('/api/auth/login', data);
        return response.data;
    },
};
