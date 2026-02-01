import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsApi } from '@/shared/api/products';
import { categoriesApi } from '@/shared/api/categories';
import { Loading } from '@/shared/ui/Loading';
import { ErrorMessage } from '@/shared/ui/ErrorMessage';
import { EmptyState } from '@/shared/ui/EmptyState';
import { Button } from '@/shared/ui/Button';
import { Input } from '@/shared/ui/Input';
import { formatPrice } from '@/shared/utils/format';
import { getErrorMessage } from '@/shared/api/client';
import { ProductInput } from '@/shared/types';

export function ProductsManagePage() {
    const queryClient = useQueryClient();
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [stockManagement, setStockManagement] = useState<{ productId: string; size: number } | null>(null);
    const [stockDelta, setStockDelta] = useState(0);

    const [formData, setFormData] = useState<ProductInput & { imageUrl?: string }>({
        name: '',
        description: '',
        price: 0,
        categoryId: '',
        variants: [{ size: 1, color: 'default', stock: 0 }],
        isActive: true,
        imageUrl: '',
    });

    const { data: products, isLoading, error: fetchError, refetch } = useQuery({
        queryKey: ['admin-products'],
        queryFn: () => productsApi.getProducts({ limit: 50 }),
    });

    const { data: categories } = useQuery({
        queryKey: ['categories'],
        queryFn: categoriesApi.getCategories,
    });

    const createMutation = useMutation({
        mutationFn: productsApi.createProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            resetForm();
        },
    });

    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<ProductInput> }) =>
            productsApi.updateProduct(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            resetForm();
        },
    });

    const deleteMutation = useMutation({
        mutationFn: productsApi.deleteProduct,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
        },
    });

    const updateStockMutation = useMutation({
        mutationFn: ({ id, size, delta }: { id: string; size: number; delta: number }) =>
            productsApi.updateVariantStock(id, { size, delta }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            queryClient.invalidateQueries({ queryKey: ['products'] });
            setStockManagement(null);
            setStockDelta(0);
        },
    });

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            price: 0,
            categoryId: '',
            variants: [{ size: 1, color: 'default', stock: 0 }],
            isActive: true,
        });
        setIsCreating(false);
        setEditingId(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingId) {
            updateMutation.mutate({ id: editingId, data: formData });
        } else {
            createMutation.mutate(formData);
        }
    };

    const handleEdit = (product: any) => {
        setFormData({
            name: product.name,
            description: product.description,
            price: product.price,
            categoryId: product.categoryId,
            variants: product.variants,
            isActive: product.isActive,
            imageUrl: product.imageUrl || '',
        });
        setEditingId(product.id);
        setIsCreating(true);
    };

    const addVariant = () => {
        setFormData({
            ...formData,
            variants: [...formData.variants, { size: formData.variants.length + 1, color: 'default', stock: 0 }],
        });
    };

    const removeVariant = (index: number) => {
        setFormData({
            ...formData,
            variants: formData.variants.filter((_, i) => i !== index),
        });
    };

    const updateVariant = (index: number, field: string, value: any) => {
        const newVariants = [...formData.variants];
        newVariants[index] = { ...newVariants[index], [field]: value };
        setFormData({ ...formData, variants: newVariants });
    };

    if (isLoading) return <Loading />;
    if (fetchError) return <ErrorMessage message={getErrorMessage(fetchError)} onRetry={() => refetch()} />;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Products</h2>
                <Button onClick={() => setIsCreating(!isCreating)}>
                    {isCreating ? 'Cancel' : 'Add Product'}
                </Button>
            </div>

            {/* Create/Edit Form */}
            {isCreating && (
                <div className="card mb-6">
                    <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                        {editingId ? 'Edit Product' : 'Create Product'}
                    </h3>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Input
                            label="Name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <Input
                            label="Image URL"
                            value={formData.imageUrl}
                            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                            placeholder="https://..."
                        />
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                                Description
                            </label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="input"
                                rows={3}
                            />
                        </div>
                        <Input
                            label="Price"
                            type="number"
                            step="0.01"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                            required
                        />
                        <div>
                            <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">
                                Category
                            </label>
                            <select
                                value={formData.categoryId}
                                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                                className="input"
                                required
                            >
                                <option value="">Select category</option>
                                {categories?.map((cat) => (
                                    <option key={cat.id} value={cat.id}>
                                        {cat.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Variants */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Variants
                                </label>
                                <Button type="button" size="sm" onClick={addVariant}>
                                    Add Variant
                                </Button>
                            </div>
                            <div className="space-y-2">
                                {formData.variants.map((variant, index) => (
                                    <div key={index} className="flex gap-2 items-end">
                                        <Input
                                            label="Size"
                                            type="number"
                                            value={variant.size}
                                            onChange={(e) => updateVariant(index, 'size', parseInt(e.target.value))}
                                            required
                                        />
                                        <Input
                                            label="Color"
                                            value={variant.color}
                                            onChange={(e) => updateVariant(index, 'color', e.target.value)}
                                            required
                                        />
                                        <Input
                                            label="Stock"
                                            type="number"
                                            value={variant.stock}
                                            onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value))}
                                            required
                                        />
                                        {formData.variants.length > 1 && (
                                            <Button
                                                type="button"
                                                variant="danger"
                                                size="sm"
                                                onClick={() => removeVariant(index)}
                                            >
                                                Remove
                                            </Button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                className="rounded"
                            />
                            <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                                Active
                            </label>
                        </div>

                        <div className="flex gap-2">
                            <Button type="submit" isLoading={createMutation.isPending || updateMutation.isPending}>
                                {editingId ? 'Update' : 'Create'}
                            </Button>
                            <Button type="button" variant="secondary" onClick={resetForm}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Products List */}
            {!products || products.products.length === 0 ? (
                <EmptyState message="No products yet" />
            ) : (
                <div className="space-y-3">
                    {products.products.map((product) => (
                        <div key={product.id} className="card">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-white">{product.name}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">{product.description}</p>
                                    <p className="text-lg font-bold text-primary-600 mt-1">{formatPrice(product.price)}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" onClick={() => handleEdit(product)}>
                                        Edit
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="danger"
                                        onClick={() => {
                                            if (confirm('Are you sure?')) {
                                                deleteMutation.mutate(product.id);
                                            }
                                        }}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>

                            {/* Variants */}
                            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Variants:</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                    {product.variants.map((variant) => (
                                        <div
                                            key={variant.size}
                                            className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded"
                                        >
                                            <span className="text-sm text-gray-700 dark:text-gray-300">
                                                Size {variant.size} ({variant.color}) - Stock: {variant.stock}
                                            </span>
                                            <Button
                                                size="sm"
                                                onClick={() => setStockManagement({ productId: product.id, size: variant.size })}
                                            >
                                                Adjust
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Stock Management Modal */}
            {stockManagement && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="card max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                            Adjust Stock
                        </h3>
                        <div className="space-y-4">
                            <Input
                                label="Delta (positive to add, negative to subtract)"
                                type="number"
                                value={stockDelta}
                                onChange={(e) => setStockDelta(parseInt(e.target.value) || 0)}
                            />
                            <div className="flex gap-2">
                                <Button
                                    onClick={() =>
                                        updateStockMutation.mutate({
                                            id: stockManagement.productId,
                                            size: stockManagement.size,
                                            delta: stockDelta,
                                        })
                                    }
                                    isLoading={updateStockMutation.isPending}
                                >
                                    Update
                                </Button>
                                <Button variant="secondary" onClick={() => setStockManagement(null)}>
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
