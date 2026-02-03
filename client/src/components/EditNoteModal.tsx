import { useState, useEffect, useRef, memo } from 'react';
import { X, Save } from 'lucide-react';
import { Note } from './NoteCard';
import { ExtendedNoteForm } from './ExtendedNoteForm';
import { TEMPLATES, extractTags, stripAllTags } from '@/lib/templates';

interface EditNoteModalProps {
    note: Note;
    onSave: (updatedNote: Partial<Note>) => void;
    onClose: () => void;
    allTags: string[];
}

const EditNoteModalComponent = ({ note, onSave, onClose, allTags }: EditNoteModalProps) => {
    // Determine if we are editing an extended template note
    const template = note.template ? TEMPLATES[note.template] : null;

    // State for simple note editing
    const [text, setText] = useState(note.text);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Focus textarea on mount for simple notes
    useEffect(() => {
        if (!template && textareaRef.current) {
            textareaRef.current.focus();
            // Move cursor to end
            textareaRef.current.setSelectionRange(text.length, text.length);
        }
    }, [template, text.length]);

    // Handle saving for simple notes
    const handleSimpleSave = () => {
        if (!text.trim()) return;

        const tags = extractTags(text);
        onSave({
            text: text,
            tags: tags,
            template: undefined,
            fields: undefined
        });
        onClose();
    };

    // Handle saving for extended notes
    const handleExtendedSave = (fields: Record<string, string>, tags: string[]) => {
        onSave({
            text: '', // Extended notes usually store content in fields
            tags: tags,
            fields: fields
        });
        onClose();
    };

    const handleExtendedCancel = () => {
        onClose();
    };

    // Handle generic keyboard events (Esc to close)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                // For extended form, it handles its own Esc, but if we are at the modal level
                // and not capturing it there, we should close.
                // However, ExtendedNoteForm has its own Esc handler.
                // For simple mode:
                if (!template) {
                    onClose();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, template]);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div
                className="bg-background rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border">
                    <h2 className="text-lg font-display font-bold">Edit Note</h2>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-4">
                    {template ? (
                        <ExtendedNoteForm
                            template={template}
                            onSave={handleExtendedSave}
                            onCancel={handleExtendedCancel}
                            initialTags={note.tags}
                            initialFields={note.fields}
                            allTags={allTags}
                        />
                    ) : (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Note Content</label>
                                <textarea
                                    ref={textareaRef}
                                    value={text}
                                    onChange={(e) => setText(e.target.value)}
                                    className="w-full h-64 p-4 bg-card text-foreground border border-border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-accent"
                                    placeholder="Edit your note here... (use #tags for categories)"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                                            handleSimpleSave();
                                        }
                                    }}
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <button
                                    onClick={onClose}
                                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary rounded-md transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSimpleSave}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent text-accent-foreground rounded-md hover:bg-accent/90 transition-colors"
                                >
                                    <Save size={16} />
                                    Save Changes
                                </button>
                            </div>
                            <p className="text-xs text-muted-foreground text-center">
                                Press <kbd className="px-1 rounded bg-secondary border border-border">Ctrl+Enter</kbd> to save
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const EditNoteModal = memo(EditNoteModalComponent);
