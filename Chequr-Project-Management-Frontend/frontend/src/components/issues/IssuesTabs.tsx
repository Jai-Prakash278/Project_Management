import React from 'react';
import { IssueTab } from '../../types/issue.types';

interface IssuesTabsProps {
    activeTab: IssueTab;
    onTabChange: (tab: IssueTab) => void;
}

const IssuesTabs: React.FC<IssuesTabsProps> = ({ activeTab, onTabChange }) => {
    const tabs: { id: IssueTab; label: string }[] = [
        { id: 'assigned', label: 'Assigned to Me' },
        { id: 'reported', label: 'Reported by Me' },
    ];

    return (
        <div className="border-b border-gray-200 mb-6">
            <nav className="-mb-px flex space-x-8">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => onTabChange(tab.id)}
                        className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
              ${activeTab === tab.id
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }
            `}
                    >
                        {tab.label}
                    </button>
                ))}
            </nav>
        </div>
    );
};

export default IssuesTabs;
