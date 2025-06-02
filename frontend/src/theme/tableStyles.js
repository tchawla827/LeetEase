// src/theme/tableStyles.js

export const tableStyles = {
  container:  'w-full border-collapse',
  header:     'bg-gray-900 border-b border-gray-800',

  // ↑ bumped size to code-base, made text brighter and bolder
  headerCell:
    'px-4 py-3 text-left text-code-base font-semibold text-gray-300 uppercase tracking-wider',

  row:        'border-b border-gray-800 hover:bg-gray-900/50 transition-colors',

  // ↑ bumped size to code-lg for more readable rows
  cell:       'px-4 py-3 text-code-lg',

  cellMonospace: 'font-mono',
  cellCenter:    'text-center',
  cellHighlight: 'text-primary font-medium',
};
