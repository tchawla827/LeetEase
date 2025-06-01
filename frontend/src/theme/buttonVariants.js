// src/theme/buttonVariants.js

// Base classes that every button variant will share:
const buttonBase = 'font-mono font-medium rounded-code transition-all duration-150 focus:outline-none focus:ring-2';

export const buttonVariants = {
  primary:   `${buttonBase} bg-primary hover:bg-[#2a7aeb] text-white focus:ring-primary/50`,
  secondary: `${buttonBase} bg-secondary hover:bg-[#2c974b] text-white focus:ring-secondary/50`,
  outline:   `${buttonBase} border border-gray-600 hover:border-gray-500 bg-transparent hover:bg-gray-700 text-gray-200 focus:ring-gray-500/30`,
  danger:    `${buttonBase} bg-error hover:bg-[#da3633] text-white focus:ring-error/50`,
  ghost:     `${buttonBase} hover:bg-gray-800 text-gray-400 hover:text-gray-200`,
  code:      `${buttonBase} bg-gray-900 hover:bg-gray-800 text-gray-300 font-normal text-code-sm border border-gray-700`,
};
