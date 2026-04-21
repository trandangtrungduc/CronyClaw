import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import AIStateIndicator from './ai-state-indicator';

const aiStateHolder = vi.hoisted(() => ({ state: 'idle' }));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => `t:${k}` }),
}));

vi.mock('@/context/ai-state-context', () => ({
  useAiState: () => ({ aiState: aiStateHolder.state }),
}));

function wrap(node: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{node}</ChakraProvider>);
}

describe('AIStateIndicator', () => {
  beforeEach(() => {
    aiStateHolder.state = 'idle';
  });

  it('shows translated label for current ai state', () => {
    wrap(<AIStateIndicator />);
    expect(screen.queryByText('t:aiState.idle')).not.toBeNull();
  });

  it('follows aiState from context', () => {
    aiStateHolder.state = 'listening';
    wrap(<AIStateIndicator />);
    expect(screen.queryByText('t:aiState.listening')).not.toBeNull();
  });
});
