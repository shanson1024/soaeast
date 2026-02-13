/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: ["class"],
    content: ["./src/**/*.{js,jsx,ts,tsx}"],
    theme: {
    	extend: {
    		colors: {
    			'crm-bg': '#f6f5f1',
    			'crm-card': '#ffffff',
    			'crm-text-primary': '#1a1a1a',
    			'crm-text-secondary': '#7a7a7a',
    			'crm-text-muted': '#b0b0b0',
    			'crm-green': '#2d6a4f',
    			'crm-green-light': '#d8f3dc',
    			'crm-border': '#e8e7e3',
    			'crm-hover': '#f0efeb',
    			'crm-danger': '#d64545',
    			'crm-warning': '#e6a817',
    			'crm-blue': '#4a5fd7',
    			'crm-purple': '#7c3aed',
    			border: 'hsl(var(--border))',
    			input: 'hsl(var(--input))',
    			ring: 'hsl(var(--ring))',
    			background: 'hsl(var(--background))',
    			foreground: 'hsl(var(--foreground))',
    			primary: {
    				DEFAULT: 'hsl(var(--primary))',
    				foreground: 'hsl(var(--primary-foreground))'
    			},
    			secondary: {
    				DEFAULT: 'hsl(var(--secondary))',
    				foreground: 'hsl(var(--secondary-foreground))'
    			},
    			destructive: {
    				DEFAULT: 'hsl(var(--destructive))',
    				foreground: 'hsl(var(--destructive-foreground))'
    			},
    			muted: {
    				DEFAULT: 'hsl(var(--muted))',
    				foreground: 'hsl(var(--muted-foreground))'
    			},
    			accent: {
    				DEFAULT: 'hsl(var(--accent))',
    				foreground: 'hsl(var(--accent-foreground))'
    			},
    			popover: {
    				DEFAULT: 'hsl(var(--popover))',
    				foreground: 'hsl(var(--popover-foreground))'
    			},
    			card: {
    				DEFAULT: 'hsl(var(--card))',
    				foreground: 'hsl(var(--card-foreground))'
    			},
    			chart: {
    				'1': 'hsl(var(--chart-1))',
    				'2': 'hsl(var(--chart-2))',
    				'3': 'hsl(var(--chart-3))',
    				'4': 'hsl(var(--chart-4))',
    				'5': 'hsl(var(--chart-5))'
    			}
    		},
    		fontFamily: {
    			sans: ['DM Sans', 'sans-serif'],
    			serif: ['Instrument Serif', 'serif']
    		},
    		borderRadius: {
    			lg: 'var(--radius)',
    			md: 'calc(var(--radius) - 2px)',
    			sm: 'calc(var(--radius) - 4px)'
    		},
    		keyframes: {
    			'fade-up': {
    				'0%': { opacity: '0', transform: 'translateY(10px)' },
    				'100%': { opacity: '1', transform: 'translateY(0)' }
    			},
    			'slide-in': {
    				'0%': { opacity: '0', transform: 'translateX(-10px)' },
    				'100%': { opacity: '1', transform: 'translateX(0)' }
    			}
    		},
    		animation: {
    			'fade-up': 'fade-up 0.4s ease-out forwards',
    			'slide-in': 'slide-in 0.3s ease-out forwards'
    		}
    	}
    },
    plugins: [require("tailwindcss-animate")],
};
