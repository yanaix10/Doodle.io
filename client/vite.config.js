import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  server: {
    port: 5173,
    host: true,
    proxy: {
      "/socket.io": {
        target: "http://localhost:3001",
        ws: true,
        changeOrigin: true,
        configure: (proxy, _options) => {
          proxy.on("error", (err, _req, _res) => {
            if (err.code === "ECONNRESET" || err.code === "EPIPE") {
              return;
            }
            console.error("[vite ws proxy error]", err.message);
          });
          proxy.on("proxyReqWs", (_proxyReq, _req, socket, _options, _head) => {
            socket.on("error", (err) => {
              if (err.code === "ECONNRESET" || err.code === "EPIPE") {
                return;
              }
              console.error("[vite ws client socket error]", err.message);
            });
          });
        }
      }
    }
  }
});
