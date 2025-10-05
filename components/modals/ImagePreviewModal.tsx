
import React from 'react';

interface ImagePreviewModalProps {
    imageUrl: string;
    onClose: () => void;
}

const ImagePreviewModal: React.FC<ImagePreviewModalProps> = ({ imageUrl, onClose }) => {
    return (
        <div
            className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] animate-[fadeIn_0.2s]"
            style={{ animationName: 'fadeIn' }}
            onClick={onClose}
        >
            <div className="relative max-w-[90vw] max-h-[90vh]" onClick={e => e.stopPropagation()}>
                <img src={imageUrl} alt="Full size preview" className="object-contain w-full h-full rounded-lg shadow-2xl shadow-purple-500/30" />
                <button
                    onClick={onClose}
                    className="absolute -top-3 -right-3 bg-white text-black rounded-full w-8 h-8 flex items-center justify-center text-xl font-bold border-2 border-black"
                    aria-label="Close image preview"
                >
                    &times;
                </button>
            </div>
        </div>
    );
};

export default ImagePreviewModal;
