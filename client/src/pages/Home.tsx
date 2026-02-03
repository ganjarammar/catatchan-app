import { useEffect, useRef, useState } from 'react';
import { Trash2, Search, X, ArrowUp, ArrowDown, Moon, Sun, HelpCircle, Pin, Sparkles, Cat } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { ExtendedNoteForm } from '@/components/ExtendedNoteForm';
import { detectTemplateTag, TEMPLATES, TemplateType } from '@/lib/templates';

/**
 * Design Philosophy: Warm Minimalism with Personality
 * - Soft cream background with warm charcoal text
 * - Paper-like aesthetic with gentle shadows
 * - Keyboard-first interactions with smooth animations
 * - Minimal UI, maximum focus on content
 * 
 * Complete Feature Set:
 * - Quick mode for instant note capture
 * - Extended mode for structured notes (#lang, #dev, #read)
 * - Extract tags from note text (e.g., #work, #ideas)
 * - Filter notes by selected tags
 * - Display tags with warm amber color
 * - Suggest recently used tags as user types
 * - Search notes by content or tags
 * - Sort notes by creation date (newest/oldest first)
 * - Dark mode toggle for comfortable viewing
 * - Keyboard-friendly interactions throughout
 */

interface Note {
  id: string;
  text: string;
  timestamp: Date;
  tags: string[];
  isPinned?: boolean;
  template?: TemplateType;
  fields?: Record<string, string>;
}

type SortOrder = 'newest' | 'oldest';
type InputMode = 'quick' | 'extended';

