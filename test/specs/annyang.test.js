import { afterAll, beforeAll, beforeEach, describe, expect, it, vi, test } from 'vitest';

import { SpeechRecognition } from 'corti';

beforeAll(() => {
  vi.stubGlobal('SpeechRecognition', SpeechRecognition);
});

afterAll(() => {
  vi.unstubAllGlobals();
});

test('SpeechRecognition is mocked', () => {
  expect(globalThis.SpeechRecognition).toBeDefined();
  expect(new globalThis.SpeechRecognition()).toBeInstanceOf(SpeechRecognition);
});
