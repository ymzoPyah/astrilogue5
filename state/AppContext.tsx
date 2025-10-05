import React, { createContext, useContext, ReactNode } from 'react';
import { useAppLogic } from '../hooks/useAppLogic';
import type { AppLogic } from '../hooks/useAppLogic';

// The context is created with a null default value, but the provider ensures
// it's always populated, so the hook's type assertion is safe.
const AppContext = createContext<AppLogic | null>(null);

/**
 * Provides the application's state and logic to all descendant components.
 * It calls the master `useAppLogic` hook and passes the return value
 * into the context.
 */
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const appLogic = useAppLogic();
    return (
        <AppContext.Provider value={appLogic}>
            {children}
        </AppContext.Provider>
    );
};

/**
 * Custom hook for components to easily access the application's state and logic.
 * Throws an error if used outside of an AppProvider, ensuring proper usage.
 */
export const useAppContext = (): AppLogic => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within an AppProvider');
    }
    return context;
};