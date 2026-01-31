import apiClient from './client';
import { Cart, AddToCartInput, RemoveFromCartInput } from '../types';

export const cartApi = {
    async getCart(): Promise<Cart> {
        const response = await apiClient.get<Cart>('/api/v1/cart');
        return response.data;
    },

    async addToCart(data: AddToCartInput): Promise<void> {
        await apiClient.post('/api/v1/cart/add', data);
    },

    async removeFromCart(data: RemoveFromCartInput): Promise<void> {
        await apiClient.post('/api/v1/cart/remove', data);
    },

    async clearCart(): Promise<void> {
        await apiClient.delete('/api/v1/cart/clear');
    },

    async updateQuantity(productId: string, size: number, newQuantity: number): Promise<void> {
        await this.removeFromCart({ productId, size });
        if (newQuantity > 0) {
            await this.addToCart({ productId, size, quantity: newQuantity });
        }
    },
};
