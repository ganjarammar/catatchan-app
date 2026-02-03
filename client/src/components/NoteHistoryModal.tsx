import { memo } from 'react';
import { X, Clock } from 'lucide-react';
import { Note, NoteVersion } from './NoteCard';

interface NoteHistoryModalProps {
    note: Note;
    onClose: () => void;
    formatTime: (date: Date) => string;
}

const NoteHistoryModalComponent = ({ note, onClose, formatTime }: NoteHistoryModalProps) => {
    const history = [...(note.history || [])].sort((a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    const renderContent = (version: NoteVersion) => {
        if (version.fields) {
            return (
                <div className="grid grid-cols-1 gap-2 mt-2">
                    {Object.entries(version.fields).map(([key, value]) => {
                        if (!value.trim()) return null;
                        return (
                            <div key={key} className="space-y-0.5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                                    {key}
                                </p>
                                <p className="text-sm text-foreground/90 break-words">
                                    {value}
                                </p>
                            </div>
                        );
                    })}
                </div>
            );
        }
        return <p className="text-sm text-foreground/90 break-words mt-2 whitespace-pre-wrap">{version.text}</p>;
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div
                className="bg-background rounded-xl shadow-2xl w-full max-w-lg max-h-[80vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border flex-shrink-0">
                    <div className="flex items-center gap-2">
                        <Clock size={20} className="text-accent" />
                        <h2 className="text-lg font-display font-bold">Version History</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {history.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                            No history available for this note.
                        </div>
                    ) : (
                        history.map((version, index) => (
                            <div key={index} className="relative pl-6 border-l-2 border-border/50 pb-6 last:border-0 last:pb-0">
                                {/* Timeline wrapper */}
                                <div className="absolute -left-[5px] top-0 w-2.5 h-2.5 rounded-full bg-border" />

                                <div className="text-xs font-medium text-muted-foreground mb-1">
                                    {formatTime(new Date(version.timestamp))}
                                </div>

                                <div className="bg-card rounded-lg border border-border/50 p-3">
                                    {renderContent(version)}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-4 border-t border-border bg-secondary/20 rounded-b-xl text-center">
                    <p className="text-xs text-muted-foreground">
                        Showing {history.length} previous version{history.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>
        </div>
    );
};

export const NoteHistoryModal = memo(NoteHistoryModalComponent);
