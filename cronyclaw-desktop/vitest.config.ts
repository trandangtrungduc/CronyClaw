import path from 'path';
import react from '@vitejs/plugin-react-swc';
import { defineConfig } from 'vitest/config';

const sanitizedNodeOptions =
  (process.env.NODE_OPTIONS ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .filter((p) => !p.startsWith('--localstorage-file'))
    .join(' ')
    .trim();

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    env: {
      NODE_OPTIONS: sanitizedNodeOptions,
    },
    onConsoleLog(log) {
      if (
        log.includes('must be used within a AiStateProvider')
        || log.includes('must be used within a ChatHistoryProvider')
        || log.includes('must be used within a SubtitleProvider')
        || log.includes('must be used within a ScreenCaptureProvider')
        || log.includes('must be used within a ProactiveSpeakProvider')
        || log.includes('must be used within a Live2DConfigProvider')
        || log.includes('The above error occurred in the <Broken> component')
        || log.includes('Consider adding an error boundary to your tree')
        || log.includes('Using kebab-case for css properties in objects is not supported')
        || log.includes('Live2DDebug')
        || log.includes('images:')
        || log.includes('[ContextMenu]')
        || log.includes('Adding audio task')
        || log.includes('Skipping audio task')
        || log.includes('Skipping character switch')
        || log.includes('Switch Character fileName')
        || log.includes('locize.com')
        || log.includes('not wrapped in act(')
        || log.includes('Error capturing')
        || log.includes('Failed to parse WebSocket message')
        || log.includes('Interrupting conversation chain')
        || log.includes('Interrupted!')
        || log.includes('Force ignore mouse changed:')
        || log.includes('Received message from server:')
        || log.includes('[Resize] Width or Height is zero')
        || log.includes('The tag <path> is unrecognized')
      ) {
        return false;
      }
    },
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'src/**/__tests__/**/*.{ts,tsx}',
    ],
    exclude: [
      '**/node_modules/**',
      '**/src/renderer/WebSDK/**',
      '**/src/renderer/MotionSync/**',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      include: [
        'src/main/**/*.ts',
        'src/preload/**/*.ts',
        'src/renderer/src/**/*.{ts,tsx}',
      ],
      exclude: [
        '**/*.{test,spec}.{ts,tsx}',
        '**/node_modules/**',
        '**/src/renderer/WebSDK/**',
        '**/src/renderer/MotionSync/**',
      ],
    },
    server: {
      deps: {
        inline: ['@chakra-ui/react', 'next-themes'],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer/src'),
      '@framework': path.resolve(__dirname, 'src/renderer/WebSDK/Framework/src'),
      '@cubismsdksamples': path.resolve(__dirname, 'src/renderer/WebSDK/src'),
      '@motionsyncframework': path.resolve(
        __dirname,
        'src/renderer/MotionSync/Framework/src',
      ),
      '@motionsync': path.resolve(__dirname, 'src/renderer/MotionSync/src'),
    },
  },
});
