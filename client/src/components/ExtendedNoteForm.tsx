import { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { Template, TemplateField, extractTags, getCurrentTag, isTemplateTag, TEMPLATES, stripAllTags } from '@/lib/templates';
interface ExtendedNoteFormProps {
  template: Template;
  onSave: (fields: Record<string, string>, tags: string[]) => void;
  onCancel: (currentFields: Record<string, string>) => void;
  initialTags?: string[];
  initialFields?: Record<string, string>;
  allTags?: string[];
}

const ExtendedNoteFormComponent = ({
  template,
  onSave,
  onCancel,
  initialTags = [],
  initialFields = {},
  allTags = [],
}: ExtendedNoteFormProps) => {
  const [fields, setFields] = useState<Record<string, string>>(initialFields);
  const [showOptional, setShowOptional] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionIndex, setSuggestionIndex] = useState(-1);
  const [activeSuggestionField, setActiveSuggestionField] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | HTMLTextAreaElement>>({});

  const mandatoryFields = useMemo(() => template.fields.filter(f => f.mandatory), [template]);
  const optionalFields = useMemo(() => template.fields.filter(f => !f.mandatory), [template]);

  useEffect(() => {
    // Focus first field on mount
    if (inputRefs.current[mandatoryFields[0]?.name]) {
      inputRefs.current[mandatoryFields[0].name].focus();
    }
  }, [mandatoryFields]);

  const handleRef = useCallback((fieldName: string, el: HTMLInputElement | HTMLTextAreaElement | null) => {
    if (el) {
      inputRefs.current[fieldName] = el;

      // Preserve focus if this was the active field
      if (document.activeElement?.getAttribute('data-field-name') === fieldName) {
        el.focus();
      }
    }
  }, []);

  const handleFieldChange = useCallback((fieldName: string, value: string) => {
    // Prohibit template tags by stripping them on the fly
    const strippedValue = value.replace(/#[\w:]+/g, (match) => {
      return isTemplateTag(match) ? '' : match;
    });

    setFields(prev => ({ ...prev, [fieldName]: strippedValue }));

    // Update suggestions
    const currentTag = getCurrentTag(strippedValue);
    if (currentTag && currentTag.length >= 2) {
      const fieldTags = extractTags(strippedValue);
      const filteredSuggestions = allTags
        .filter(tag =>
          tag.startsWith(currentTag.toLowerCase()) &&
          !fieldTags.includes(tag) &&
          !isTemplateTag(tag)
        )
        .slice(0, 5);

      setSuggestions(filteredSuggestions);
      setSuggestionIndex(-1);
      setActiveSuggestionField(fieldName);
    } else {
      setSuggestions([]);
      setSuggestionIndex(-1);
      setActiveSuggestionField(null);
    }
  }, [allTags]);

  const insertSuggestion = useCallback((fieldName: string, suggestion: string) => {
    const currentValue = fields[fieldName] || '';
    const currentTag = getCurrentTag(currentValue);
    if (currentTag) {
      const newValue = currentValue.slice(0, -currentTag.length) + suggestion;
      setFields(prev => ({ ...prev, [fieldName]: newValue }));
      setSuggestions([]);
      setSuggestionIndex(-1);
      setActiveSuggestionField(null);
      inputRefs.current[fieldName]?.focus();
    }
  }, [fields]);

  const handleSave = useCallback(() => {
    // Check mandatory fields
    const missingMandatory = mandatoryFields.filter(f => !fields[f.name]?.trim());
    if (missingMandatory.length > 0) {
      alert(`Please fill in: ${missingMandatory.map(f => f.label).join(', ')}`);
      return;
    }

    // Extract tags from ALL fields BEFORE stripping
    const allText = Object.values(fields).join(' ');
    const extracted = extractTags(allText);

    // Create a NEW fields object with ALL tags stripped from the text
    const cleanedFields: Record<string, string> = {};
    Object.keys(fields).forEach(key => {
      cleanedFields[key] = stripAllTags(fields[key]);
    });

    // Merge with initial tags and ENSURE no template tags are present
    const combinedTags = Array.from(new Set([...initialTags, ...extracted]))
      .filter(tag => !isTemplateTag(tag));

    onSave(cleanedFields, combinedTags);
  }, [mandatoryFields, fields, onSave, initialTags]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, fieldName: string) => {
    // Handle suggestions
    if (activeSuggestionField === fieldName && suggestions.length > 0) {
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
      if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        const indexToUse = suggestionIndex >= 0 ? suggestionIndex : 0;
        insertSuggestion(fieldName, suggestions[indexToUse]);
        return;
      }
    }

    const allVisibleFields = showOptional ? template.fields : mandatoryFields;
    const currentIndex = allVisibleFields.findIndex(f => f.name === fieldName);

    if (e.key === 'Tab') {
      e.preventDefault();

      if (e.shiftKey) {
        // Shift+Tab - previous field
        if (currentIndex > 0) {
          const prevField = allVisibleFields[currentIndex - 1];
          inputRefs.current[prevField.name]?.focus();
        }
      } else {
        // Tab - next field or show optional fields
        if (!showOptional && currentIndex === mandatoryFields.length - 1 && optionalFields.length > 0) {
          // Show optional fields
          setShowOptional(true);
          setTimeout(() => {
            inputRefs.current[optionalFields[0].name]?.focus();
          }, 0);
        } else if (currentIndex < allVisibleFields.length - 1) {
          const nextField = allVisibleFields[currentIndex + 1];
          inputRefs.current[nextField.name]?.focus();
        }
      }
    } else if (e.ctrlKey && e.key === 'Enter') {
      // Ctrl+Enter - save
      handleSave();
    } else if (e.key === 'Escape') {
      // Esc - cancel
      if (suggestions.length > 0) {
        setSuggestions([]);
        setSuggestionIndex(-1);
        setActiveSuggestionField(null);
      } else {
        onCancel(fields);
      }
    }
  }, [showOptional, template.fields, mandatoryFields, optionalFields, handleSave, onCancel, fields, activeSuggestionField, suggestions, suggestionIndex, insertSuggestion]);

  const visibleFields = showOptional ? template.fields : mandatoryFields;

  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-4 soft-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">{template.name}</h3>
        <button
          onClick={() => onCancel(fields)}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Cancel (Esc)"
        >
          <X size={20} />
        </button>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {visibleFields.map((field) => (
          <div key={field.name} className="space-y-1 relative">
            <label className="text-sm font-medium text-foreground">
              {field.label}
            </label>
            {field.name === 'usecase' || field.name === 'note' ? (
              <textarea
                ref={el => handleRef(field.name, el)}
                data-field-name={field.name}
                value={fields[field.name] || ''}
                onChange={e => handleFieldChange(field.name, e.target.value)}
                onKeyDown={e => handleKeyDown(e, field.name)}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent resize-none h-20"
              />
            ) : (
              <input
                ref={el => handleRef(field.name, el)}
                data-field-name={field.name}
                type="text"
                value={fields[field.name] || ''}
                onChange={e => handleFieldChange(field.name, e.target.value)}
                onKeyDown={e => handleKeyDown(e, field.name)}
                placeholder={field.placeholder}
                className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
              />
            )}

            {/* Tag Suggestions Dropdown */}
            {activeSuggestionField === field.name && suggestions.length > 0 && (
              <div className="absolute top-[calc(100%+4px)] left-0 right-0 bg-card border border-border rounded-md shadow-lg z-20 overflow-hidden">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    onClick={() => insertSuggestion(field.name, suggestion)}
                    onMouseEnter={() => setSuggestionIndex(index)}
                    className={`w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between ${index === suggestionIndex
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-card text-foreground hover:bg-secondary'
                      }`}
                  >
                    <span className="font-medium">{suggestion}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Show Optional Fields Button */}
      {!showOptional && optionalFields.length > 0 && (
        <button
          onClick={() => setShowOptional(true)}
          className="text-sm text-accent hover:text-accent/80 flex items-center gap-1 transition-colors"
        >
          <ChevronDown size={16} />
          Add optional fields ({optionalFields.length})
        </button>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 border-t border-border">
        <button
          onClick={handleSave}
          className="flex-1 px-4 py-2 bg-accent text-accent-foreground rounded-md hover:bg-accent/90 transition-colors font-medium"
          title="Save (Ctrl+Enter)"
        >
          Save (Ctrl+Enter)
        </button>
        <button
          onClick={() => onCancel(fields)}
          className="flex-1 px-4 py-2 bg-secondary text-foreground rounded-md hover:bg-secondary/80 transition-colors"
          title="Cancel (Esc)"
        >
          Cancel
        </button>
      </div>

      {/* Keyboard Hints */}
      <div className="text-xs text-muted-foreground space-y-1 pt-2">
        <p>💡 <kbd className="bg-card border border-border px-1 rounded text-xs">Tab</kbd> to next field • <kbd className="bg-card border border-border px-1 rounded text-xs">Shift+Tab</kbd> for previous</p>
        <p>💡 <kbd className="bg-card border border-border px-1 rounded text-xs">Ctrl+Enter</kbd> to save • <kbd className="bg-card border border-border px-1 rounded text-xs">Esc</kbd> to cancel</p>
      </div>
    </div>
  );
};

export const ExtendedNoteForm = memo(ExtendedNoteFormComponent);
