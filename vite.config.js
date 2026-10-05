import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Порт локального PHP-API (см. start-api.ps1)
const API_PORT = 8080;

export default defineConfig(({ command }) => ({
  // В разработке приложение живёт по тому же пути /DataSources/, что и в проде,
  // поэтому абсолютные ссылки на /DataSources/api/... работают без правок.
  // В сборке пути относительные — dist/ можно положить в любую папку.
  base: command === "build" ? "./" : "/DataSources/",
  plugins: [react(), tailwindcss()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    strictPort: true,
    hmr: {
      port: 3000,
    },
    // Запросы к API уходят на локальный PHP-сервер (start-api.ps1).
    // Без него не будет ни данных из БД, ни определения IP.
    proxy: {
      "/DataSources/api": {
        target: `http://127.0.0.1:${API_PORT}`,
        changeOrigin: false,
      },
      "/api": {
        target: `http://127.0.0.1:${API_PORT}`,
        changeOrigin: false,
      },
    },
  },
}));
