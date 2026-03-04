import React, { ReactNode } from 'react';

interface FilterDropdownProps {
    children: ReactNode;
    onClose: () => void;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({ children, onClose }) => {
    return (
        <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.1)] border border-gray-100 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {children}
            {/* Backdrop-like invisible area to catch clicks outside if needed, 
                but usually handled by the parent button's toggle logic or a global click handler.
                For simplicity in this component, we just render the content. */}
        </div>
    );
};

export default FilterDropdown;
