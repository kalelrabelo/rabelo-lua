
// Add these improved glass morphism styles to App.jsx or create a separate theme file

const GLASS_MORPHISM_STYLES = {
  // Main containers
  glassContainer: "bg-gray-800/20 backdrop-blur-lg border border-gray-700/30 rounded-xl shadow-2xl",
  glassCard: "bg-gray-900/40 backdrop-blur-md border border-gray-600/20 rounded-lg shadow-xl",
  glassModal: "bg-gray-900/80 backdrop-blur-xl border border-gray-500/30 rounded-2xl shadow-3xl",

  // Navigation
  glassNavbar: "bg-gray-900/70 backdrop-blur-xl border-b border-gray-700/30",
  glassSidebar: "bg-gray-900/60 backdrop-blur-lg border-r border-gray-700/30",

  // Interactive elements
  glassButton: "bg-gray-700/30 hover:bg-gray-600/40 backdrop-blur-sm border border-gray-600/30 rounded-lg transition-all duration-300",
  glassInput: "bg-gray-800/30 backdrop-blur-sm border border-gray-600/40 rounded-md text-white placeholder:text-gray-400",

  // Status indicators
  glassSuccess: "bg-green-900/30 border-green-500/30 text-green-100",
  glassWarning: "bg-yellow-900/30 border-yellow-500/30 text-yellow-100",
  glassError: "bg-red-900/30 border-red-500/30 text-red-100",

  // Text colors
  textPrimary: "text-gray-100",
  textSecondary: "text-gray-300", 
  textMuted: "text-gray-400"
};

// Background gradient for the entire app
const APP_BACKGROUND = "bg-gradient-to-br from-gray-900 via-gray-800 to-black min-h-screen";

// CSS animations for glass effects
const GLASS_ANIMATIONS = {
  float: "animate-pulse",
  glow: "shadow-lg shadow-blue-500/10",
  shimmer: "bg-gradient-to-r from-transparent via-white/5 to-transparent"
};
