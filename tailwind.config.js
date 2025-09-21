/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx,html}",
        "./public/index.html"
    ],
    theme: {
        extend: {
            fontFamily:{
                michroma: ['Michroma', 'sans-serif'],
                googleSansCode: ['Google Sans Code', 'monospace']
            }
        },
    },
    plugins: [],
}