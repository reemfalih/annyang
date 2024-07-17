import { vi, beforeAll, afterAll } from 'vitest';
import { SpeechRecognition } from 'corti';

beforeAll(() => {
  vi.stubGlobal('SpeechRecognition', SpeechRecognition);
  vi.stubGlobal('location', { protocol: 'https:' });
});

afterAll(() => {
  vi.unstubAllGlobals();
});
