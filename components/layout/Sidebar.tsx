
import React, { ReactNode } from 'react';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    children: ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, children }) => {
    return (
        <>
            <div 
                className={`fixed inset-0 bg-black/80 backdrop-blur-sm z-50 transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={onClose}
                aria-hidden="true"
            ></div>
            <div 
                className={`fixed top-0 right-0 h-full w-full max-w-md bg-[#0a0a0f]/95 border-l-2 border-purple-500/30 shadow-2xl shadow-black p-6 pt-20 overflow-y-auto z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby="sidebar-title"
            >
                <button onClick={onClose} className="absolute top-6 right-6 text-2xl text-gray-400 hover:text-white" aria-label="Close sidebar">&times;</button>
                {React.Children.map(children, child => 
                    React.isValidElement(child) ? React.cloneElement(child as React.ReactElement<{ id: string }>, { id: 'sidebar-title' }) : child
                )}
            </div>
        </>
    );
};

export default Sidebar;