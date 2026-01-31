import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoriesApi } from '@/shared/api/categories';
import { Loading } from '@/shared/ui/Loading';
import { ErrorMessage } from '@/shared/ui/ErrorMessage';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { getErrorMessage } from '@/shared/api/client';

export function CategoriesPage() {
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = useState(false);
    const [formData, setFormData] = useState({ name: '', slug: '' });
    const [error, setError] = useState('');

    const { data: categories, isLoading, error: fetchError, refetch } = useQuery({
        queryKey: ['categories'],
        queryFn: categoriesApi.getCategories,
    });

    const createMutation = useMutation({
        mutationFn: categoriesApi.createCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
            setFormData({ name: '', slug: '' });
            setIsCreating(false);
            setError('');
        },
        onError: (err) => {
            setError(getErrorMessage(err));
        },
    });

    const deleteMutation = useMutation({
        mutationFn: categoriesApi.deleteCategory,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['categories'] });
        },
        onError: (err) => {
            alert(getErrorMessage(err));
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.slug) {
            setError('All fields are required');
            return;
        }
        createMutation.mutate(formData);
    };

    if (isLoading) return <Loading />;
    if (fetchError) return <ErrorMessage message={getErrorMessage(fetchError)} onRetry={() => refetch()} />;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Categories</h2>
                <Button onClick={() => setIsCreating(!isCreating)}>
                    {isCreating ? 'Cancel' : 'Add Category'}
                </Button>
            </div>

            {/* Create Form */}
            {isCreating && (
                <div className="card mb-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Create Category</h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg">
                                {error}
                            </div>
                        )}
                        <Input
                            label="Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <Input
                            label="Slug"
                            value={formData.slug}
                            onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase() })}
                            placeholder="e.g., electronics"
                            required
                        />
                        <Button type="submit" isLoading={createMutation.isPending}>
                            Create
                        </Button>
                    </form>
                </div>
            )}

            {/* Categories List */}
            {!categories || categories.length === 0 ? (
                <EmptyState message="No categories yet" />
            ) : (
                <div className="space-y-3">
                    {categories.map((category) => (
                        <div key={category.id} className="card flex justify-between items-center">
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">{category.name}</h3>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Slug: {category.slug}</p>
                            </div>
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={() => {
                                    if (confirm('Are you sure you want to delete this category?')) {
                                        deleteMutation.mutate(category.id);
                                    }
                                }}
                                isLoading={deleteMutation.isPending}
                            >
                                Delete
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
