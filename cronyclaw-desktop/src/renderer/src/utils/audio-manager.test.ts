import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { audioManager } from './audio-manager';

describe('audioManager', () => {
  let pause: ReturnType<typeof vi.fn>;
  let load: ReturnType<typeof vi.fn>;
  let releasePcmData: ReturnType<typeof vi.fn>;
  let wavFileHandler: any;

  beforeEach(() => {
    pause = vi.fn();
    load = vi.fn();
    releasePcmData = vi.fn();
    wavFileHandler = {
      releasePcmData,
      _lastRms: 123,
      _sampleOffset: 45,
      _userTimeSeconds: 67,
    };
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    audioManager.stopCurrentAudioAndLipSync();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('tracks current audio and clears on stop including model lip-sync release', () => {
    const audio = {
      pause,
      src: 'x',
      load,
    } as unknown as HTMLAudioElement;
    const model = { _wavFileHandler: wavFileHandler };
    audioManager.setCurrentAudio(audio, model);
    expect(audioManager.hasCurrentAudio()).toBe(true);
    audioManager.stopCurrentAudioAndLipSync();
    expect(pause).toHaveBeenCalled();
    expect(audio.src).toBe('');
    expect(load).toHaveBeenCalled();
    expect(releasePcmData).toHaveBeenCalledTimes(1);
    expect(wavFileHandler._lastRms).toBe(0.0);
    expect(wavFileHandler._sampleOffset).toBe(0);
    expect(wavFileHandler._userTimeSeconds).toBe(0.0);
    expect(audioManager.hasCurrentAudio()).toBe(false);
  });

  it('clearCurrentAudio only clears matching element', () => {
    const a = { pause: vi.fn(), src: '', load: vi.fn() } as unknown as HTMLAudioElement;
    audioManager.setCurrentAudio(a, null);
    const other = { pause: vi.fn(), src: '', load: vi.fn() } as unknown as HTMLAudioElement;
    audioManager.clearCurrentAudio(other);
    expect(audioManager.hasCurrentAudio()).toBe(true);
    audioManager.clearCurrentAudio(a);
    expect(audioManager.hasCurrentAudio()).toBe(false);
  });

  it('stopCurrentAudioAndLipSync does nothing when no current audio is set', () => {
    audioManager.stopCurrentAudioAndLipSync();
    expect(() => audioManager.stopCurrentAudioAndLipSync()).not.toThrow();
  });
});
