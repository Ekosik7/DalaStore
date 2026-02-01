import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/shared/api/products';
import { categoriesApi } from '@/shared/api/categories';
import { Loading } from '@/shared/ui/Loading';
import { ErrorMessage } from '@/shared/ui/ErrorMessage';
import { EmptyState } from '@/shared/ui/EmptyState';
import { formatPrice } from '@/shared/utils/format';
import { getErrorMessage } from '@/shared/api/client';

export function ProductsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const [search, setSearch] = useState(searchParams.get('q') || '');

    const page = parseInt(searchParams.get('page') || '1', 10);
    const categoryId = searchParams.get('categoryId') || '';
    const q = searchParams.get('q') || '';

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: categoriesApi.getCategories,
    });

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['products', { page, categoryId, q }],
        queryFn: () => productsApi.getProducts({ page, limit: 12, categoryId, q }),
    });

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams);
        if (search) {
            params.set('q', search);
        } else {
            params.delete('q');
        }
        params.set('page', '1');
        setSearchParams(params);
    };

    const handleCategoryChange = (catId: string) => {
        const params = new URLSearchParams(searchParams);
        if (catId) {
            params.set('categoryId', catId);
        } else {
            params.delete('categoryId');
        }
        params.set('page', '1');
        setSearchParams(params);
    };

    const handlePageChange = (newPage: number) => {
        const params = new URLSearchParams(searchParams);
        params.set('page', newPage.toString());
        setSearchParams(params);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const totalPages = data ? Math.ceil(data.total / 12) : 0;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Products</h1>

            {/* Filters */}
            <div className="mb-8 space-y-4">
                {/* Search */}
                <form onSubmit={handleSearch} className="flex gap-2">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search products..."
                        className="input flex-1"
                    />
                    <button type="submit" className="btn btn-primary">
                        Search
                    </button>
                </form>

                {/* Categories */}
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={() => handleCategoryChange('')}
                        className={`px-4 py-2 rounded-lg transition-all ${!categoryId
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                            }`}
                    >
                        All
                    </button>
                    {categories?.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => handleCategoryChange(cat.id)}
                            className={`px-4 py-2 rounded-lg transition-all ${categoryId === cat.id
                                ? 'bg-primary-600 text-white'
                                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                                }`}
                        >
                            {cat.name}
                        </button>
                    ))}
                </div>
            </div>

            {/* Products */}
            {isLoading && <Loading />}
            {error && <ErrorMessage message={getErrorMessage(error)} onRetry={() => refetch()} />}
            {data && data.products.length === 0 && <EmptyState message="No products found" />}

            {data && data.products.length > 0 && (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                        {data.products.map((product) => (
                            <Link
                                key={product.id}
                                to={`/products/${product.id}`}
                                className="card hover:shadow-lg transition-all transform hover:-translate-y-1"
                            >
                                <div className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                                    {product.imageUrl ? (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className="object-cover w-full h-full"
                                        />
                                    ) : (
                                        <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    )}
                                </div>
                                <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{product.name}</h3>
                                <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">{product.description}</p>
                                <div className="flex justify-between items-center">
                                    <span className="text-xl font-bold text-primary-600">{formatPrice(product.price)}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">
                                        {(product.variants ?? []).reduce((sum, v) => sum + v.stock, 0)} in stock
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center gap-2">
                            <button
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 1}
                                className="btn btn-secondary disabled:opacity-50"
                            >
                                Previous
                            </button>
                            <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                                Page {page} of {totalPages}
                            </span>
                            <button
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page === totalPages}
                                className="btn btn-secondary disabled:opacity-50"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
