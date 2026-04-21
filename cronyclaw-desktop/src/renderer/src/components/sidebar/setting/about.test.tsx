import type { ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import About from './about';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => `t:${k}` }),
}));

function wrap(ui: ReactNode) {
  return render(<ChakraProvider value={defaultSystem}>{ui}</ChakraProvider>);
}

describe('About', () => {
  it('renders title and version label', () => {
    wrap(<About />);
    expect(screen.getByText('t:settings.about.title')).not.toBeNull();
    expect(screen.getByText('t:settings.about.version')).not.toBeNull();
    expect(screen.getByText('1.0.0')).not.toBeNull();
  });
});
