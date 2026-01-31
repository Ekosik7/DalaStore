import React from 'react';
import { Link } from 'react-router-dom';

export function Footer() {
    return (
        <footer className="bg-gray-100 dark:bg-gray-900 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* About */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">DalaStore</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            Your one-stop shop for quality products. We offer a wide range of items at competitive prices.
                        </p>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Quick Links</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link to="/products" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
                                    Products
                                </Link>
                            </li>
                            <li>
                                <Link to="/cart" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
                                    Cart
                                </Link>
                            </li>
                            <li>
                                <Link to="/orders" className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400">
                                    Orders
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Contact</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">
                            Email: support@dalastore.com<br />
                            Phone: +1 (555) 123-4567
                        </p>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-center text-gray-600 dark:text-gray-400 text-sm">
                        © {new Date().getFullYear()} DalaStore. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
