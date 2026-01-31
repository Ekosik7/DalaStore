import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

export function AdminLayout() {
    const location = useLocation();

    const isActive = (path: string) => location.pathname === path;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Admin Panel</h1>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar */}
                <div className="lg:col-span-1">
                    <nav className="card space-y-2">
                        <Link
                            to="/admin/categories"
                            className={`block px-4 py-2 rounded-lg transition-all ${isActive('/admin/categories')
                                    ? 'bg-primary-600 text-white'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            Categories
                        </Link>
                        <Link
                            to="/admin/products"
                            className={`block px-4 py-2 rounded-lg transition-all ${isActive('/admin/products')
                                    ? 'bg-primary-600 text-white'
                                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            Products
                        </Link>
                    </nav>
                </div>

                {/* Content */}
                <div className="lg:col-span-3">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
