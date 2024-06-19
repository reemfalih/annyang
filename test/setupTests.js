import { vi, beforeAll, afterAll } from 'vitest';
import { SpeechRecognition } from 'corti';

beforeAll(() => {
  vi.stubGlobal('SpeechRecognition', SpeechRecognition);
});

afterAll(() => {
  vi.unstubAllGlobals();
});
