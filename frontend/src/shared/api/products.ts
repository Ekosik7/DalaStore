import apiClient from './client';
import {
    Product,
    ProductsResponse,
    ProductInput,
    UpdateStockInput,
} from '../types';

interface GetProductsParams {
    page?: number;
    limit?: number;
    categoryId?: string;
    q?: string;
}

function mapProduct(p: any): Product {
    const id = p._id?.$oid || p._id || p.id;

    let variants: any[] = [];

    if (Array.isArray(p.variants) && p.variants.length > 0) {
        variants = p.variants;
    } else if (Array.isArray(p.sizes)) {
        const stock = p.stock || 0;
        const color = p.color || 'default';

        variants = p.sizes.map((size: any) => ({
            size: typeof size === 'string' ? parseInt(size, 10) : size,
            color: color,
            stock: stock, 
        }));
    }

    return {
        id,
        name: p.name || '',
        description: p.description || '',
        price: p.price || 0,
        categoryId: p.categoryId || p.category || '',
        variants: variants,
        isActive: p.isActive !== undefined ? p.isActive : (p.isAvailable !== undefined ? p.isAvailable : true),
        createdAt: p.createdAt || '',
        updatedAt: p.updatedAt || '',
        imageUrl: p.imageUrl || p.image || '',
    };
}

export const productsApi = {
    async getProducts(params: GetProductsParams = {}): Promise<ProductsResponse> {
        const response = await apiClient.get<{ products: any[]; total: number }>(
            '/api/v1/products',
            { params }
        );
        return {
            products: (response.data.products ?? []).map(mapProduct),
            total: response.data.total,
        };
    },

    async getProduct(id: string): Promise<Product> {
        const response = await apiClient.get<any>(`/api/v1/products/${id}`);
        return mapProduct(response.data);
    },

    async createProduct(data: ProductInput): Promise<Product> {
        const response = await apiClient.post<any>('/api/v1/products', data);
        return mapProduct(response.data);
    },

    async updateProduct(id: string, data: Partial<ProductInput>): Promise<Product> {
        const response = await apiClient.patch<any>(`/api/v1/products/${id}`, data);
        return mapProduct(response.data);
    },

    async deleteProduct(id: string): Promise<void> {
        await apiClient.delete(`/api/v1/products/${id}`);
    },

    async updateVariantStock(id: string, data: UpdateStockInput): Promise<Product> {
        const response = await apiClient.patch<any>(
            `/api/v1/products/${id}/variant/stock`,
            data
        );
        return mapProduct(response.data);
    },
};

