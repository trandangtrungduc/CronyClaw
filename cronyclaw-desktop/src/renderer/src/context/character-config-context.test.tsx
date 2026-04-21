import type { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { CharacterConfigProvider, useConfig } from './character-config-context';

function wrap(ui: ReactNode) {
  return render(
    <ChakraProvider value={defaultSystem}>
      <CharacterConfigProvider>{ui}</CharacterConfigProvider>
    </ChakraProvider>,
  );
}

function CharacterConfigConsumer() {
  const { confName, confUid, configFiles, setConfName, setConfUid, setConfigFiles, getFilenameByName } = useConfig();
  return (
    <div>
      <span data-testid="confName">{confName}</span>
      <span data-testid="confUid">{confUid}</span>
      <span data-testid="files">{configFiles.map((f) => f.name).join(',')}</span>
      <span data-testid="filename">{getFilenameByName('a') ?? ''}</span>
      <button type="button" onClick={() => setConfName('NewName')}>
        setName
      </button>
      <button type="button" onClick={() => setConfUid('UID-1')}>
        setUid
      </button>
      <button
        type="button"
        onClick={() =>
          setConfigFiles([
            { name: 'a', filename: 'a.json' },
            { name: 'b', filename: 'b.json' },
          ])
        }
      >
        setFiles
      </button>
    </div>
  );
}

describe('CharacterConfigContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('updates config state and calls window.api.updateConfigFiles on configFiles change', () => {
    wrap(<CharacterConfigConsumer />);

    expect(screen.getByTestId('confName').textContent).toBe('');
    expect(screen.getByTestId('confUid').textContent).toBe('');
    expect(screen.getByTestId('files').textContent).toBe('');

    fireEvent.click(screen.getByText('setName'));
    expect(screen.getByTestId('confName').textContent).toBe('NewName');

    fireEvent.click(screen.getByText('setUid'));
    expect(screen.getByTestId('confUid').textContent).toBe('UID-1');

    fireEvent.click(screen.getByText('setFiles'));
    expect(screen.getByTestId('files').textContent).toContain('a,b');
    expect(screen.getByTestId('filename').textContent).toBe('a.json');
  });
});
