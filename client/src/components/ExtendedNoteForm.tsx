import { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
import { X, ChevronDown } from 'lucide-react';
import { Template, TemplateField } from '@/lib/templates';

interface ExtendedNoteFormProps {
  template: Template;
  onSave: (fields: Record<string, string>, tags: string[]) => void;
  onCancel: () => void;
  initialTags?: string[];
}

const ExtendedNoteFormComponent = ({
  template,
  onSave,
  onCancel,
  initialTags = [],
}: ExtendedNoteFormProps) => {
  const [fields, setFields] = useState<Record<string, string>>({});
  const [showOptional, setShowOptional] = useState(false);
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
    setFields(prev => ({ ...prev, [fieldName]: value }));
  }, []);

  const handleSave = useCallback(() => {
    // Check mandatory fields
    const missingMandatory = mandatoryFields.filter(f => !fields[f.name]?.trim());
    if (missingMandatory.length > 0) {
      alert(`Please fill in: ${missingMandatory.map(f => f.label).join(', ')}`);
      return;
    }

    onSave(fields, initialTags);
  }, [mandatoryFields, fields, onSave, initialTags]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent, fieldName: string) => {
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
      onCancel();
    }
  }, [showOptional, template.fields, mandatoryFields, optionalFields, handleSave, onCancel]);

  const visibleFields = showOptional ? template.fields : mandatoryFields;

  return (
    <div className="bg-card rounded-lg border border-border p-6 space-y-4 soft-shadow">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">{template.name}</h3>
        <button
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground transition-colors"
          title="Cancel (Esc)"
        >
          <X size={20} />
        </button>
      </div>

      {/* Form Fields */}
      <div className="space-y-4">
        {visibleFields.map((field) => (
          <div key={field.name} className="space-y-1">
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
          onClick={onCancel}
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
