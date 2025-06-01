// src/theme/badgeVariants.js

const badgeBase = 'inline-flex items-center rounded-code font-mono text-code-sm font-medium';

export const badgeVariants = {
  default:   `${badgeBase} bg-gray-800 text-gray-300`,
  success:   `${badgeBase} bg-success/10 text-success`,
  warning:   `${badgeBase} bg-warning/10 text-warning`,
  error:     `${badgeBase} bg-error/10 text-error`,
  info:      `${badgeBase} bg-primary/10 text-primary`,

  // difficulty‐specific badges:
  difficulty: {
    easy:   `${badgeBase} bg-green-900/30 text-green-400`,
    medium: `${badgeBase} bg-yellow-900/30 text-yellow-400`,
    hard:   `${badgeBase} bg-red-900/30 text-red-400`,
  },
};
