import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import { cartApi } from '@/shared/api/cart';
import { productsApi } from '@/shared/api/products';
import { ordersApi } from '@/shared/api/orders';
import { Loading } from '@/shared/ui/Loading';
import { ErrorMessage } from '@/shared/ui/ErrorMessage';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Button } from '@/shared/ui/Button';
import { formatPrice } from '@/shared/utils/format';
import { getErrorMessage } from '@/shared/api/client';

export function CartPage() {
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const { data: cart, isLoading: cartLoading, error: cartError } = useQuery({
        queryKey: ['cart'],
        queryFn: cartApi.getCart,
    });

    const productQueries = useQueries({
        queries: (cart?.items || []).map((item) => ({
            queryKey: ['product', item.productId],
            queryFn: () => productsApi.getProduct(item.productId),
        })),
    });

    const removeItemMutation = useMutation({
        mutationFn: cartApi.removeFromCart,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
    });

    const updateQuantityMutation = useMutation({
        mutationFn: ({ productId, size, quantity }: { productId: string; size: number; quantity: number }) =>
            cartApi.updateQuantity(productId, size, quantity),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
    });

    const clearCartMutation = useMutation({
        mutationFn: cartApi.clearCart,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
        },
    });

    const createOrderMutation = useMutation({
        mutationFn: ordersApi.createOrder,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            navigate('/orders');
        },
    });

    if (cartLoading) return <Loading />;
    if (cartError) return <ErrorMessage message={getErrorMessage(cartError)} />;
    if (!cart || cart.items.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <EmptyState message="Your cart is empty" />
                <div className="text-center mt-6">
                    <Button onClick={() => navigate('/products')}>Continue Shopping</Button>
                </div>
            </div>
        );
    }

    const productsLoading = productQueries.some((q) => q.isLoading);
    const productsError = productQueries.find((q) => q.error);

    if (productsLoading) return <Loading message="Loading cart items..." />;
    if (productsError) return <ErrorMessage message="Failed to load product details" />;

    const totalPrice = cart.items.reduce((sum, item) => sum + item.priceSnapshot * item.quantity, 0);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Shopping Cart</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                    {cart.items.map((item, index) => {
                        const product = productQueries[index]?.data;
                        if (!product) return null;

                        return (
                            <div key={`${item.productId}-${item.size}`} className="card">
                                <div className="flex gap-4">
                                    {/* Product Image */}
                                    <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>

                                    {/* Product Info */}
                                    <div className="flex-1">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{product.name}</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Size: {item.size}</p>
                                        <p className="text-lg font-bold text-primary-600">{formatPrice(item.priceSnapshot)}</p>
                                    </div>

                                    {/* Quantity Controls */}
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() =>
                                                    updateQuantityMutation.mutate({
                                                        productId: item.productId,
                                                        size: Number(item.size),
                                                        quantity: item.quantity - 1,
                                                    })
                                                }
                                                disabled={updateQuantityMutation.isPending}
                                                className="btn btn-secondary w-8 h-8 text-sm p-0"
                                            >
                                                -
                                            </button>
                                            <span className="w-12 text-center font-semibold">{item.quantity}</span>
                                            <button
                                                onClick={() =>
                                                    updateQuantityMutation.mutate({
                                                        productId: item.productId,
                                                        size: Number(item.size),
                                                        quantity: item.quantity + 1,
                                                    })
                                                }
                                                disabled={updateQuantityMutation.isPending}
                                                className="btn btn-secondary w-8 h-8 text-sm p-0"
                                            >
                                                +
                                            </button>
                                        </div>
                                        <button
                                            onClick={() =>
                                                removeItemMutation.mutate({ productId: item.productId, size: Number(item.size) })
                                            }
                                            disabled={removeItemMutation.isPending}
                                            className="text-red-600 hover:text-red-700 text-sm"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}

                    <Button
                        variant="danger"
                        onClick={() => clearCartMutation.mutate()}
                        isLoading={clearCartMutation.isPending}
                    >
                        Clear Cart
                    </Button>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                    <div className="card sticky top-20">
                        <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Order Summary</h2>

                        <div className="space-y-2 mb-4">
                            <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                <span>Items ({cart.items.reduce((sum, item) => sum + item.quantity, 0)})</span>
                                <span>{formatPrice(totalPrice)}</span>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
                            <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                                <span>Total</span>
                                <span>{formatPrice(totalPrice)}</span>
                            </div>
                        </div>

                        <Button
                            onClick={() => createOrderMutation.mutate()}
                            isLoading={createOrderMutation.isPending}
                            className="w-full"
                        >
                            Checkout
                        </Button>

                        {createOrderMutation.error && (
                            <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                                {getErrorMessage(createOrderMutation.error)}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
