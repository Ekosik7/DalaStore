import React from 'react';

interface ErrorMessageProps {
    message: string;
    onRetry?: () => void;
}

export function ErrorMessage({ message, onRetry }: ErrorMessageProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12">
            <div className="text-red-600 dark:text-red-400 mb-4">
                <svg className="h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Error</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4 text-center max-w-md">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="btn btn-primary"
                >
                    Try Again
                </button>
            )}
        </div>
    );
}
