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
        liturgico: {
          verde: '#014034',
          rojo: '#590212',
          blanco: '#ffffff',
          azul: '#4ab3c2',
          morado: '#4a0088',
          negro: '#000000',
          rosa: '#c24977',
        },
      },
      fontFamily: {
        misal: ['Georgia', '"Times New Roman"', 'serif'],
      },
    },
  },
  plugins: [],
}