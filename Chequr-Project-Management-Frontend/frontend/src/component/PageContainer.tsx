import { ReactNode } from 'react';

interface PageContainerProps {
    title: string;
    children?: ReactNode;
}

export default function PageContainer({ title, children }: PageContainerProps) {
    return (
        <div className="flex flex-col h-full bg-white">
            {/* Page Header */}
            <div className="flex items-center px-8 py-6 border-b border-gray-300">
                <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 p-8">
                {children}
            </div>
        </div>
    );
}
