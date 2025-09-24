/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2c6ddb",
        },
        secondary: {
          DEFAULT: "#044ac1",
        },

        darkBlue: "#000C30",    // Dark Blue
        lightBlue: "#caedfa",   // Light-blue
        error: "#d6040b",       // Error
        green: "#30b01b",       // Green

        white: "#FFFFFF",
        black: "#000000",
        gray: {
          light: "#d6d6d6",     // Light_gray
          DEFAULT: "#9ca3af",   // Gray
          dark: "#707070",      // Dark_gray
          extraLight: "#ebebeb", // Extra Light Gray
        },

        cyanLight: "#d6f2f5",        // Cyan Light
        lightSecondary: "#f8f5f5",   // Light-Secondary
      },
      fontFamily: {
        sans: ["Montserrat", "sans-serif"], // default body
        heading: ["Montserrat", "sans-serif"], // headings
      },
    },
  },
  plugins: [
    // Add plugins as needed
    // require('@tailwindcss/forms'),
    // require('@tailwindcss/typography'),
  ],
}