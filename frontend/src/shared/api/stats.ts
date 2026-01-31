import apiClient from './client';
import { RevenueByCategory } from '../types';

export const statsApi = {
    async getRevenueByCategory(): Promise<RevenueByCategory[]> {
        const response = await apiClient.get<RevenueByCategory[]>('/api/stats/revenue-by-category');
        return response.data;
    },
};
