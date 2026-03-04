import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    iconBgColor: string;
    iconColor: string;
    onClick?: () => void;
}

const StatsCard: React.FC<StatsCardProps> = ({ title, value, icon: Icon, iconBgColor, iconColor, onClick }) => {
    return (
        <div
            className={`bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center justify-between transition-all ${onClick ? 'cursor-pointer hover:shadow-md hover:border-indigo-100 active:scale-[0.98]' : ''}`}
            onClick={onClick}
        >
            <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{title}</p>
                <p className="text-3xl font-bold text-gray-900">{value}</p>
            </div>
            <div className={`p-3 rounded-xl ${iconBgColor} flex items-center justify-center`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
        </div>
    );
};

export default StatsCard;
