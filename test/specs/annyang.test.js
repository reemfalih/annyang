import { beforeAll, expect, test } from 'vitest';

import { SpeechRecognition as MockSpeechRecognition } from 'corti';

let annyang;

beforeAll(async () => {
  annyang = (await import('../../dist/annyang.mjs')).default;
});

test('SpeechRecognition is mocked', () => {
  expect(globalThis.SpeechRecognition).toBeDefined();
  expect(new globalThis.SpeechRecognition()).toBeInstanceOf(MockSpeechRecognition);
});