export default function Home() {
  const { theme, toggleTheme, toggleKawaii, isKawaii } = useTheme();
  const [notes, setNotes] = useState<Note[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [showHelp, setShowHelp] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>('quick');
  const [extendedTemplate, setExtendedTemplate] = useState<TemplateType | null>(null);
  const [extendedTags, setExtendedTags] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // Extract tags from text (e.g., #work, #ideas)
  const extractTags = (text: string): string[] => {
    const tagRegex = /#[\w]+/g;
    const matches = text.match(tagRegex) || [];
    return Array.from(new Set(matches.map(tag => tag.toLowerCase())));
  };

  // Get the current tag being typed (the last #tag in the input)
  const getCurrentTag = (text: string): string => {
    const tagRegex = /#[\w]*$/;
    const match = text.match(tagRegex);
    return match ? match[0] : '';
  };

  // Get all unique tags from notes, sorted by recency
  const getAllTags = (): string[] => {
    const allTags = new Set<string>();
    notes.forEach(note => {
      note.tags.forEach(tag => allTags.add(tag));
    });
    return Array.from(allTags).sort();
  };

  // Get tag suggestions based on current input
  const getTagSuggestions = (input: string): string[] => {
    const currentTag = getCurrentTag(input);
    if (!currentTag || currentTag.length < 2) {
      return [];
    }

    const allTags = getAllTags();
    const alreadyUsedTags = extractTags(input);
    
    return allTags
      .filter(tag => 
        tag.startsWith(currentTag.toLowerCase()) && 
        !alreadyUsedTags.includes(tag)
      )
      .slice(0, 5); // Limit to 5 suggestions
  };

  // Search notes by content or tags
  const searchNotes = (query: string, notesToSearch: Note[]): Note[] => {
    if (!query.trim()) {
      return notesToSearch;
    }

    const lowerQuery = query.toLowerCase();
    return notesToSearch.filter(note => {
      // Search in note text
      if (note.text.toLowerCase().includes(lowerQuery)) {
        return true;
      }
      // Search in extended fields
      if (note.fields) {
        if (Object.values(note.fields).some(value => 
          value.toLowerCase().includes(lowerQuery)
        )) {
          return true;
        }
      }
      // Search in tags
      if (note.tags.some(tag => tag.includes(lowerQuery))) {
        return true;
      }
      return false;
    });
  };

  // Sort notes by creation date
  const sortNotes = (notesToSort: Note[], order: SortOrder): Note[] => {
    const sorted = [...notesToSort];
    if (order === 'newest') {
      sorted.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } else {
      sorted.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
    }
    return sorted;
  };

  // Filter notes based on selected tags
  const getFilteredNotes = (): Note[] => {
    let filtered = notes;

    // Apply tag filter
    if (selectedTags.size > 0) {
      const tagsArray = Array.from(selectedTags);
      filtered = filtered.filter(note =>
        tagsArray.some(tag => note.tags.includes(tag))
      );
    }

    // Apply search filter
    filtered = searchNotes(searchQuery, filtered);

    // Apply sorting
    filtered = sortNotes(filtered, sortOrder);

    // Separate pinned and unpinned notes
    const pinned = filtered.filter(note => note.isPinned);
    const unpinned = filtered.filter(note => !note.isPinned);

    // Return pinned notes first, then unpinned
    return [...pinned, ...unpinned];
  };

  // Load notes from localStorage on mount
  useEffect(() => {
    const savedNotes = localStorage.getItem('catatchan_notes');
    if (savedNotes) {
      try {
        const parsed = JSON.parse(savedNotes);
        setNotes(parsed.map((note: any) => ({
          ...note,
          timestamp: new Date(note.timestamp),
          tags: note.tags || [],
        })));
      } catch (e) {
        console.error('Failed to load notes:', e);
      }
    }
    // Focus input on mount
    inputRef.current?.focus();
  }, []);

  // Save notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('catatchan_notes', JSON.stringify(notes));
  }, [notes]);

  // Update suggestions when input changes
  useEffect(() => {
    const newSuggestions = getTagSuggestions(inputValue);
    setSuggestions(newSuggestions);
    setSuggestionIndex(-1);
  }, [inputValue, notes]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus note input
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
      // Cmd/Ctrl + F to focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      // Alt + T to toggle theme
      if (e.altKey && e.key === 't') {
        e.preventDefault();
        if (toggleTheme) {
          toggleTheme();
        }
      }
      // ? to open help modal
      if (e.key === '?' && !e.ctrlKey && !e.metaKey && !e.altKey && !e.shiftKey) {
        e.preventDefault();
        setShowHelp(true);
      }
      // Escape to close help modal
      if (e.key === 'Escape' && showHelp) {
        setShowHelp(false);
      }
      // Ctrl+P to toggle pin on most recent note
      if ((e.metaKey || e.ctrlKey) && e.key === 'p') {
        e.preventDefault();
        if (notes.length > 0) {
          togglePin(notes[0].id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTheme, showHelp, notes]);

  const handleAddNote = () => {
    if (inputValue.trim()) {
      const tags = extractTags(inputValue);
      const templateType = detectTemplateTag(inputValue);
      if (templateType) {
        setInputMode('extended');
        setExtendedTemplate(templateType);
        setExtendedTags(tags);
      } else {
        const newNote: Note = {
          id: Date.now().toString(),
          text: inputValue.trim(),
          timestamp: new Date(),
          tags,
        };
        setNotes([newNote, ...notes]);
        setInputValue('');
        setSuggestions([]);
        setSuggestionIndex(-1);
        inputRef.current?.focus();
      }
    }
  };

  const handleExtendedNoteSave = (fields: Record<string, string>, tags: string[]) => {
    if (!extendedTemplate) return;
    const newNote: Note = {
      id: Date.now().toString(),
      text: '',
      timestamp: new Date(),
      tags,
      template: extendedTemplate,
      fields,
    };
    setNotes([newNote, ...notes]);
    setInputMode('quick');
    setExtendedTemplate(null);
    setExtendedTags([]);
    setInputValue('');
    setSuggestions([]);
    setSuggestionIndex(-1);
    inputRef.current?.focus();
  };

  const handleExtendedNoteCancel = () => {
    setInputMode('quick');
    setExtendedTemplate(null);
    setExtendedTags([]);
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleDeleteNote = (id: string) => {
    setNotes(notes.filter(note => note.id !== id));
  };

  const insertSuggestion = (suggestion: string) => {
    const currentTag = getCurrentTag(inputValue);
    if (currentTag) {
      const newValue = inputValue.slice(0, -currentTag.length) + suggestion;
      setInputValue(newValue);
      setSuggestions([]);
      setSuggestionIndex(-1);
      inputRef.current?.focus();
    }
  };

  const handleNoteInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle suggestion navigation with arrow keys
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        return;
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && suggestionIndex >= 0)) {
        e.preventDefault();
        insertSuggestion(suggestions[suggestionIndex]);
        return;
      }
    }

    // Handle Enter to save note
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleAddNote();
    }
  };

  const toggleTag = (tag: string) => {
    const newTags = new Set(selectedTags);
    if (newTags.has(tag)) {
      newTags.delete(tag);
    } else {
      newTags.add(tag);
    }
    setSelectedTags(newTags);
  };

  const clearFilters = () => {
    setSelectedTags(new Set());
  };

  const clearSearch = () => {
    setSearchQuery('');
    searchRef.current?.focus();
  };

  const toggleSortOrder = () => {
    setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest');
  };

  const togglePin = (id: string) => {
    setNotes(notes.map(note =>
      note.id === id ? { ...note, isPinned: !note.isPinned } : note
    ));
  };

  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const allTags = getAllTags();
  const filteredNotes = getFilteredNotes();
  const hasActiveFilters = selectedTags.size > 0 || searchQuery.trim().length > 0;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border py-6 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="font-display text-3xl sm:text-4xl text-foreground flex items-center gap-3">
                Catatchan
                <Cat size={32} className="text-accent transform -rotate-12" />
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Keyboard-first note app. Press <kbd className="bg-card text-foreground px-2 py-1 rounded text-xs border border-border">Ctrl+K</kbd> to add, <kbd className="bg-card text-foreground px-2 py-1 rounded text-xs border border-border">Ctrl+F</kbd> to search.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowHelp(true)}
                className="flex-shrink-0 p-2 text-muted-foreground hover:text-foreground bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
                title="Help (?)">
                <HelpCircle size={20} />
              </button>
              <button
                onClick={toggleKawaii}
                className="flex-shrink-0 p-2 text-muted-foreground hover:text-foreground bg-secondary hover:bg-secondary/80 rounded-md transition-colors"
                title="Toggle kawaii mode"
              >
                <Sparkles size={20} />
              </button>
              <button
                onClick={toggleTheme}
                className="flex-shrink-0 p-2 text-muted-foreground hover:text-foreground bg-secondary hover:bg-secondary/80 rounded-md transition-colors disabled:opacity-50"
                title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode (Alt+T)`}
                disabled={isKawaii}
              >
                {theme === 'light' ? (
                  <Moon size={20} />
                ) : (
                  <Sun size={20} />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Input Section */}
          {inputMode === 'quick' && (
            <div className="mb-8">
              <div className="soft-shadow rounded-lg bg-card p-6 relative">
                <label htmlFor="note-input" className="block text-sm font-label text-muted-foreground mb-3">
                  Quick Note
                </label>
                <div className="relative">
                  <input
                    ref={inputRef}
                    id="note-input"
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleNoteInputKeyDown}
                    placeholder="Type your thought and press Enter... (use #tag for categories)"
                    className="w-full bg-background text-foreground placeholder-muted-foreground border border-border rounded-md px-4 py-3 focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-card transition-all"
                  />

                  {/* Tag Suggestions Dropdown */}
                  {suggestions.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-md shadow-lg z-10 overflow-hidden">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={suggestion}
                          onClick={() => insertSuggestion(suggestion)}
                          onMouseEnter={() => setSuggestionIndex(index)}
                          className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                            index === suggestionIndex
                              ? 'bg-accent text-accent-foreground'
                              : 'bg-card text-foreground hover:bg-secondary'
                          }`}
                        >
                          {suggestion}
                        </button>
                      ))}
                      <div className="px-4 py-2 text-xs text-muted-foreground border-t border-border">
                        Press <kbd className="bg-background text-foreground px-1 rounded">↓</kbd> <kbd className="bg-background text-foreground px-1 rounded">↑</kbd> to navigate, <kbd className="bg-background text-foreground px-1 rounded">Tab</kbd> to select
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-muted-foreground">
                    {inputValue.length} characters
                    {extractTags(inputValue).length > 0 && (
                      <span className="ml-2">
                        • {extractTags(inputValue).length} tag{extractTags(inputValue).length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </p>
                  <button
                    onClick={handleAddNote}
                    disabled={!inputValue.trim()}
                    className="px-4 py-2 bg-accent text-accent-foreground rounded-md font-label text-sm hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Save (Enter)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Extended Mode Form */}
          {inputMode === 'extended' && extendedTemplate && (
            <div className="mb-8">
              <ExtendedNoteForm
                template={TEMPLATES[extendedTemplate]}
                onSave={handleExtendedNoteSave}
                onCancel={handleExtendedNoteCancel}
                initialTags={extendedTags}
              />
            </div>
          )}

          {/* Search Section */}
          {notes.length > 0 && inputMode === 'quick' && (
            <div className="mb-6">
              <div className="soft-shadow rounded-lg bg-card p-4 relative">
                <div className="flex items-center gap-2">
                  <Search size={18} className="text-muted-foreground flex-shrink-0" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search notes by content or tags..."
                    className="flex-1 bg-background text-foreground placeholder-muted-foreground border-0 focus:outline-none focus:ring-0 text-sm"
                  />
                  {searchQuery && (
                    <button
                      onClick={clearSearch}
                      className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                      title="Clear search"
                    >
                      <X size={18} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tags Filter */}
          {allTags.length > 0 && inputMode === 'quick' && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => {
                  const isSelected = selectedTags.has(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-xs font-label transition-all ${
                        isSelected
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-accent/20 text-accent hover:bg-accent/30'
                      }`}
                    >
                      {tag}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes List */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-label text-lg text-foreground">
                {filteredNotes.length === 0
                  ? hasActiveFilters
                    ? 'No matching notes'
                    : 'No notes yet'
                  : `${filteredNotes.length} note${filteredNotes.length !== 1 ? 's' : ''}`}
              </h2>
              <div className="flex items-center gap-2">
                {notes.length > 0 && inputMode === 'quick' && (
                  <button
                    onClick={toggleSortOrder}
                    className="flex items-center gap-1 px-3 py-1 text-xs font-label text-muted-foreground hover:text-foreground bg-secondary hover:bg-secondary/80 rounded-md transition-all"
                    title={`Sort: ${sortOrder === 'newest' ? 'Newest first' : 'Oldest first'}`}
                  >
                    {sortOrder === 'newest' ? (
                      <>
                        <ArrowDown size={14} />
                        Newest
                      </>
                    ) : (
                      <>
                        <ArrowUp size={14} />
                        Oldest
                      </>
                    )}
                  </button>
                )}
                {hasActiveFilters && inputMode === 'quick' && (
                  <button
                    onClick={() => {
                      clearFilters();
                      clearSearch();
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Reset filters
                  </button>
                )}
              </div>
            </div>
            <div className="space-y-3">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="soft-shadow rounded-lg bg-card p-4 hover:soft-shadow-hover transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {note.template && note.fields ? (
                        <div className="space-y-2">
                          <p className="text-xs font-label text-muted-foreground">{TEMPLATES[note.template].name}</p>
                          <div className="space-y-1">
                            {Object.entries(note.fields).map(([key, value]) => (
                              <div key={key}>
                                <p className="text-xs text-muted-foreground capitalize">{key}:</p>
                                <p className="text-foreground break-words">{value}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <p className="text-foreground break-words">{note.text}</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-3">
                        {note.tags.length > 0 && (
                          <>
                            {note.tags.map(tag => {
                              const isSelected = selectedTags.has(tag);
                              return (
                                <button
                                  key={tag}
                                  onClick={() => toggleTag(tag)}
                                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-label transition-all ${
                                    isSelected
                                      ? 'bg-accent text-accent-foreground'
                                      : 'bg-accent/20 text-accent hover:bg-accent/30'
                                  }`}
                                >
                                  {tag}
                                </button>
                              );
                            })}
                          </>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatTime(note.timestamp)}
                      </p>
                    </div>
                    <div className="flex-shrink-0 flex gap-1">
                      <button
                        onClick={() => togglePin(note.id)}
                        className={`p-2 transition-all ${
                          note.isPinned
                            ? 'text-accent'
                            : 'text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100'
                        }`}
                        title={note.isPinned ? 'Unpin note' : 'Pin note'}
                      >
                        <Pin size={16} fill={note.isPinned ? 'currentColor' : 'none'} />
                      </button>
                      <button
                        onClick={() => handleDeleteNote(note.id)}
                        className="p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete note"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-4 px-4 sm:px-6 text-center text-xs text-muted-foreground">
        <p>All notes are saved locally in your browser • Use #tags to categorize notes</p>
      </footer>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card text-foreground rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle size={20} className="text-accent" />
                <h2 className="font-display text-lg">Keyboard Shortcuts</h2>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                title="Close (Esc)"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-4 space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <kbd className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs font-mono border border-border">Ctrl+K</kbd>
                    <span className="text-sm">Focus note input</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-0">Quickly jump to the note input field</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <kbd className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs font-mono border border-border">Ctrl+F</kbd>
                    <span className="text-sm">Focus search</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-0">Search notes by content or tags</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <kbd className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs font-mono border border-border">Alt+T</kbd>
                    <span className="text-sm">Toggle theme</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-0">Switch between light and dark modes</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <kbd className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs font-mono border border-border">?</kbd>
                    <span className="text-sm">Show help</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-0">Display this keyboard shortcuts guide</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <kbd className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs font-mono border border-border">Ctrl+P</kbd>
                    <span className="text-sm">Pin recent note</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-0">Pin or unpin the most recent note</p>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <kbd className="bg-secondary text-secondary-foreground px-2 py-1 rounded text-xs font-mono border border-border">Esc</kbd>
                    <span className="text-sm">Close modal</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-0">Close this help modal</p>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="font-label text-sm mb-2">Extended Mode Templates</h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li><span className="text-accent">#lang</span> - Language Learning (Original, Translation, Romaji, Pronunciation, Use case)</li>
                  <li><span className="text-accent">#dev</span> - Tech Development (Product, Problem, Solution, Note)</li>
                  <li><span className="text-accent">#read</span> - Reading & Highlights (Excerpt, Source, Page/URL, Category)</li>
                </ul>
              </div>

              <div className="border-t border-border pt-4">
                <h3 className="font-label text-sm mb-2">Tagging Tips</h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>Type #tag to add tags to notes</li>
                  <li>Tags appear as suggestions while you type</li>
                  <li>Click tags to filter notes by category</li>
                  <li>Search works on both note text and tags</li>
                  <li>Use template tags (#lang, #dev, #read) for structured notes</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
