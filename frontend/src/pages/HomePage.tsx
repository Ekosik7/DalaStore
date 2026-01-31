import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/shared/api/products';
import { categoriesApi } from '@/shared/api/categories';
import { Loading } from '@/shared/ui/Loading';
import { formatPrice } from '@/shared/utils/format';

export function HomePage() {
    const { data: productsData, isLoading: productsLoading } = useQuery({
        queryKey: ['products', { limit: 6 }],
        queryFn: () => productsApi.getProducts({ limit: 6 }),
    });

    const { data: categories, isLoading: categoriesLoading } = useQuery({
        queryKey: ['categories'],
        queryFn: categoriesApi.getCategories,
    });

    if (productsLoading || categoriesLoading) {
        return <Loading />;
    }

    return (
        <div className="min-h-screen">
            {/* Hero Section */}
            <section className="bg-gradient-to-r from-primary-600 to-primary-800 text-white py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h1 className="text-5xl font-bold mb-4 animate-fade-in">Welcome to DalaStore</h1>
                    <p className="text-xl mb-8 opacity-90">Discover amazing products at unbeatable prices</p>
                    <Link to="/products" className="inline-block bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all">
                        Shop Now
                    </Link>
                </div>
            </section>

            {/* Categories */}
            <section className="py-16 bg-gray-50 dark:bg-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">Shop by Category</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {categories?.slice(0, 4).map((category) => (
                            <Link
                                key={category.id}
                                to={`/products?categoryId=${category.id}`}
                                className="card text-center hover:shadow-lg transition-all transform hover:-translate-y-1"
                            >
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{category.name}</h3>
                            </Link>
                        ))}
                    </div>
                </div>
            </section>

            {/* Featured Products */}
            <section className="py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-3xl font-bold mb-8 text-center text-gray-900 dark:text-white">Featured Products</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {productsData?.products.map((product) => (
                            <Link
                                key={product.id}
                                to={`/products/${product.id}`}
                                className="card hover:shadow-lg transition-all transform hover:-translate-y-1"
                            >
                                <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 flex items-center justify-center">
                                    <svg className="h-20 w-20 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                    </svg>
                                </div>
                                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{product.name}</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">{product.description}</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-2xl font-bold text-primary-600">{formatPrice(product.price)}</span>
                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                        {(product.variants ?? []).reduce((sum, v) => sum + v.stock, 0)} in stock
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                    <div className="text-center mt-8">
                        <Link to="/products" className="btn btn-primary">
                            View All Products
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
}
