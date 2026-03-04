import { ReactNode } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface WelcomeStateProps {
    icons: ReactNode;
    title: string;
    description: ReactNode;
    features: string[];
    actionLabel?: string;
    onAction?: () => void;
    customActions?: ReactNode;
}

export const WelcomeState = ({
    icons,
    title,
    description,
    features,
    actionLabel,
    onAction,
    customActions,
}: WelcomeStateProps) => {
    return (
        <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto px-4 text-center py-6">
            {/* Visual Header */}
            <div className="mb-6 relative flex items-center justify-center">
                {icons}
            </div>

            {/* Main Title & Description */}
            <div className="mb-5 space-y-2">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">
                    {title}
                </h2>
                <div className="text-gray-500 text-sm max-w-lg mx-auto leading-relaxed">
                    {description}
                </div>
            </div>

            {/* Divider */}
            <div className="w-full max-w-[400px] border-t-2 border-gray-300 border-dashed my-2 mb-6 relative"></div>

            {/* Features List */}
            <div className="w-full max-w-md text-left mb-8">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 pl-1">
                    You'll unlock:
                </h3>
                <ul className="space-y-3">
                    {features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-3 text-sm text-gray-600">
                            <span className="shrink-0 mt-0.5">
                                <Sparkles className="w-4 h-4 text-gray-400 fill-gray-100" />
                            </span>
                            <span>{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Action Buttons */}
            {customActions ? (
                <div className="w-full max-w-md space-y-3">
                    {customActions}
                </div>
            ) : (
                <button
                    onClick={onAction}
                    className="group relative inline-flex items-center justify-center gap-2 px-8 py-3 text-sm font-medium text-white bg-[#553C9A] hover:bg-[#44337A] rounded-xl shadow-lg shadow-indigo-500/20 transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0"
                >
                    <span>{actionLabel}</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                </button>
            )}
        </div>
    );
};
