/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        misal: {
          red: '#ac0705',   // color principal (rojo litúrgico)
          cream: '#f5f0e6', // fondo crema suave para la vista
          ink: '#000000',   // letras
          gold: '#b08d3e',  // dorado litúrgico (acento)
        },
      },
      fontFamily: {
        misal: ['Georgia', '"Times New Roman"', 'serif'],
      },
    },
  },
  plugins: [],
}