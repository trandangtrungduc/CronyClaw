import {
  useState, useEffect, useMemo, useCallback, ChangeEvent, KeyboardEvent,
} from 'react';
import { useWebSocket } from '@/context/websocket-context';
import { useAiState } from '@/context/ai-state-context';
import { useInterrupt } from '@/components/canvas/live2d';
import { useChatHistory } from '@/context/chat-history-context';
import { useVAD } from '@/context/vad-context';
import { useMediaCapture } from '@/hooks/utils/use-media-capture';
import {
  SLASH_COMMANDS,
  findSlashCommandById,
  type SlashCommand,
} from '@/config/slash-commands';

function firstLineOf(s: string) {
  return s.split('\n')[0];
}

function slashMenuItems(text: string): SlashCommand[] {
  const line = firstLineOf(text);
  if (!line.startsWith('/') || line.includes(' ')) return [];
  const q = line.slice(1);
  return SLASH_COMMANDS.filter((c) => c.id.startsWith(q));
}

function isSlashMenuOpen(text: string, suppressed: boolean) {
  if (suppressed) return false;
  const line = firstLineOf(text);
  if (!line.startsWith('/') || line.includes(' ')) return false;
  return slashMenuItems(text).length > 0;
}

function recognizedSlashCommand(text: string): SlashCommand | null {
  const line = firstLineOf(text);
  if (!line.startsWith('/')) return null;
  const m = line.match(/^\/(\S+)/);
  if (!m) return null;
  return findSlashCommandById(m[1]) ?? null;
}

export function useTextInput() {
  const [inputText, setInputTextState] = useState('');
  const [isComposing, setIsComposing] = useState(false);
  const [slashSuppressed, setSlashSuppressed] = useState(false);
  const [slashHighlight, setSlashHighlight] = useState(0);
  const wsContext = useWebSocket();
  const { aiState } = useAiState();
  const { interrupt } = useInterrupt();
  const { appendHumanMessage } = useChatHistory();
  const { stopMic, autoStopMic } = useVAD();
  const { captureAllMedia } = useMediaCapture();

  const slashItems = useMemo(() => slashMenuItems(inputText), [inputText]);
  const slashMenuVisible = useMemo(
    () => isSlashMenuOpen(inputText, slashSuppressed),
    [inputText, slashSuppressed],
  );

  const itemsKey = slashItems.map((c) => c.id).join(',');

  useEffect(() => {
    setSlashHighlight(0);
  }, [itemsKey]);

  const recognizedCommand = useMemo(
    () => recognizedSlashCommand(inputText),
    [inputText],
  );

  const applySlashSelection = useCallback((cmd: SlashCommand) => {
    setInputTextState((prev) => {
      const lines = prev.split('\n');
      const first = lines[0];
      const restLines = lines.slice(1);
      const m = first.match(/^(\/[^\s]*)(.*)$/);
      const rawSuffix = m?.[2] ?? '';
      const suffix = rawSuffix.replace(/^\s+/, '');
      const newFirst = suffix ? `/${cmd.id} ${suffix}` : `/${cmd.id} `;
      return restLines.length ? `${newFirst}\n${restLines.join('\n')}` : newFirst;
    });
    setSlashSuppressed(false);
  }, []);

  const setInputText = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSlashSuppressed(false);
    setInputTextState(e.target.value);
  }, []);

  const handleSend = useCallback(async () => {
    if (!inputText.trim() || !wsContext) return;
    if (aiState === 'thinking-speaking') {
      interrupt();
    }

    const images = await captureAllMedia();

    appendHumanMessage(inputText.trim());
    wsContext.sendMessage({
      type: 'text-input',
      text: inputText.trim(),
      images,
    });

    if (autoStopMic) stopMic();
    setInputTextState('');
    setSlashSuppressed(false);
  }, [
    inputText,
    wsContext,
    aiState,
    interrupt,
    appendHumanMessage,
    captureAllMedia,
    autoStopMic,
    stopMic,
  ]);

  const handleKeyPress = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (isComposing) return;

    const items = slashMenuItems(inputText);
    const menuOpen = isSlashMenuOpen(inputText, slashSuppressed);

    if (e.key === 'Escape' && menuOpen) {
      e.preventDefault();
      setSlashSuppressed(true);
      return;
    }

    if (menuOpen && items.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSlashHighlight((h) => (h + 1) % items.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSlashHighlight((h) => (h - 1 + items.length) % items.length);
        return;
      }
      if (e.key === 'Tab' || (e.key === 'Enter' && !e.shiftKey)) {
        e.preventDefault();
        const pick = items[slashHighlight] ?? items[0];
        if (pick) applySlashSelection(pick);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [
    isComposing,
    inputText,
    slashSuppressed,
    slashHighlight,
    applySlashSelection,
    handleSend,
  ]);

  const handleCompositionStart = () => setIsComposing(true);
  const handleCompositionEnd = () => setIsComposing(false);

  const slashAssist = useMemo(
    () => ({
      recognized: recognizedCommand,
      menuOpen: slashMenuVisible,
      items: slashItems,
      highlightIndex: slashHighlight,
      onItemHover: setSlashHighlight,
      onPickItem: applySlashSelection,
    }),
    [
      recognizedCommand,
      slashMenuVisible,
      slashItems,
      slashHighlight,
      applySlashSelection,
    ],
  );

  return {
    inputText,
    setInputText,
    handleSend,
    handleKeyPress,
    handleCompositionStart,
    handleCompositionEnd,
    slashAssist,
  };
}
