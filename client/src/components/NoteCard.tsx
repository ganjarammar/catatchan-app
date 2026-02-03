import { memo, useMemo } from 'react';
import { Pin, Trash2, Clock, BookOpen, Code, Highlighter, Quote, Globe, MessageSquare, Tag as TagIcon, Edit2, Archive, History } from 'lucide-react';
import { TEMPLATES, TemplateType } from '@/lib/templates';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

export interface NoteVersion {
    timestamp: Date;
    text: string;
    fields?: Record<string, string>;
}

interface Note {
    id: string;
    text: string;
    timestamp: Date;
    tags: string[];
    isPinned?: boolean;
    isArchived?: boolean;
    template?: TemplateType;
    fields?: Record<string, string>;
    history?: NoteVersion[];
    lastEdited?: Date;
}

interface NoteCardProps {
    note: Note;
    onDelete: (id: string) => void;
    onTogglePin: (id: string) => void;
    onToggleTag: (tag: string) => void;
    onEdit: (note: Note) => void;
    onArchive: (id: string) => void;
    onViewHistory: (note: Note) => void;
    formatTime: (date: Date) => string;
    selectedTags: Set<string>;
}

const getTemplateIcon = (type: TemplateType) => {
    switch (type) {
        case 'lang': return <Globe size={14} style={{ color: 'var(--lang)' }} />;
        case 'dev': return <Code size={14} style={{ color: 'var(--dev)' }} />;
        case 'read': return <BookOpen size={14} style={{ color: 'var(--read)' }} />;
        default: return null;
    }
};

const NoteCardComponent = ({
    note,
    onDelete,
    onTogglePin,
    onToggleTag,
    onEdit,
    onArchive,
    onViewHistory,
    formatTime,
    selectedTags
}: NoteCardProps) => {
    const template = note.template ? TEMPLATES[note.template] : null;

    // Split tags into template tag and regular tags
    const { templateTags, regularTags } = useMemo(() => {
        const tTags: string[] = [];
        const rTags: string[] = [];
        note.tags.forEach(tag => {
            if (template && tag.toLowerCase() === template.tag.toLowerCase()) {
                tTags.push(tag);
            } else {
                rTags.push(tag);
            }
        });
        return { templateTags: tTags, regularTags: rTags };
    }, [note.tags, template]);

    return (
        <div className="relative soft-shadow rounded-xl bg-card border border-border/40 p-5 hover:soft-shadow-hover transition-all group overflow-hidden">
            {/* Decorative side accent for templates */}
            {template && (
                <div
                    className="absolute left-0 top-0 bottom-0 w-1"
                    style={{ backgroundColor: `var(--${template.id})` }}
                />
            )}

            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    {note.template && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-secondary/50 border border-border/50">
                            {getTemplateIcon(note.template)}
                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/80">
                                {template?.name}
                            </span>
                        </div>
                    )}
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center gap-1 text-[10px] text-muted-foreground/60 font-medium cursor-help">
                                {note.lastEdited ? (
                                    <div className="flex items-center gap-1 text-accent/80">
                                        <Edit2 size={10} />
                                        <span>Edited {formatTime(note.lastEdited)}</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-1">
                                        <Clock size={10} />
                                        <span>{formatTime(note.timestamp)}</span>
                                    </div>
                                )}
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" align="start" className="flex flex-col gap-1 py-2">
                            <div className="flex items-center gap-2">
                                <span className="text-muted-foreground">Created:</span>
                                <span>{formatTime(note.timestamp)}</span>
                            </div>
                            {note.lastEdited && (
                                <div className="flex items-center gap-2">
                                    <span className="text-accent/80 font-medium">Last Edited:</span>
                                    <span>{formatTime(note.lastEdited)}</span>
                                </div>
                            )}
                        </TooltipContent>
                    </Tooltip>
                </div>

                {/* Action Buttons (Visible on hover) */}
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                        onClick={() => onTogglePin(note.id)}
                        className={`p-1.5 rounded-md hover:bg-secondary transition-colors ${note.isPinned ? 'text-accent' : 'text-muted-foreground'}`}
                        title={note.isPinned ? 'Unpin' : 'Pin'}
                    >
                        <Pin size={14} fill={note.isPinned ? 'currentColor' : 'none'} />
                    </button>

                    <button
                        onClick={() => onEdit(note)}
                        className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        title="Edit"
                    >
                        <Edit2 size={14} />
                    </button>

                    {note.history && note.history.length > 0 && (
                        <button
                            onClick={() => onViewHistory(note)}
                            className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                            title="View History"
                        >
                            <History size={14} />
                        </button>
                    )}

                    <button
                        onClick={() => onArchive(note.id)}
                        className={`p-1.5 rounded-md hover:bg-secondary transition-colors ${note.isArchived ? 'text-accent' : 'text-muted-foreground hover:text-foreground'}`}
                        title={note.isArchived ? 'Unarchive' : 'Archive'}
                    >
                        <Archive size={14} />
                    </button>

                    <button
                        onClick={() => onDelete(note.id)}
                        className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        title="Delete"
                    >
                        <Trash2 size={14} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="space-y-3">
                {template && note.fields ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                        {Object.entries(note.fields).map(([key, value]) => {
                            if (!value.trim()) return null;

                            const isFullWidth = value.length > 60 || key === 'usecase' || key === 'note' || key === 'excerpt';

                            return (
                                <div key={key} className={`${isFullWidth ? 'sm:col-span-2' : ''} space-y-1`}>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50 flex items-center gap-1">
                                        {key}
                                    </p>
                                    <p className={`text-foreground break-words leading-relaxed ${key === 'original' || key === 'excerpt' || key === 'product' ? 'text-lg font-medium' :
                                        key === 'translation' ? 'text-base italic text-muted-foreground' : 'text-sm'
                                        }`}>
                                        {value}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <p className="text-foreground text-lg break-words leading-relaxed">{note.text}</p>
                )}
            </div>

            {/* Footer / Tags */}
            {(templateTags.length > 0 || regularTags.length > 0) && (
                <div className="mt-4 flex flex-wrap gap-2 pt-3 border-t border-border/30">
                    {/* Template Tag */}
                    {templateTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => onToggleTag(tag)}
                            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border"
                            style={{
                                backgroundColor: selectedTags.has(tag) ? `var(--${template?.id})` : 'transparent',
                                borderColor: `var(--${template?.id})`,
                                color: selectedTags.has(tag) ? 'white' : `var(--${template?.id})`
                            }}
                        >
                            <TagIcon size={10} />
                            {tag}
                        </button>
                    ))}

                    {/* Regular Tags */}
                    {regularTags.map(tag => (
                        <button
                            key={tag}
                            onClick={() => onToggleTag(tag)}
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium transition-all ${selectedTags.has(tag)
                                ? 'bg-secondary-foreground text-secondary'
                                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                                }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export const NoteCard = memo(NoteCardComponent);
export type { Note };
