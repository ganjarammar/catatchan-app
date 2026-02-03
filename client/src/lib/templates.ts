/**
 * Extended Mode Templates
 * Define fields for each template type
 */

export type TemplateType = 'lang' | 'dev' | 'read';

export interface TemplateField {
  name: string;
  label: string;
  placeholder: string;
  mandatory: boolean;
}

export interface Template {
  id: TemplateType;
  name: string;
  tag: string;
  description: string;
  fields: TemplateField[];
}

export const TEMPLATES: Record<TemplateType, Template> = {
  lang: {
    id: 'lang',
    name: 'Language Learning',
    tag: '#lang',
    description: 'Learn new words and phrases',
    fields: [
      {
        name: 'original',
        label: 'Original Sentence*',
        placeholder: 'Enter the original sentence...',
        mandatory: true,
      },
      {
        name: 'translation',
        label: 'Translation*',
        placeholder: 'Enter the translation...',
        mandatory: true,
      },
      {
        name: 'romaji',
        label: 'Romaji',
        placeholder: 'Enter romanization (if applicable)...',
        mandatory: false,
      },
      {
        name: 'pronunciation',
        label: 'Pronunciation',
        placeholder: 'Enter pronunciation guide...',
        mandatory: false,
      },
      {
        name: 'usecase',
        label: 'Use Case',
        placeholder: 'Enter example usage or context...',
        mandatory: false,
      },
    ],
  },
  dev: {
    id: 'dev',
    name: 'Tech Development',
    tag: '#dev',
    description: 'Document technical solutions',
    fields: [
      {
        name: 'product',
        label: 'Product*',
        placeholder: 'Enter product or project name...',
        mandatory: true,
      },
      {
        name: 'problem',
        label: 'Problem*',
        placeholder: 'Describe the problem...',
        mandatory: true,
      },
      {
        name: 'solution',
        label: 'Solution*',
        placeholder: 'Describe the solution...',
        mandatory: true,
      },
      {
        name: 'note',
        label: 'Note',
        placeholder: 'Add any additional notes...',
        mandatory: false,
      },
    ],
  },
  read: {
    id: 'read',
    name: 'Reading & Highlights',
    tag: '#read',
    description: 'Save quotes and highlights',
    fields: [
      {
        name: 'excerpt',
        label: 'Quote/Excerpt*',
        placeholder: 'Enter the quote or excerpt...',
        mandatory: true,
      },
      {
        name: 'source',
        label: 'Source*',
        placeholder: 'Enter book, article, or URL...',
        mandatory: true,
      },
      {
        name: 'pageurl',
        label: 'Page/URL',
        placeholder: 'Enter page number or URL...',
        mandatory: false,
      },
      {
        name: 'category',
        label: 'Category',
        placeholder: 'Enter category or topic...',
        mandatory: false,
      },
    ],
  },
};

/**
 * Get template by tag
 */
export function getTemplateByTag(tag: string): Template | null {
  const normalizedTag = tag.toLowerCase();

  // Direct match (e.g., #lang)
  const directMatch = Object.values(TEMPLATES).find(t => t.tag.toLowerCase() === normalizedTag);
  if (directMatch) return directMatch;

  // Ext match (e.g., #ext:lang)
  if (normalizedTag.startsWith('#ext:')) {
    const templateId = normalizedTag.replace('#ext:', '') as TemplateType;
    return TEMPLATES[templateId] || null;
  }

  return null;
}

/**
 * Check if a tag is a template tag
 */
export function isTemplateTag(tag: string): boolean {
  return getTemplateByTag(tag) !== null || tag.toLowerCase().startsWith('#ext:');
}

/**
 * Detect template tags in text
 * Returns the template type and the raw tag string found
 */
export function detectTemplateTag(text: string): { type: TemplateType; raw: string } | null {
  const tags = text.match(/#[\w:]+/g) || [];
  for (const tag of tags) {
    const template = getTemplateByTag(tag);
    if (template) {
      return { type: template.id, raw: tag };
    }
  }
  return null;
}

/**
 * Extract all tags from text, excluding template tags
 */
export function extractTags(text: string, includeTemplates: boolean = false): string[] {
  const matches = text.match(/#[\w:]+/g) || [];
  const tags = matches.map(tag => tag.toLowerCase());

  const filtered = includeTemplates
    ? tags
    : tags.filter(tag => !isTemplateTag(tag));

  return Array.from(new Set(filtered)); // Remove duplicates
}

/**
 * Get the current tag being typed (the last #tag in the text)
 */
export function getCurrentTag(text: string): string {
  const tagRegex = /#[\w:]*$/;
  const match = text.match(tagRegex);
  return match ? match[0] : '';
}

/**
 * Strip template tags from text
 */
export function stripTemplateTags(text: string): string {
  return text.replace(/#[\w:]+/g, (match) => {
    return isTemplateTag(match) ? '' : match;
  }).replace(/\s+/g, ' ').trim();
}
