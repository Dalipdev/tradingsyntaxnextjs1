// tailwind.config.js  (project root)
// Preserves tw-colors theme plugin + all existing color tokens.
// Fonts updated: Syne (display authority) + DM Mono (data/terminal precision).
// Old inter/gelasio aliases kept so existing components don't break.

const { createThemes } = require('tw-colors');

/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        fontSize: {
            'sm':   '12px',
            'base': '14px',
            'xl':   '16px',
            '2xl':  '20px',
            '3xl':  '28px',
            '4xl':  '38px',
            '5xl':  '50px',
        },
        extend: {
            fontFamily: {
                // ── Primary stack (new) ───────────────────────────────────────
                syne:      ['var(--font-syne)',    'system-ui', 'sans-serif'],
                'dm-mono': ['var(--font-dm-mono)', 'JetBrains Mono', 'monospace'],
                // ── Semantic aliases ──────────────────────────────────────────
                display:   ['var(--font-syne)',    'system-ui', 'sans-serif'],
                ui:        ['var(--font-syne)',    'system-ui', 'sans-serif'],
                mono:      ['var(--font-dm-mono)', 'monospace'],
                // ── Backward compat (existing components won't break) ─────────
                inter:     ['var(--font-syne)',    'system-ui', 'sans-serif'],
                gelasio:   ['var(--font-syne)',    'Georgia',   'serif'],
                body:      ['var(--font-syne)',    'Georgia',   'serif'],
            },
            borderRadius: {
                'sm': '3px',
                DEFAULT: '5px',
                'md': '5px',
                'lg': '8px',
            },
        },
    },
    plugins: [
        createThemes({
            light: {
                // ── original tokens (untouched) ───────────────────────────────
                'white':       '#FFFFFF',
                'black':       '#242424',
                'grey':        '#F3F3F3',
                'dark-grey':   '#6B6B6B',
                'red':         '#FF4E4E',
                'transparent': 'transparent',
                'twitter':     '#1DA1F2',
                'purple':      '#8B46FF',
                // ── TradingSyntax accent system ───────────────────────────────
                'accent':      '#C59B2E',
                'accent-dim':  '#FAF6E8',
                'up':          '#26a69a',
                'down':        '#ef5350',
                // ── editorial palette (kept from previous) ────────────────────
                'gold':        '#C59B2E',
                'gold-light':  '#E9D8A6',
                'paper':       '#faf8f5',
                'paper-dark':  '#f0ede8',
                'ink':         '#1a1714',
            },
            dark: {
                // ── original tokens (untouched) ───────────────────────────────
                'white':       '#242424',
                'black':       '#F3F3F3',
                'grey':        '#2A2A2A',
                'dark-grey':   '#E7E7E7',
                'red':         '#991F1F',
                'transparent': 'transparent',
                'twitter':     '#0E71AB',
                'purple':      '#582C8E',
                // ── TradingSyntax accent system ───────────────────────────────
                'accent':      '#D4AF43',
                'accent-dim':  '#2b2418',
                'up':          '#26a69a',
                'down':        '#ef5350',
                // ── editorial palette (kept from previous) ────────────────────
                'gold':        '#D4AF43',
                'gold-light':  '#E9D8A6',
                'paper':       '#141210',
                'paper-dark':  '#1e1b18',
                'ink':         '#f0ede8',
            },
        }),
        function ({ addBase }) {
            addBase({
                '*': {
                    'outline': 'none',
                    '-webkit-tap-highlight-color': 'transparent',
                },
                'button:focus': { 'outline': 'none' },
                'input:focus':  { 'outline': 'none' },
            });
        },
    ],
};