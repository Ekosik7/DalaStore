import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '@/shared/api/orders';
import { Loading } from '@/shared/ui/Loading';
import { ErrorMessage } from '@/shared/ui/ErrorMessage';
import { EmptyState } from '@/shared/ui/EmptyState';
import { formatPrice, formatDateTime } from '@/shared/utils/format';
import { getErrorMessage } from '@/shared/api/client';

export function OrdersPage() {
    const [page, setPage] = useState(1);
    const queryClient = useQueryClient();

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ['orders', { page }],
        queryFn: () => ordersApi.getMyOrders({ page, limit: 10 }),
    });

    const { data: stats } = useQuery({
        queryKey: ['orderStats'],
        queryFn: ordersApi.getOrderStats,
    });

    const updateStatusMutation = useMutation({
        mutationFn: ({ orderId, status }: { orderId: string; status: 'created' | 'paid' | 'cancelled' }) =>
            ordersApi.updateOrderStatus(orderId, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['orderStats'] });
        },
    });

    if (isLoading) return <Loading />;
    if (error) return <ErrorMessage message={getErrorMessage(error)} onRetry={() => refetch()} />;
    if (!data || data.orders.length === 0) {
        return (
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">My Orders</h1>
                <EmptyState message="You haven't placed any orders yet" />
            </div>
        );
    }

    const totalPages = Math.ceil(data.total / 10);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'created':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
            case 'paid':
                return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
            case 'cancelled':
                return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
        }
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">My Orders</h1>

            {/* Stats */}
            {stats && stats.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {stats.map((stat) => (
                        <div key={stat.status} className="card">
                            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1 capitalize">
                                {stat.status} Orders
                            </h3>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.count}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Total: {formatPrice(stat.total)}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Orders List */}
            <div className="space-y-4">
                {data.orders.map((order) => (
                    <div key={order.id} className="card">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Order #{order.id.slice(-8)}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    {formatDateTime(order.createdAt)}
                                </p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(order.status)}`}>
                                {order.status}
                            </span>
                        </div>

                        <div className="space-y-2 mb-4">
                            {order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm">
                                    <span className="text-gray-700 dark:text-gray-300">
                                        Product (Size {item.size}) × {item.quantity}
                                    </span>
                                    <span className="text-gray-900 dark:text-white font-medium">
                                        {formatPrice(item.price * item.quantity)}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
                                <span className="text-lg font-bold text-primary-600">
                                    {formatPrice(order.totalPrice)}
                                </span>
                            </div>

                            {order.status === 'created' && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'paid' })}
                                        disabled={updateStatusMutation.isPending}
                                        className="btn btn-primary flex-1 disabled:opacity-50"
                                    >
                                        Mark as Paid
                                    </button>
                                    <button
                                        onClick={() => updateStatusMutation.mutate({ orderId: order.id, status: 'cancelled' })}
                                        disabled={updateStatusMutation.isPending}
                                        className="btn btn-secondary flex-1 disabled:opacity-50"
                                    >
                                        Cancel Order
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-8">
                    <button
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                        className="btn btn-secondary disabled:opacity-50"
                    >
                        Previous
                    </button>
                    <span className="px-4 py-2 text-gray-700 dark:text-gray-300">
                        Page {page} of {totalPages}
                    </span>
                    <button
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                        className="btn btn-secondary disabled:opacity-50"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
