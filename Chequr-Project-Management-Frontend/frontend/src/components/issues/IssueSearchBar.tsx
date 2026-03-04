import React from 'react';
import { Search } from 'lucide-react';

interface IssueSearchBarProps {
    onSearch: (query: string) => void;
}

const IssueSearchBar: React.FC<IssueSearchBarProps> = ({ onSearch }) => {
    return (
        <div className="flex items-center w-full">
            <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    placeholder="Search issues..."
                    onChange={(e) => onSearch(e.target.value)}
                />
            </div>
        </div>
    );
};

export default IssueSearchBar;
