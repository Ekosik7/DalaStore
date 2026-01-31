import apiClient from './client';
import { Category, CategoryInput, normalizeArray, normalizeId } from '../types';

export const categoriesApi = {
    async getCategories(): Promise<Category[]> {
        const response = await apiClient.get<any[]>('/api/categories');
        return normalizeArray(response.data);
    },

    async createCategory(data: CategoryInput): Promise<Category> {
        const response = await apiClient.post<any>('/api/categories', data);
        return normalizeId(response.data);
    },

    async deleteCategory(id: string): Promise<void> {
        await apiClient.delete(`/api/categories/${id}`);
    },
};
