import { beforeEach, describe, expect, it, test, vi } from 'vitest';

import { SpeechRecognition as MockSpeechRecognition } from 'corti';

import * as annyang from '../../src/annyang';
import { isSpeechRecognitionSupported, start, isListening } from '../../src/annyang';

test('SpeechRecognition is mocked', () => {
  expect(globalThis.SpeechRecognition).toBeDefined();
  expect(new globalThis.SpeechRecognition()).toBeInstanceOf(MockSpeechRecognition);
});

test('Can import annyang as an object', () => {
  expect(annyang).toBeDefined();
  expect(annyang.isSpeechRecognitionSupported).toBeInstanceOf(Function);
  expect(annyang.isSpeechRecognitionSupported()).toBe(true);
});

test('Can import individual named exports from annyang', () => {
  expect(isSpeechRecognitionSupported).toBeInstanceOf(Function);
  expect(isSpeechRecognitionSupported()).toBe(true);
  expect(isListening()).toBe(false);
  start();
  expect(isListening()).toBe(true);
});

describe('annyang', () => {
  let logSpy;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log');
    annyang.debug(false);
    annyang.abort();
    annyang.removeCommands();
    annyang.removeCallback();
  });

  describe('isSpeechRecognitionSupported', () => {
    it('should be a function', () => {
      expect(annyang.isSpeechRecognitionSupported).toBeInstanceOf(Function);
    });
    it('should return true when SpeechRecognition is available in globalThis', () => {
      expect(annyang.isSpeechRecognitionSupported()).toBe(true);
    });
  });

  describe('addCommands', () => {
    it('should be a function', () => {
      expect(annyang.addCommands).toBeInstanceOf(Function);
    });

    it('should accept an object consisting of key (sentence) and value (callback function)', () => {
      expect(() => {
        annyang.addCommands({
          'Time for some thrilling heroics': () => {},
        });
      }).not.toThrowError();
    });

    it('should write to console each command that was successfully added when debug is on', () => {
      expect(logSpy).toHaveBeenCalledTimes(0);
      annyang.debug(true);

      annyang.addCommands({
        'Time for some thrilling heroics': () => {},
      });

      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith(
        'Command successfully loaded: %cTime for some thrilling heroics',
        'font-weight: bold; color: #00f;'
      );

      annyang.addCommands({
        'That sounds like something out of science fiction': () => {},
        'We should start dealing in those black-market beagles': () => {},
      });

      expect(console.log).toHaveBeenCalledTimes(3);
    });

    it('should not write to console commands added when debug is off', () => {
      annyang.debug(false);
      annyang.addCommands({
        'Time for some thrilling heroics': () => {},
      });
      annyang.addCommands({
        'That sounds like something out of science fiction': () => {},
        'We should start dealing in those black-market beagles': () => {},
      });

      expect(console.log).not.toHaveBeenCalled();
    });

    it('should write to console when commands could not be added and debug is on', () => {
      annyang.debug(true);
      expect(console.log).not.toHaveBeenCalled();

      annyang.addCommands({
        'Time for some thrilling heroics': 'not_a_function',
      });

      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith(
        'Can not register command: %cTime for some thrilling heroics',
        'font-weight: bold; color: #00f;'
      );
    });

    it('should not write to console when commands could not be added but debug is off', () => {
      annyang.debug(false);
      annyang.addCommands({
        'Time for some thrilling heroics': 'not_a_function',
      });
      expect(console.log).not.toHaveBeenCalled();
    });

    describe('command matching', () => {
      let spyOnMatch;

      beforeEach(() => {
        spyOnMatch = vi.fn();
      });

      it('should work when a command object with a single simple command is passed', () => {
        annyang.addCommands({ 'Time for some thrilling heroics': spyOnMatch });
        annyang.start();
        annyang.getSpeechRecognizer().say('Time for some thrilling heroics');
        expect(spyOnMatch).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('removeCommands', () => {
    let recognition;
    let spyOnMatch1;
    let spyOnMatch2;
    let spyOnMatch3;
    let spyOnMatch4;
    let spyOnMatch5;

    beforeEach(() => {
      spyOnMatch1 = vi.fn();
      spyOnMatch2 = vi.fn();
      spyOnMatch3 = vi.fn();
      spyOnMatch4 = vi.fn();
      spyOnMatch5 = vi.fn();
      annyang.addCommands({
        'Time for some (thrilling) heroics': spyOnMatch1,
        'We should start dealing in those *merchandise': spyOnMatch2,
        'That sounds like something out of science fiction': spyOnMatch3,
        'too pretty': {
          regexp: /We are just too pretty for God to let us die/,
          callback: spyOnMatch4,
        },
        "You can't take the :thing from me": spyOnMatch5,
      });
      annyang.start({ continuous: true });
      recognition = annyang.getSpeechRecognizer();
    });

    it('should be a function', () => {
      expect(annyang.removeCommands).toBeInstanceOf(Function);
    });

    it('should remove a single command when its name is passed as a string in the first parameter', () => {
      annyang.removeCommands('Time for some (thrilling) heroics');
      annyang.start();
      recognition.say('Time for some thrilling heroics');
      recognition.say('We should start dealing in those black-market beagles');
      recognition.say('That sounds like something out of science fiction');
      recognition.say('We are just too pretty for God to let us die');
      recognition.say("You can't take the sky from me");
      expect(spyOnMatch1).not.toHaveBeenCalled();
      expect(spyOnMatch2).toHaveBeenCalledTimes(1);
      expect(spyOnMatch3).toHaveBeenCalledTimes(1);
      expect(spyOnMatch4).toHaveBeenCalledTimes(1);
      expect(spyOnMatch5).toHaveBeenCalledTimes(1);
    });

    it('should remove multiple commands when their names are passed as an array in the first parameter', () => {
      annyang.removeCommands([
        'Time for some (thrilling) heroics',
        'That sounds like something out of science fiction',
      ]);
      recognition.say('Time for some thrilling heroics');
      recognition.say('We should start dealing in those black-market beagles');
      recognition.say('That sounds like something out of science fiction');
      recognition.say('We are just too pretty for God to let us die');
      recognition.say("You can't take the sky from me");

      expect(spyOnMatch1).not.toHaveBeenCalled();
      expect(spyOnMatch2).toHaveBeenCalledTimes(1);
      expect(spyOnMatch3).not.toHaveBeenCalled();
      expect(spyOnMatch4).toHaveBeenCalledTimes(1);
      expect(spyOnMatch5).toHaveBeenCalledTimes(1);
    });

    it('should remove all commands when called with no parameters', () => {
      annyang.removeCommands();
      recognition.say('Time for some heroics');
      recognition.say('We should start dealing in those black-market beagles');
      recognition.say('That sounds like something out of science fiction');
      recognition.say('We are just too pretty for God to let us die');
      recognition.say("You can't take the sky from me");

      expect(spyOnMatch1).not.toHaveBeenCalled();
      expect(spyOnMatch2).not.toHaveBeenCalled();
      expect(spyOnMatch3).not.toHaveBeenCalled();
      expect(spyOnMatch4).not.toHaveBeenCalled();
      expect(spyOnMatch5).not.toHaveBeenCalled();
    });

    it('should remove a command with an optional word when its name is passed in the first parameter', () => {
      annyang.removeCommands('Time for some (thrilling) heroics');
      recognition.say('Time for some heroics');
      recognition.say('We should start dealing in those black-market beagles');
      recognition.say('That sounds like something out of science fiction');
      recognition.say('We are just too pretty for God to let us die');
      recognition.say("You can't take the sky from me");

      expect(spyOnMatch1).not.toHaveBeenCalled();
      expect(spyOnMatch2).toHaveBeenCalledTimes(1);
      expect(spyOnMatch3).toHaveBeenCalledTimes(1);
      expect(spyOnMatch4).toHaveBeenCalledTimes(1);
      expect(spyOnMatch5).toHaveBeenCalledTimes(1);
    });

    it('should remove a command with a named variable when its name is passed in the first parameter', () => {
      annyang.removeCommands("You can't take the :thing from me");
      recognition.say('Time for some heroics');
      recognition.say('We should start dealing in those black-market beagles');
      recognition.say('That sounds like something out of science fiction');
      recognition.say('We are just too pretty for God to let us die');
      recognition.say("You can't take the sky from me");

      expect(spyOnMatch1).toHaveBeenCalledTimes(1);
      expect(spyOnMatch2).toHaveBeenCalledTimes(1);
      expect(spyOnMatch3).toHaveBeenCalledTimes(1);
      expect(spyOnMatch4).toHaveBeenCalledTimes(1);
      expect(spyOnMatch5).not.toHaveBeenCalled();
    });

    it('should remove a command with a splat when its name is passed as a parameter', () => {
      annyang.removeCommands('We should start dealing in those *merchandise');
      recognition.say('Time for some heroics');
      recognition.say('We should start dealing in those black-market beagles');
      recognition.say('That sounds like something out of science fiction');
      recognition.say('We are just too pretty for God to let us die');
      recognition.say("You can't take the sky from me");

      expect(spyOnMatch1).toHaveBeenCalledTimes(1);
      expect(spyOnMatch2).not.toHaveBeenCalled();
      expect(spyOnMatch3).toHaveBeenCalledTimes(1);
      expect(spyOnMatch4).toHaveBeenCalledTimes(1);
      expect(spyOnMatch5).toHaveBeenCalledTimes(1);
    });

    it('should remove a regexp command when its name is passed as a parameter', () => {
      annyang.removeCommands('too pretty');
      recognition.say('Time for some heroics');
      recognition.say('We should start dealing in those black-market beagles');
      recognition.say('That sounds like something out of science fiction');
      recognition.say('We are just too pretty for God to let us die');
      recognition.say("You can't take the sky from me");

      expect(spyOnMatch1).toHaveBeenCalledTimes(1);
      expect(spyOnMatch2).toHaveBeenCalledTimes(1);
      expect(spyOnMatch3).toHaveBeenCalledTimes(1);
      expect(spyOnMatch4).not.toHaveBeenCalled();
      expect(spyOnMatch5).toHaveBeenCalledTimes(1);
    });
  });

  describe('removeCallback', () => {
    let spy1;
    let spy2;
    let spy3;
    let spy4;

    beforeEach(() => {
      spy1 = vi.fn();
      spy2 = vi.fn();
      spy3 = vi.fn();
      spy4 = vi.fn();
      annyang.addCallback('start', spy1);
      annyang.addCallback('start', spy2);
      annyang.addCallback('end', spy3);
      annyang.addCallback('end', spy4);
    });

    it('should be a function', () => {
      expect(annyang.removeCallback).toBeInstanceOf(Function);
    });

    it('should always return undefined', () => {
      expect(annyang.removeCallback()).toEqual(undefined);
      expect(annyang.removeCallback('blergh')).toEqual(undefined);
      expect(annyang.removeCallback('start')).toEqual(undefined);
      expect(annyang.removeCallback('start', () => {})).toEqual(undefined);
    });

    it('should delete all callbacks on all event types if passed undefined in both parameters', () => {
      annyang.removeCallback();
      annyang.start();
      annyang.abort();

      expect(spy1).not.toHaveBeenCalled();
      expect(spy2).not.toHaveBeenCalled();
      expect(spy3).not.toHaveBeenCalled();
      expect(spy4).not.toHaveBeenCalled();
    });

    it('should delete all callbacks of certain fuction on all event types if first parameter is undefined and second parameter is that function', () => {
      annyang.addCallback('end', spy1);
      annyang.removeCallback(undefined, spy1);
      annyang.start();
      annyang.abort();

      expect(spy1).not.toHaveBeenCalled();
      expect(spy2).toHaveBeenCalledTimes(1);
      expect(spy3).toHaveBeenCalledTimes(1);
      expect(spy4).toHaveBeenCalledTimes(1);
    });

    it('should delete all callbacks on an event type if passed an event name and no second parameter', () => {
      annyang.removeCallback('start');
      annyang.start();
      annyang.abort();

      expect(spy1).not.toHaveBeenCalled();
      expect(spy2).not.toHaveBeenCalled();
      expect(spy3).toHaveBeenCalledTimes(1);
      expect(spy4).toHaveBeenCalledTimes(1);
    });

    it('should delete the callbacks on an event type matching the function passed as the second parameter', () => {
      annyang.removeCallback('start', spy2);
      annyang.start();
      annyang.abort();

      expect(spy1).toHaveBeenCalledTimes(1);
      expect(spy2).not.toHaveBeenCalled();
      expect(spy3).toHaveBeenCalledTimes(1);
      expect(spy4).toHaveBeenCalledTimes(1);
    });
  });

  describe('getSpeechRecognizer', () => {
    it('should be a function', () => {
      expect(annyang.getSpeechRecognizer).toBeInstanceOf(Function);
    });

    it('should return the instance of SpeechRecognition used by annyang', () => {
      const spyOnStart = vi.fn();
      const recognition = annyang.getSpeechRecognizer();
      expect(recognition).toBeInstanceOf(MockSpeechRecognition);

      // Make sure it's the one used by annyang
      recognition.addEventListener('start', spyOnStart);
      expect(spyOnStart).not.toHaveBeenCalled();
      annyang.start();
      expect(spyOnStart).toHaveBeenCalledTimes(1);
    });
  });

  describe('start', () => {
    let spyOnStart1;
    let spyOnStart2;

    beforeEach(() => {
      spyOnStart1 = vi.fn();
      spyOnStart2 = vi.fn();
    });

    it('should be a function', () => {
      expect(annyang.start).toBeInstanceOf(Function);
    });

    it('should start annyang and SpeechRecognition if it was aborted', () => {
      const recognition = annyang.getSpeechRecognizer();
      recognition.addEventListener('start', spyOnStart1);
      annyang.addCallback('start', spyOnStart2);
      expect(spyOnStart1).not.toHaveBeenCalled();
      expect(spyOnStart2).not.toHaveBeenCalled();
      expect(annyang.isListening()).toBe(false);
      annyang.start();
      expect(annyang.isListening()).toBe(true);
      expect(spyOnStart1).toHaveBeenCalledTimes(1);
      expect(spyOnStart2).toHaveBeenCalledTimes(1);
    });
  });

  describe('abort', () => {
    let spyOnEnd;
    let recognition;

    beforeEach(() => {
      spyOnEnd = vi.fn();
      recognition = annyang.getSpeechRecognizer();
      recognition.addEventListener('end', spyOnEnd);
    });

    it('should be a function', () => {
      expect(annyang.abort).toBeInstanceOf(Function);
    });

    it('should stop SpeechRecognition and annyang if it is started', () => {
      annyang.start();
      expect(spyOnEnd).toHaveBeenCalledTimes(0);
      expect(annyang.isListening()).toBe(true);
      annyang.abort();
      expect(spyOnEnd).toHaveBeenCalledTimes(1);
      expect(annyang.isListening()).toBe(false);
    });

    it('should stop Speech Recognition and annyang if it is paused', () => {
      annyang.start();
      annyang.pause();
      expect(spyOnEnd).toHaveBeenCalledTimes(0);
      expect(annyang.isListening()).toBe(false);
      annyang.abort();
      expect(spyOnEnd).toHaveBeenCalledTimes(1);
      expect(annyang.isListening()).toBe(false);
    });

    it('should do nothing when annyang is already stopped', () => {
      annyang.start();
      annyang.abort();
      expect(spyOnEnd).toHaveBeenCalledTimes(1);
      annyang.abort();
      expect(spyOnEnd).toHaveBeenCalledTimes(1);
    });

    it('should not throw an error when called before annyang initializes', () => {
      expect(() => {
        annyang.abort();
      }).not.toThrowError();
    });
  });

  describe('pause', () => {
    it('should be a function', () => {
      expect(annyang.pause).toBeInstanceOf(Function);
    });

    it('should return undefined when called', () => {
      expect(annyang.pause()).toEqual(undefined);
    });

    it.skip('should cause commands not to fire even when a command phrase is matched', () => {
      const spyOnMatch = vi.fn();
      annyang.addCommands({
        'Time for some thrilling heroics': spyOnMatch,
      });
      annyang.start();
      // delete the next 2 lines and uncomment the rest
      annyang.getSpeechRecognizer().say('Time for some thrilling heroics');
      expect(spyOnMatch).toHaveBeenCalledTimes(1);
      // annyang.pause();
      // annyang.getSpeechRecognizer().say('Time for some thrilling heroics');
      // expect(spyOnMatch).not.toHaveBeenCalled();
    });
  });

  describe('resume', () => {
    it('should be a function', () => {
      expect(annyang.resume).toBeInstanceOf(Function);
    });
  });

  describe('setLanguage', () => {
    it('should be a function', () => {
      expect(annyang.setLanguage).toBeInstanceOf(Function);
    });

    it('should return undefined when called', () => {
      expect(annyang.setLanguage()).toEqual(undefined);
    });

    it('should set the Speech Recognition engine to the value passed', () => {
      annyang.setLanguage('he');

      expect(annyang.getSpeechRecognizer().lang).toEqual('he');
    });
  });

  describe('isListening', () => {
    it('should be a function', () => {
      expect(annyang.isListening).toBeInstanceOf(Function);
    });

    it('should return false when called before annyang starts', () => {
      expect(annyang.isListening()).toBe(false);
    });

    it('should return true when called after annyang starts', () => {
      annyang.start();
      expect(annyang.isListening()).toBe(true);
    });

    it('should return false when called after annyang aborts', () => {
      annyang.start();
      annyang.abort();
      expect(annyang.isListening()).toBe(false);
    });

    it('should return false when called when annyang is paused', () => {
      annyang.start();
      annyang.pause();
      expect(annyang.isListening()).toBe(false);
    });

    it('should return true when called after annyang is resumed', () => {
      annyang.start();
      annyang.pause();
      annyang.resume();
      expect(annyang.isListening()).toBe(true);
    });

    it('should return false when SpeechRecognition object is aborted directly', () => {
      annyang.start();
      expect(annyang.isListening()).toBe(true);
      annyang.getSpeechRecognizer().abort();
      expect(annyang.isListening()).toBe(false);
    });
  });

  describe('events', () => {
    describe('end', () => {
      let spyOnEnd;

      beforeEach(() => {
        spyOnEnd = vi.fn();
        annyang.addCallback('end', spyOnEnd);
      });

      it('should fire callback when annyang aborts', () => {
        annyang.start();
        expect(spyOnEnd).toHaveBeenCalledTimes(0);
        annyang.abort();
        expect(spyOnEnd).toHaveBeenCalledTimes(1);
      });

      it('should not fire callback when annyang enters paused state', () => {
        annyang.start();
        annyang.pause();
        expect(spyOnEnd).toHaveBeenCalledTimes(0);
      });

      it('should trigger when SpeechRecognition is directly aborted', () => {
        annyang.start();
        annyang.getSpeechRecognizer().abort();
        expect(spyOnEnd).toHaveBeenCalledTimes(1);
      });
    });
  });
});
