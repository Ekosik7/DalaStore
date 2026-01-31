import apiClient from './client';
import { Order, OrdersResponse, OrderStats, normalizeArray, normalizeId } from '../types';

interface GetOrdersParams {
    page?: number;
    limit?: number;
}

export const ordersApi = {
    async createOrder(): Promise<Order> {
        const response = await apiClient.post<any>('/api/v1/orders');
        return normalizeId(response.data);
    },

    async getMyOrders(params: GetOrdersParams = {}): Promise<OrdersResponse> {
        const response = await apiClient.get<{ orders: any[]; total: number }>(
            '/api/v1/orders/my',
            { params }
        );
        return {
            orders: normalizeArray(response.data.orders),
            total: response.data.total,
        };
    },

    async getOrderStats(): Promise<OrderStats[]> {
        const response = await apiClient.get<OrderStats[]>('/api/v1/orders/stats/status');
        return response.data;
    },

    async updateOrderStatus(orderId: string, status: 'created' | 'paid' | 'cancelled'): Promise<Order> {
        const response = await apiClient.patch<any>(`/api/v1/orders/${orderId}/status`, { status });
        return normalizeId(response.data);
    },
};
