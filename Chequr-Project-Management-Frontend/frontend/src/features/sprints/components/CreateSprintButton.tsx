import React from 'react';

interface CreateSprintButtonProps {
    onClick: () => void;
}

const CreateSprintButton: React.FC<CreateSprintButtonProps> = ({ onClick }) => {
    return (
        <button
            onClick={onClick}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-sm font-medium transition-colors"
        >
            Create Sprint
        </button>
    );
};

export default CreateSprintButton;
