import axios, { AxiosError } from 'axios';
import { storage } from '../utils/storage';

const baseURL = import.meta.env.DEV ? '' : import.meta.env.VITE_API_URL;

const apiClient = axios.create({
    baseURL,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(
    (config) => {
        const token = storage.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ error: string }>) => {
        if (error.response?.status === 401) {
            storage.clear();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default apiClient;

export function getErrorMessage(error: unknown): string {
    if (axios.isAxiosError(error)) {
        return error.response?.data?.error || error.message || 'An error occurred';
    }
    if (error instanceof Error) {
        return error.message;
    }
    return 'An unknown error occurred';
}
