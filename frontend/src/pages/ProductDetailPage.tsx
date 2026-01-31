import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/shared/api/products';
import { cartApi } from '@/shared/api/cart';
import { useAuth } from '@/entities/auth/AuthContext';
import { Loading } from '@/shared/ui/Loading';
import { ErrorMessage } from '@/shared/ui/ErrorMessage';
import { Button } from '@/shared/ui/Button';
import { formatPrice } from '@/shared/utils/format';
import { getErrorMessage } from '@/shared/api/client';

export function ProductDetailPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const [selectedSize, setSelectedSize] = useState<number | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [message, setMessage] = useState('');

    const { data: product, isLoading, error, refetch } = useQuery({
        queryKey: ['product', id],
        queryFn: () => productsApi.getProduct(id!),
        enabled: !!id,
    });

    const addToCartMutation = useMutation({
        mutationFn: cartApi.addToCart,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['cart'] });
            setMessage('Added to cart successfully!');
            setTimeout(() => setMessage(''), 3000);
        },
        onError: (error) => {
            setMessage(getErrorMessage(error));
        },
    });

    const selectedVariant = (product?.variants ?? []).find((v) => v.size === selectedSize);

    const handleAddToCart = () => {
        if (!user) {
            navigate('/login');
            return;
        }

        if (!selectedSize) {
            setMessage('Please select a size');
            return;
        }

        const payload = {
            productId: id!,
            size: Number(selectedSize),
            quantity,
        };

        console.log(' Adding to cart:', payload);
        console.log(' Product data:', product);

        addToCartMutation.mutate(payload);
    };

    if (isLoading) return <Loading />;
    if (error) return <ErrorMessage message={getErrorMessage(error)} onRetry={() => refetch()} />;
    if (!product) return <ErrorMessage message="Product not found" />;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Product Image */}
                <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <svg className="h-48 w-48 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                </div>

                {/* Product Info */}
                <div>
                    <h1 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">{product.name}</h1>
                    <p className="text-3xl font-bold text-primary-600 mb-6">{formatPrice(product.price)}</p>

                    <div className="mb-6">
                        <p className="text-gray-600 dark:text-gray-400">{product.description}</p>
                    </div>

                    {/* Size Selection */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                            Select Size
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {(product.variants ?? []).map((variant) => (
                                <button
                                    key={variant.size}
                                    onClick={() => setSelectedSize(variant.size)}
                                    disabled={variant.stock === 0}
                                    className={`px-4 py-2 rounded-lg border-2 transition-all ${selectedSize === variant.size
                                        ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                                        : variant.stock === 0
                                            ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                                            : 'border-gray-300 dark:border-gray-600 hover:border-primary-400'
                                        }`}
                                >
                                    Size {variant.size}
                                    {variant.stock === 0 && ' (Out of stock)'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Selected Variant Info */}
                    {selectedVariant && (
                        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Color:</span> {selectedVariant.color}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Stock:</span> {selectedVariant.stock} available
                            </p>
                        </div>
                    )}

                    {/* Quantity */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                            Quantity
                        </label>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                className="btn btn-secondary w-10 h-10"
                            >
                                -
                            </button>
                            <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                            <button
                                onClick={() => setQuantity(Math.min(selectedVariant?.stock || 99, quantity + 1))}
                                disabled={!selectedVariant}
                                className="btn btn-secondary w-10 h-10"
                            >
                                +
                            </button>
                        </div>
                    </div>

                    {/* Message */}
                    {message && (
                        <div className={`mb-4 p-3 rounded-lg ${message.includes('success')
                            ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                            : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                            }`}>
                            {message}
                        </div>
                    )}

                    {/* Add to Cart Button */}
                    <Button
                        onClick={handleAddToCart}
                        className="w-full"
                        disabled={!selectedVariant || selectedVariant.stock === 0}
                        isLoading={addToCartMutation.isPending}
                    >
                        Add to Cart
                    </Button>
                </div>
            </div>
        </div>
    );
}
