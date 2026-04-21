import type { ReactNode } from 'react';
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import TTS from './tts';

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('TTS', () => {
  it('renders minimal placeholder', () => {
    const { container } = wrap(<TTS />);
    expect(container.firstChild).toBeTruthy();
  });
});
