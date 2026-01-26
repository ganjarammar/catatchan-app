import { useEffect, useRef, useState } from 'react';
import { Trash2, X } from 'lucide-react';

/**
 * Design Philosophy: Warm Minimalism with Personality
 * - Soft cream background with warm charcoal text
 * - Paper-like aesthetic with gentle shadows
 * - Keyboard-first interactions with smooth animations
 * - Minimal UI, maximum focus on content
 * 
 * Tagging System with Suggestions:
 * - Extract tags from note text (e.g., #work, #ideas)
 * - Filter notes by selected tags
 * - Display tags with warm amber color
 * - Suggest recently used tags as user types
 * - Keyboard-friendly tag selection and suggestions
 */

interface Note {
  id: string;
  text: string;
  timestamp: Date;
  tags: string[];
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Filter notes based on selected tags
  const getFilteredNotes = (): Note[] => {
    if (selectedTags.size === 0) {
      return notes;
    }
    const tagsArray = Array.from(selectedTags);
    return notes.filter(note =>
      tagsArray.some(tag => note.tags.includes(tag))
    );
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
      // Cmd/Ctrl + K to focus input (alternative hotkey)
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAddNote = () => {
    if (inputValue.trim()) {
      const tags = extractTags(inputValue);
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
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

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border py-6 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-display text-3xl sm:text-4xl text-foreground">
            Catatchan
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Keyboard-first note app. Press <kbd className="bg-card text-foreground px-2 py-1 rounded text-xs border border-border">Ctrl+K</kbd> to focus.
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Input Section */}
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
                  onKeyDown={handleKeyDown}
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

          {/* Tag Filter Section */}
          {allTags.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-label text-sm text-foreground">
                  Filter by tags
                </h3>
                {selectedTags.size > 0 && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Clear filters
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => {
                  const isSelected = selectedTags.has(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1 rounded-full text-sm font-label transition-all ${
                        isSelected
                          ? 'bg-accent text-accent-foreground'
                          : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
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
            <h2 className="font-label text-lg text-foreground mb-4">
              {filteredNotes.length === 0
                ? selectedTags.size > 0
                  ? 'No notes with selected tags'
                  : 'No notes yet'
                : `${filteredNotes.length} note${filteredNotes.length !== 1 ? 's' : ''}`}
            </h2>
            <div className="space-y-3">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  className="soft-shadow rounded-lg bg-card p-4 hover:soft-shadow-hover transition-all group"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground break-words">{note.text}</p>
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
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="flex-shrink-0 p-2 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                      title="Delete note"
                    >
                      <Trash2 size={16} />
                    </button>
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
    </div>
  );
}
