import React, { useState } from 'react';
import { SurvivorSeason } from '../../types';

interface BookmarkTimelineProps {
    season: SurvivorSeason;
    onAddManualBookmark: (summary: string) => void;
}

const BookmarkTimeline: React.FC<BookmarkTimelineProps> = ({ season, onAddManualBookmark }) => {
    const [newBookmarkSummary, setNewBookmarkSummary] = useState('');

    const handleAddBookmark = () => {
        if (newBookmarkSummary.trim()) {
            onAddManualBookmark(newBookmarkSummary.trim());
            setNewBookmarkSummary('');
        }
    };
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleAddBookmark();
        }
    };

    const bookmarks = season.bookmarks || [];
    
    return (
        <div className="text-xs">
            <h5 className="font-bold text-purple-400 mb-2">Bookmarks & Key Events</h5>
            <div className="flex items-center gap-2">
                <input 
                    type="text" 
                    value={newBookmarkSummary}
                    onChange={(e) => setNewBookmarkSummary(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Add manual bookmark..."
                    className="input-xs flex-1"
                />
                <button onClick={handleAddBookmark} className="btn-xs" disabled={!newBookmarkSummary.trim()}>Add</button>
            </div>
            {bookmarks.length > 0 && (
                <div className="mt-2 flex gap-2 overflow-x-auto pb-2 themed-scrollbar">
                    {bookmarks.map(bookmark => (
                        <button key={bookmark.id} title={bookmark.summary} className="p-2 bg-black/30 rounded-lg flex-shrink-0 text-left hover:bg-black/50 w-40">
                            <p className="font-semibold text-purple-300 capitalize">R{bookmark.round}: {bookmark.kind.replace('_', ' ')}</p>
                            <p className="text-gray-400 truncate">{bookmark.summary}</p>
                        </button>
                    ))}
                </div>
            )}
             <style>{`
                .input-xs { padding: 0.25rem 0.5rem; background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(168, 85, 247, 0.3); border-radius: 0.25rem; color: white; font-size: 0.75rem; }
                .btn-xs { padding: 0.25rem 0.5rem; border: 1px solid rgba(168, 85, 247, 0.5); background: rgba(168, 85, 247, 0.1); color: #a855f7; border-radius: 0.25rem; font-weight: 600; font-size: 0.75rem; }
                .btn-xs:disabled { opacity: 0.5; }
                .themed-scrollbar::-webkit-scrollbar { height: 6px; }
                .themed-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .themed-scrollbar::-webkit-scrollbar-thumb { background-color: rgba(168, 85, 247, 0.3); border-radius: 3px; }
                .themed-scrollbar::-webkit-scrollbar-thumb:hover { background-color: rgba(168, 85, 247, 0.5); }
            `}</style>
        </div>
    );
};

export default BookmarkTimeline;