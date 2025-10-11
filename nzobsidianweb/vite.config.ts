import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler']],
      },
    }),
  ],
  // SPA fallback을 설정하여 모든 경로가 index.html로 리다이렉트되도록 함
  server: {
    proxy: {
      '/notes': '/'
    }
  },
  build: {
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          // 이미지 파일은 원래 경로 유지
          if (assetInfo.name?.match(/\.(png|jpe?g|gif|svg|webp)$/i)) {
            return 'assets/[name][extname]';
          }
          // 다른 에셋은 기본 처리
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
})
