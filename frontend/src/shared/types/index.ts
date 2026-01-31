export interface User {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
    createdAt: string;
    updatedAt: string;
}

export interface Category {
    id: string;
    name: string;
    slug: string;
    createdAt: string;
    updatedAt: string;
}

export interface ProductVariant {
    size: number;
    color: string;
    stock: number;
}

export interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    categoryId: string;
    variants?: ProductVariant[]; 
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CartItem {
    productId: string;
    size: number;
    quantity: number;
    priceSnapshot: number;
}

export interface Cart {
    userId: string;
    items: CartItem[];
}

export interface OrderItem {
    productId: string;
    size: number;
    quantity: number;
    price: number;
}

export interface Order {
    id: string;
    userId: string;
    items: OrderItem[];
    totalPrice: number;
    status: 'created' | 'paid' | 'cancelled';
    createdAt: string;
    updatedAt: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

export interface ProductsResponse {
    products: Product[];
    total: number;
}

export interface OrdersResponse {
    orders: Order[];
    total: number;
}

export interface OrderStats {
    status: string;
    count: number;
    total: number;
}

export interface RevenueByCategory {
    category: string;
    revenue: number;
    sold: number;
}

export interface ApiError {
    error: string;
    productId?: string;
    size?: number;
}

export interface RegisterInput {
    name: string;
    email: string;
    password: string;
}

export interface LoginInput {
    email: string;
    password: string;
}

export interface CategoryInput {
    name: string;
    slug: string;
}

export interface ProductInput {
    name: string;
    description?: string;
    price: number;
    categoryId: string;
    variants: ProductVariant[];
    isActive?: boolean;
}

export interface AddToCartInput {
    productId: string;
    size: number;
    quantity: number;
}

export interface RemoveFromCartInput {
    productId: string;
    size: number;
}

export interface UpdateStockInput {
    size: number;
    delta: number;
}

export function normalizeId<T extends Record<string, any>>(
    obj: T & { _id?: string }
): Omit<T, '_id'> & { id: string } {
    if (!obj) return obj as any;

    const { _id, ...rest } = obj;
    return {
        ...rest,
        id: _id || (obj as any).id,
    } as Omit<T, '_id'> & { id: string };
}

export function normalizeArray<T extends Record<string, any>>(
    arr: (T & { _id?: string })[]
): (Omit<T, '_id'> & { id: string })[] {
    return arr.map(normalizeId);
}
