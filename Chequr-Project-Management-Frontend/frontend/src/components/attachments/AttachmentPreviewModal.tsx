import React, { useState, useEffect, Fragment } from 'react';
import { Download, X, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useMutation } from '@apollo/client/react';
import { UPDATE_ATTACHMENT_MUTATION } from '../../graphql/issue.mutation';
import { Attachment } from '../../types/issue.types';
import { Dialog, Transition } from '@headlessui/react';

interface AttachmentPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    attachment: Attachment | null;
    imageUrl: string | null;
    onDownload: (attachment: Attachment) => Promise<void>;
    onRefetch: () => void;
}

const AttachmentPreviewModal: React.FC<AttachmentPreviewModalProps> = ({
    isOpen,
    onClose,
    attachment,
    imageUrl,
    onDownload,
}) => {
    const [zoom, setZoom] = useState(1);

    useEffect(() => {
        if (isOpen) {
            setZoom(1);
        }
    }, [isOpen, attachment?.id]);

    const handleZoomIn = (e: React.MouseEvent) => {
        e.stopPropagation();
        setZoom(prev => Math.min(prev + 0.25, 4));
    };

    const handleZoomOut = (e: React.MouseEvent) => {
        e.stopPropagation();
        setZoom(prev => Math.max(prev - 0.25, 0.5));
    };

    const handleResetZoom = (e: React.MouseEvent) => {
        e.stopPropagation();
        setZoom(1);
    };

    if (!attachment) return null;

    const isImage = attachment.mimeType?.startsWith('image/');

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-[100]" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-[#1D2125] transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 overflow-hidden">
                    <div
                        className="flex h-full w-full items-center justify-center relative cursor-zoom-out"
                        onClick={onClose}
                    >
                        {/* Top Floating Controls */}
                        <div className="absolute top-4 right-4 flex items-center gap-4 z-50">
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDownload(attachment);
                                }}
                                className="text-gray-400 hover:text-white transition-all p-2 hover:bg-white/10 rounded-full"
                                title="Download"
                            >
                                <Download size={22} />
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onClose();
                                }}
                                className="text-gray-400 hover:text-white transition-all p-2 hover:bg-white/10 rounded-full"
                                title="Close (Esc)"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Centered Image Container */}
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300 zoom-in-95"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <div
                                className="w-full h-full overflow-auto custom-scrollbar flex p-4 md:p-12"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {isImage && imageUrl ? (
                                    <div
                                        className="m-auto relative flex items-center justify-center transition-all duration-300 ease-in-out"
                                        style={{
                                            padding: `${(zoom - 1) * 20}%`,
                                            minWidth: 'fit-content',
                                            minHeight: 'fit-content'
                                        }}
                                    >
                                        <img
                                            src={imageUrl}
                                            alt={attachment.fileName}
                                            style={{
                                                transform: `scale(${zoom})`,
                                                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                transformOrigin: 'center center'
                                            }}
                                            className="max-h-[85vh] max-w-[85vw] object-contain shadow-2xl-dark animate-fadeIn"
                                        />
                                    </div>
                                ) : (
                                    <div className="m-auto flex flex-col items-center gap-4 text-gray-500">
                                        <div className="p-12 bg-white/5 rounded-full border border-white/10">
                                            <X size={64} className="text-gray-600" />
                                        </div>
                                        <p className="text-lg font-medium text-gray-400">Preview not available for this file type</p>
                                    </div>
                                )}
                            </div>
                        </Transition.Child>

                        {/* Bottom Floating Zoom Controls */}
                        {isImage && imageUrl && (
                            <div
                                className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1 p-1 bg-white/10 backdrop-blur-xl rounded-full border border-white/10 z-50 opacity-0 group-hover:opacity-100 sm:opacity-100 transition-opacity"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <button
                                    onClick={handleZoomOut}
                                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                                    title="Zoom Out"
                                >
                                    <ZoomOut size={18} />
                                </button>
                                <button
                                    onClick={handleResetZoom}
                                    className="px-3 py-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-full text-xs font-bold transition-colors"
                                    title="Reset Zoom"
                                >
                                    {Math.round(zoom * 100)}%
                                </button>
                                <button
                                    onClick={handleZoomIn}
                                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                                    title="Zoom In"
                                >
                                    <ZoomIn size={18} />
                                </button>
                                <div className="w-px h-4 bg-white/10 mx-1" />
                                <button
                                    onClick={handleResetZoom}
                                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                                    title="Fit to Screen"
                                >
                                    <Maximize2 size={18} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </Dialog>
        </Transition.Root>
    );
};

export default AttachmentPreviewModal;
