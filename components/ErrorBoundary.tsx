import React from 'react';

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, ErrorBoundaryState> {
    state: ErrorBoundaryState = { hasError: false, error: null };

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error("Uncaught error in component:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="max-w-4xl mx-auto p-8 bg-red-900/20 border border-red-500/30 rounded-lg text-center">
                    <h2 className="text-2xl font-bold text-red-400">A Critical Error Occurred</h2>
                    <p className="text-red-300 mt-2">The simulation has encountered an unexpected problem. Please try refreshing or starting a new season.</p>
                    <details className="mt-4 text-left text-xs text-red-300/70 bg-black/20 p-2 rounded">
                        <summary className="cursor-pointer">Error Details</summary>
                        <pre className="whitespace-pre-wrap mt-2">{this.state.error?.toString()}</pre>
                    </details>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
