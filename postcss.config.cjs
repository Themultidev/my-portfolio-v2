module.exports = {
  // Use the new PostCSS plugin package for Tailwind v4+
  plugins: [
    require('@tailwindcss/postcss'),
    require('autoprefixer'),
  ],
}
