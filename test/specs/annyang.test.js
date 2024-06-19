import { beforeAll, describe, expect, it, test } from 'vitest';

import { SpeechRecognition as MockSpeechRecognition } from 'corti';

let annyang;

beforeAll(async () => {
  annyang = (await import('../../dist/annyang.mjs')).default;
});

test('SpeechRecognition is mocked', () => {
  expect(globalThis.SpeechRecognition).toBeDefined();
  expect(new globalThis.SpeechRecognition()).toBeInstanceOf(MockSpeechRecognition);
});

describe('annyang', () => {
  describe('isSpeechRecognitionSupported', () => {
    it('should be a function', () => {
      expect(annyang.isSpeechRecognitionSupported).toBeInstanceOf(Function);
    });
    it('should return true when SpeechRecognition is available in globalThis', () => {
      expect(annyang.isSpeechRecognitionSupported()).toBe(true);
    });
  });

  describe('init', () => {
    it('should be a function', () => {
      expect(annyang.init).toBeInstanceOf(Function);
    });
  });
});
