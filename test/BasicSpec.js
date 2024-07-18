(function(root, factory) {
  // jshint strict: false
  if (typeof module === 'object' && module.exports) {
    // CommonJS
    factory(require('../../annyang'));
  } else if (typeof define === 'function' && define.amd) {
    // AMD
    define(['annyang'], factory);
  } else {
    // Browser globals
    factory(root.annyang);
  }
})(typeof window !== 'undefined' ? window : this, function factory(annyang) {
  'use strict';

  var env = jasmine.getEnv();
  env.configure({
    random: false
  });

  describe("annyang.addCallback('start')", function() {
    beforeEach(function() {
      annyang.abort();
    });

    it('should add a callback which will be called when annyang starts', function() {
      var spyOnStart = jasmine.createSpy();
      annyang.addCallback('start', spyOnStart);

      expect(spyOnStart).not.toHaveBeenCalled();
      annyang.start();

      expect(spyOnStart).toHaveBeenCalledTimes(1);
    });

    it('should not fire callback when annyang resumes from a paused state', function() {
      // Turn off debugging during this test, as it logs a message when resuming from a paused state which we are not testing for here
      annyang.debug(false);
      var spyOnStart = jasmine.createSpy();
      annyang.start();
      annyang.pause();
      annyang.addCallback('start', spyOnStart);

      expect(spyOnStart).not.toHaveBeenCalled();
      annyang.resume();

      expect(spyOnStart).not.toHaveBeenCalled();
      annyang.debug(true);
    });

    it('should fire callback when annyang resumes from an aborted (stopped) state', function() {
      var spyOnStart = jasmine.createSpy();
      annyang.start();
      annyang.abort();
      annyang.addCallback('start', spyOnStart);

      expect(spyOnStart).not.toHaveBeenCalled();
      annyang.resume();

      expect(spyOnStart).toHaveBeenCalledTimes(1);
    });
  });

  describe("annyang.addCallback('soundstart')", function() {
    var recognition;

    beforeEach(function() {
      recognition = annyang.getSpeechRecognizer();
      annyang.debug(false);
      jasmine.clock().install();
    });

    afterEach(function() {
      annyang.abort();
      annyang.removeCallback();
      jasmine.clock().tick(2000);
      jasmine.clock().uninstall();
    });

    it('should add a callback which will be called when annyang detects sound', function() {
      annyang.start();
      var spyOnSoundStart = jasmine.createSpy();
      annyang.addCallback('soundstart', spyOnSoundStart);

      expect(spyOnSoundStart).not.toHaveBeenCalled();
      recognition.say('Time for some thrilling heroics');

      expect(spyOnSoundStart).toHaveBeenCalledTimes(1);
    });

    it('should fire callback once in continuous mode', function() {
      annyang.start({ continuous: true });
      var spyOnSoundStart = jasmine.createSpy();
      annyang.addCallback('soundstart', spyOnSoundStart);

      expect(spyOnSoundStart).not.toHaveBeenCalled();
      recognition.say('Time for some thrilling heroics');

      expect(spyOnSoundStart).toHaveBeenCalledTimes(1);
      recognition.say('That sounds like something out of science fiction');

      expect(spyOnSoundStart).toHaveBeenCalledTimes(1);
    });

    it('should fire callback multiple times in non-continuous mode with autorestart', function() {
      annyang.start({ continuous: false, autoRestart: true });
      var spyOnSoundStart = jasmine.createSpy();
      annyang.addCallback('soundstart', spyOnSoundStart);

      expect(spyOnSoundStart).not.toHaveBeenCalled();
      recognition.say('Time for some thrilling heroics');

      expect(spyOnSoundStart).toHaveBeenCalledTimes(1);
      jasmine.clock().tick(1000);
      recognition.say('That sounds like something out of science fiction');

      expect(spyOnSoundStart).toHaveBeenCalledTimes(2);
    });
  });

  describe("annyang.addCallback('resultMatch')", function() {
    var recognition;
    var spyOnResultMatch;
    var args;
    var saveArguments = function() {
      args = arguments;
    };

    beforeEach(function() {
      args = undefined;
      annyang.debug(false);
      recognition = annyang.getSpeechRecognizer();
      spyOnResultMatch = jasmine.createSpy();
      annyang.abort();
      annyang.start();
      annyang.removeCommands();
      annyang.addCommands({
        'Time for some thrilling :action': function() {},
      });
    });

    it('should add a callback which will be called when result returned from Speech Recognition and a command was matched', function() {
      annyang.addCallback('resultMatch', spyOnResultMatch);

      expect(spyOnResultMatch).not.toHaveBeenCalled();
      recognition.say('Time for some thrilling heroics');

      expect(spyOnResultMatch).toHaveBeenCalledTimes(1);
    });

    it('should add a callback which will not be called when result returned from Speech Recognition does not match a command', function() {
      annyang.addCallback('resultMatch', spyOnResultMatch);

      expect(spyOnResultMatch).not.toHaveBeenCalled();
      recognition.say('What was my line again?');

      expect(spyOnResultMatch).not.toHaveBeenCalled();
    });

    it('should call the callback with the first argument containing the phrase the user said that matched a command', function() {
      annyang.addCallback('resultMatch', saveArguments);
      recognition.say('Time for some thrilling heroics');

      expect(args[0]).toEqual('Time for some thrilling heroics');
    });

    it('should call the callback with the first argument containing the phrase the user said that matched a command', function() {
      annyang.addCallback('resultMatch', saveArguments);
      recognition.say('Time for some thrilling heroics');

      expect(args[0]).toEqual('Time for some thrilling heroics');
    });

    it('should call the callback with the second argument containing the matched command', function() {
      annyang.addCallback('resultMatch', saveArguments);
      recognition.say('Time for some thrilling heroics');

      expect(args[1]).toEqual('Time for some thrilling :action');
    });

    it('should call the callback with the third argument containing an array of all possible Speech Recognition Alternatives the user may have said', function() {
      annyang.addCallback('resultMatch', saveArguments);
      recognition.say('Time for some thrilling heroics');

      expect(typeof args[2]).toEqual('object');
      expect(args[2][0]).toEqual('Time for some thrilling heroics');
      expect(args[2][1]).toEqual('Time for some thrilling heroics and so on');
      expect(args[2][2]).toEqual(
        'Time for some thrilling heroics and so on and so on'
      );
    });
  });

  describe("annyang.addCallback('resultNoMatch')", function() {
    var recognition;
    var spyOnResultNoMatch;
    var args;
    var saveArguments = function() {
      args = arguments;
    };

    beforeEach(function() {
      args = undefined;
      annyang.debug(false);
      recognition = annyang.getSpeechRecognizer();
      spyOnResultNoMatch = jasmine.createSpy();
      annyang.abort();
      annyang.start();
      annyang.removeCommands();
      annyang.addCommands({
        'Time for some thrilling heroics': function() {},
      });
    });

    it('should add a callback which will be called when result returned from Speech Recognition but no commands were matched', function() {
      annyang.addCallback('resultNoMatch', spyOnResultNoMatch);

      expect(spyOnResultNoMatch).not.toHaveBeenCalled();
      recognition.say('That sounds like something out of science fiction');

      expect(spyOnResultNoMatch).toHaveBeenCalledTimes(1);
    });

    it('should add a callback which will not be called when result returned from Speech Recognition matches a command', function() {
      annyang.addCallback('resultNoMatch', spyOnResultNoMatch);

      expect(spyOnResultNoMatch).not.toHaveBeenCalled();
      recognition.say('Time for some thrilling heroics');

      expect(spyOnResultNoMatch).not.toHaveBeenCalled();
    });

    it('should call the callback with the first argument containing an array of all possible Speech Recognition Alternatives the user may have said', function() {
      annyang.addCallback('resultNoMatch', saveArguments);
      recognition.say('That sounds like something out of science fiction');

      expect(typeof args[0]).toEqual('object');
      expect(args[0][0]).toEqual(
        'That sounds like something out of science fiction'
      );

      expect(args[0][1]).toEqual(
        'That sounds like something out of science fiction and so on'
      );

      expect(args[0][2]).toEqual(
        'That sounds like something out of science fiction and so on and so on'
      );
    });
  });

  describe("annyang.addCallback('result')", function() {
    var recognition;
    var spyOnResult;
    var args;
    var saveArguments = function() {
      args = arguments;
    };

    beforeEach(function() {
      annyang.debug(false);
      recognition = annyang.getSpeechRecognizer();
      spyOnResult = jasmine.createSpy();
      annyang.abort();
      annyang.start();
      annyang.removeCommands();
      annyang.addCommands({
        'Time for some thrilling heroics': function() {},
      });
    });

    it('should add a callback which will be called when result returned from Speech Recognition and a command was matched', function() {
      annyang.addCallback('result', spyOnResult);

      expect(spyOnResult).not.toHaveBeenCalled();
      recognition.say('Time for some thrilling heroics');

      expect(spyOnResult).toHaveBeenCalledTimes(1);
    });

    it('should add a callback which will be called when result returned from Speech Recognition and a command was not matched', function() {
      annyang.addCallback('result', spyOnResult);

      expect(spyOnResult).not.toHaveBeenCalled();
      recognition.say('That sounds like something out of science fiction');

      expect(spyOnResult).toHaveBeenCalledTimes(1);
    });

    it('should call the callback with the first argument containing an array of all possible Speech Recognition Alternatives the user may have said', function() {
      annyang.addCallback('result', saveArguments);
      recognition.say('That sounds like something out of science fiction');

      expect(typeof args[0]).toEqual('object');
      expect(args[0][0]).toEqual(
        'That sounds like something out of science fiction'
      );

      expect(args[0][1]).toEqual(
        'That sounds like something out of science fiction and so on'
      );

      expect(args[0][2]).toEqual(
        'That sounds like something out of science fiction and so on and so on'
      );
    });
  });

  describe('annyang.addCommands', function() {
    var recognition;

    beforeEach(function() {
      annyang.debug(false);
      annyang.abort();
      annyang.removeCommands();
      recognition = annyang.getSpeechRecognizer();
      spyOn(console, 'log');
      annyang.start();
    });

    it('should match commands when a sentence is recognized and call the callback', function() {
      var spyOnMatch = jasmine.createSpy();
      annyang.addCommands({ 'Time for some thrilling heroics': spyOnMatch });

      expect(spyOnMatch).not.toHaveBeenCalled();
      recognition.say('Time for some thrilling heroics');

      expect(spyOnMatch).toHaveBeenCalledTimes(1);
    });

    it('should match commands even if a recognition is not the first SpeechRecognitionAlternative', function() {
      var spyOnMatch = jasmine.createSpy();
      // For this test, the command text is what we will be saying plus 'and so on'.
      // This is the structure of alternative text recognitions in Corti.
      annyang.addCommands({
        'Time for some thrilling heroics and so on': spyOnMatch,
      });

      expect(spyOnMatch).not.toHaveBeenCalled();
      recognition.say('Time for some thrilling heroics');

      expect(spyOnMatch).toHaveBeenCalledTimes(1);
    });

    it('should write to console when a command matches if debug is on', function() {
      annyang.addCommands({
        'Time for some thrilling heroics': function() {},
      });
      annyang.start();
      annyang.debug(true);

      expect(console.log).not.toHaveBeenCalled();
      recognition.say('Time for some thrilling heroics');

      expect(console.log).toHaveBeenCalledTimes(2); // 1 console log for speech recognized + 1 for the command matching
      expect(console.log).toHaveBeenCalledWith(
        'command matched: %cTime for some thrilling heroics',
        'font-weight: bold; color: #00f;'
      );
    });

    it('should not write to console when a command matches if debug is off', function() {
      annyang.addCommands({
        'Time for some thrilling heroics': function() {},
      });
      annyang.start();
      annyang.debug(false);
      recognition.say('Time for some thrilling heroics');

      expect(console.log).not.toHaveBeenCalled();
    });

    it('should write to console with argument matched when command with an argument matches if debug is on', function() {
      annyang.addCommands({
        'Time for some thrilling :action': function() {},
      });
      annyang.start();
      annyang.debug(true);

      expect(console.log).not.toHaveBeenCalled();
      recognition.say('Time for some thrilling heroics');

      expect(console.log).toHaveBeenCalledTimes(3); // 1 console log for speech recognized + 1 for the command matching + 1 for the parameter
      expect(console.log).toHaveBeenCalledWith(
        'command matched: %cTime for some thrilling :action',
        'font-weight: bold; color: #00f;'
      );

      expect(console.log).toHaveBeenCalledWith('with parameters', ['heroics']);
    });

    it('should not write to console the argument matched when command with an argument matches if debug is off', function() {
      annyang.addCommands({
        'Time for some thrilling :action': function() {},
      });
      annyang.start();
      annyang.debug(false);
      recognition.say('Time for some thrilling heroics');

      expect(console.log).not.toHaveBeenCalled();
    });

    it('should ignore commands in subsequent addCommands calls with existing command texts', function() {
      var spyOnMatch1 = jasmine.createSpy();
      var spyOnMatch2 = jasmine.createSpy();
      annyang.addCommands({
        'Time for some thrilling heroics': spyOnMatch1,
      });
      annyang.addCommands({
        'Time for some thrilling heroics': spyOnMatch2,
      });

      expect(spyOnMatch1).not.toHaveBeenCalled();
      expect(spyOnMatch2).not.toHaveBeenCalled();
      recognition.say('Time for some thrilling heroics');

      expect(spyOnMatch1).toHaveBeenCalledTimes(1);
      expect(spyOnMatch2).not.toHaveBeenCalled();
    });

    it("should accept callbacks in commands object by reference. e.g. {'hello': helloFunc}", function() {
      var spyOnMatch = jasmine.createSpy();
      annyang.addCommands({
        'Time for some thrilling heroics': spyOnMatch,
      });

      expect(spyOnMatch).not.toHaveBeenCalled();
      recognition.say('Time for some thrilling heroics');

      expect(spyOnMatch).toHaveBeenCalledTimes(1);
    });

    it("should accept callbacks in commands object by name. e.g. {'hello': 'helloFunc'}", function() {
      window.globalSpy = jasmine.createSpy();
      annyang.addCommands({
        'Time for some thrilling heroics': 'globalSpy',
      });

      expect(window.globalSpy).not.toHaveBeenCalled();
      recognition.say('Time for some thrilling heroics');

      expect(window.globalSpy).toHaveBeenCalledTimes(1);
    });

    it('should accept commands with an object as the value which consists of a regexp and callback', function() {
      expect(function() {
        annyang.addCommands({
          'It is time': {
            regexp: /\w* for some thrilling.*/,
            callback: function() {},
          },
        });
      }).not.toThrowError();
    });

    it('should match commands passed as an object as the value which consists of a regexp and callback', function() {
      var spyOnMatch = jasmine.createSpy();
      annyang.addCommands({
        'It is time': {
          regexp: /\w* for some thrilling.*/,
          callback: spyOnMatch,
        },
      });

      expect(spyOnMatch).not.toHaveBeenCalled();
      recognition.say('Time for some thrilling heroics');

      expect(spyOnMatch).toHaveBeenCalledTimes(1);
    });

    it('should pass variables from regexp capturing groups to the callback function', function() {
      var capture1 = '';
      var capture2 = '';
      var getVariablesCaptured = function(s1, s2) {
        capture1 = s1;
        capture2 = s2;
      };

      annyang.addCommands({
        'It is time': {
          regexp: /Time for some (\w*) (\w*)/,
          callback: getVariablesCaptured,
        },
      });
      recognition.say('Time for some thrilling heroics');

      expect(capture1).toEqual('thrilling');
      expect(capture2).toEqual('heroics');
    });

    it('should match commands with a named variable as the last word in the sentence', function() {
      var spyOnMatch = jasmine.createSpy();
      annyang.addCommands({
        'Time for some thrilling :stuff': spyOnMatch,
      });
      recognition.say('Time for some thrilling heroics');

      expect(spyOnMatch).toHaveBeenCalledTimes(1);
    });

    it('should match match commands with a named variable in the middle of the sentence', function() {
      var spyOnMatch = jasmine.createSpy();
      annyang.addCommands({
        'Time for some :description heroics': spyOnMatch,
      });
      recognition.say('Time for some thrilling heroics');

      expect(spyOnMatch).toHaveBeenCalledTimes(1);
    });

    it('should not match commands with more than one word in the position of a named variable', function() {
      var spyOnMatch = jasmine.createSpy();
      annyang.addCommands({
        'Time for some :description heroics': spyOnMatch,
      });
      recognition.say('Time for some thrilling and fun heroics');

      expect(spyOnMatch).not.toHaveBeenCalled();
    });

    it('should not match commands with nothing in the position of a named variable', function() {
      var spyOnMatch = jasmine.createSpy();
      annyang.addCommands({
        'Time for some :description heroics': spyOnMatch,
      });
      recognition.say('Time for some heroics');

      expect(spyOnMatch).not.toHaveBeenCalled();
    });

    it('should pass named variables to the callback function', function() {
      var capture = '';
      var getVariablesCaptured = function(s) {
        capture = s;
      };
      annyang.addCommands({
        'Time for some thrilling :stuff': getVariablesCaptured,
      });
      recognition.say('Time for some thrilling heroics');

      expect(capture).toEqual('heroics');
    });

    it('should match commands with splats', function() {
      var spyOnMatch = jasmine.createSpy();
      annyang.addCommands({
        'Time for some *stuff': spyOnMatch,
      });
      recognition.say('Time for some thrilling heroics');

      expect(spyOnMatch).toHaveBeenCalledTimes(1);
    });

    it('should pass splats to the callback function', function() {
      var capture = '';
      var getVariablesCaptured = function(s) {
        capture = s;
      };
      annyang.addCommands({
        'Time for some *stuff': getVariablesCaptured,
      });
      recognition.say('Time for some thrilling heroics');

      expect(capture).toEqual('thrilling heroics');
    });

    it('should match commands with optional words when the word is in the sentence', function() {
      var spyOnMatch = jasmine.createSpy();
      annyang.addCommands({
        'Time for some (thrilling) heroics': spyOnMatch,
      });
      recognition.say('Time for some thrilling heroics');

      expect(spyOnMatch).toHaveBeenCalledTimes(1);
    });

    it('should match commands with optional words when the word is not in the sentence', function() {
      var spyOnMatch = jasmine.createSpy();
      annyang.addCommands({
        'Time for some (thrilling) heroics': spyOnMatch,
      });
      recognition.say('Time for some heroics');

      expect(spyOnMatch).toHaveBeenCalledTimes(1);
    });

    it('should not match commands with optional words when a different word is in the sentence', function() {
      var spyOnMatch = jasmine.createSpy();
      annyang.addCommands({
        'Time for some (thrilling) heroics': spyOnMatch,
      });
      recognition.say('Time for some gorram heroics');

      expect(spyOnMatch).not.toHaveBeenCalled();
    });

    it('should not break when a command is removed by another command being called', function() {
      var commands = {
        Malcolm: function() {
          annyang.removeCommands();
        },
        Wash: function() {
          annyang.removeCommands('Malcolm');
        },
      };

      annyang.addCommands(commands);

      expect(function() {
        recognition.say('Malcolm');
      }).not.toThrowError();

      annyang.removeCommands();
      annyang.addCommands(commands);

      expect(function() {
        recognition.say('Wash');
      }).not.toThrowError();
    });

    it('should not break when a command is added by another command being called', function() {
      var commands = {
        Malcolm: function() {
          annyang.addCommands({ Zoe: function() {} });
        },
      };
      annyang.addCommands(commands);

      expect(function() {
        recognition.say('Malcolm');
      }).not.toThrowError();
    });
  });

  describe('annyang.pause', function() {
    var recognition;
    var spyOnMatch;

    beforeEach(function() {
      annyang.debug(false);
      spyOnMatch = jasmine.createSpy();
      annyang.abort();
      annyang.removeCommands();
      annyang.addCommands({
        'Time for some thrilling heroics': spyOnMatch,
      });
      annyang.start();
      recognition = annyang.getSpeechRecognizer();
      spyOn(console, 'log');
    });

    it('should cause a debug message if speech detected while paused and debug is on', function() {
      annyang.debug(true);

      expect(console.log).not.toHaveBeenCalled();
      annyang.pause();
      recognition.say('Time for some thrilling heroics');

      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith(
        'Speech heard, but annyang is paused'
      );
    });

    it('should not cause a debug message if speech detected while paused but debug is off', function() {
      annyang.debug(false);

      expect(console.log).not.toHaveBeenCalled();
      annyang.pause();
      recognition.say('Time for some thrilling heroics');

      expect(console.log).not.toHaveBeenCalled();
    });

    it("should not stop the browser's Speech Recognition engine", function() {
      expect(recognition.isStarted()).toBe(true);
      annyang.pause();

      expect(recognition.isStarted()).toBe(true);
    });

    it('should leave annyang paused if called after annyang.abort()', function() {
      expect(annyang.isListening()).toBe(true);
      annyang.abort();

      expect(annyang.isListening()).toBe(false);
      annyang.pause();

      expect(annyang.isListening()).toBe(false);
    });

    it("should leave the browser's Speech Recognition off, if called after annyang.abort()", function() {
      expect(recognition.isStarted()).toBe(true);
      annyang.abort();

      expect(recognition.isStarted()).toBe(false);
      annyang.pause();

      expect(recognition.isStarted()).toBe(false);
    });
  });

  describe('annyang.resume', function() {
    var recognition;
    var spyOnMatch;

    beforeEach(function() {
      annyang.debug(false);
      spyOnMatch = jasmine.createSpy();
      annyang.abort();
      annyang.removeCommands();
      annyang.addCommands({
        'Time for some thrilling heroics': spyOnMatch,
      });
      recognition = annyang.getSpeechRecognizer();
      spyOn(console, 'log');
    });

    it('should return undefined when called', function() {
      expect(annyang.resume()).toEqual(undefined);
    });

    it('should leave speech recognition on and turn annyang on, if called when annyang is paused', function() {
      annyang.start();
      annyang.pause();

      expect(annyang.isListening()).toBe(false);
      expect(recognition.isStarted()).toBe(true);
      annyang.resume();

      expect(annyang.isListening()).toBe(true);
      expect(recognition.isStarted()).toBe(true);
    });

    it('should turn speech recognition and annyang on, if called when annyang is stopped', function() {
      expect(annyang.isListening()).toBe(false);
      expect(recognition.isStarted()).toBe(false);
      annyang.resume();

      expect(annyang.isListening()).toBe(true);
      expect(recognition.isStarted()).toBe(true);
    });

    it('should leave speech recognition and annyang on, if called when annyang is listening', function() {
      annyang.start();

      expect(annyang.isListening()).toBe(true);
      expect(recognition.isStarted()).toBe(true);
      annyang.resume();

      expect(annyang.isListening()).toBe(true);
      expect(recognition.isStarted()).toBe(true);
    });

    it('should log a message if debug is on, and resume was called when annyang is listening', function() {
      annyang.debug(true);
      annyang.start();
      annyang.resume();

      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith(
        "Failed to execute 'start' on 'SpeechRecognition': recognition has already started."
      );
    });

    it('should not log a message if debug is off, and resume was called when annyang is listening', function() {
      annyang.debug(false);
      annyang.start();
      annyang.resume();

      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('annyang.trigger', function() {
    var spyOnCommand;
    var spyOnResult;
    var spyOnResultMatch;
    var spyOnResultNoMatch;
    var sentence1 = 'Time for some thrilling heroics';
    var sentence2 = 'That sounds like something out of science fiction';

    beforeEach(function() {
      annyang.debug(false);
      spyOnCommand = jasmine.createSpy();
      spyOnResult = jasmine.createSpy();
      spyOnResultMatch = jasmine.createSpy();
      spyOnResultNoMatch = jasmine.createSpy();
      annyang.abort();
      annyang.start();
      annyang.removeCommands();
      annyang.addCommands({
        'Time for some :type heroics': spyOnCommand,
      });
      spyOn(console, 'log');
    });

    it('should accept a string with a word or sentence as the first argument', function() {
      expect(annyang.trigger(sentence1)).toEqual(undefined);
    });

    it('should accept an array of strings, each with a word or sentence as the first argument', function() {
      expect(annyang.trigger([sentence1, sentence1 + ' and so on'])).toEqual(
        undefined
      );
    });

    it('should match a sentence passed as a string to a command and execute it as if it was passed from Speech Recognition', function() {
      expect(spyOnCommand).not.toHaveBeenCalled();
      annyang.trigger(sentence1);

      expect(spyOnCommand).toHaveBeenCalledTimes(1);
    });

    it('should match a sentence passed in an array to a command and execute it as if it was passed from Speech Recognition', function() {
      expect(spyOnCommand).not.toHaveBeenCalled();
      annyang.trigger([sentence1 + ' and so on', sentence1]);

      expect(spyOnCommand).toHaveBeenCalledTimes(1);
    });

    it('should trigger a result event', function() {
      annyang.addCallback('result', spyOnResult);

      expect(spyOnResult).not.toHaveBeenCalled();
      annyang.trigger(sentence1);

      expect(spyOnResult).toHaveBeenCalledTimes(1);
    });

    it('should trigger a resultMatch event if sentence matches a command', function() {
      annyang.addCallback('resultMatch', spyOnResultMatch);

      expect(spyOnResultMatch).not.toHaveBeenCalled();
      annyang.trigger(sentence1);

      expect(spyOnResultMatch).toHaveBeenCalledTimes(1);
    });

    it('should trigger a resultNoMatch event if sentence does not match a command', function() {
      annyang.addCallback('resultNoMatch', spyOnResultNoMatch);

      expect(spyOnResultNoMatch).not.toHaveBeenCalled();
      annyang.trigger(sentence2);

      expect(spyOnResultNoMatch).toHaveBeenCalledTimes(1);
    });

    it('should not trigger a matching command if annyang is aborted or not started', function() {
      expect(spyOnCommand).not.toHaveBeenCalled();
      annyang.abort();
      annyang.trigger(sentence1);

      expect(spyOnCommand).not.toHaveBeenCalled();
    });

    it('should not trigger a matching command if annyang is paused', function() {
      expect(spyOnCommand).not.toHaveBeenCalled();
      annyang.pause();
      annyang.trigger(sentence1);

      expect(spyOnCommand).not.toHaveBeenCalled();
    });

    it('should log to console if attemting to trigger a command while annyang is aborted or not started', function() {
      annyang.debug(true);
      annyang.abort();

      expect(console.log).not.toHaveBeenCalled();
      annyang.trigger(sentence1);

      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith(
        'Cannot trigger while annyang is aborted'
      );
    });

    it('should not log to console if attemting to trigger a command while annyang is aborted or not started and debug is off', function() {
      annyang.debug(false);
      annyang.abort();
      annyang.trigger(sentence1);

      expect(console.log).not.toHaveBeenCalled();
    });
  });

  describe('annyang', function() {
    var recognition;

    beforeEach(function() {
      jasmine.clock().install();
      annyang.debug(false);
      annyang.abort();
      annyang.removeCommands();
      recognition = annyang.getSpeechRecognizer();
      spyOn(console, 'log');
    });

    afterEach(function() {
      jasmine.clock().tick(2000);
      jasmine.clock().uninstall();
    });

    it('should write to console each speech recognition alternative that is recognized when no command matches', function() {
      annyang.start();
      annyang.debug(true);

      expect(console.log).not.toHaveBeenCalled();
      recognition.say('Time for some thrilling heroics');

      expect(console.log).toHaveBeenCalledTimes(5);
      expect(console.log).toHaveBeenCalledWith(
        'Speech recognized: %cTime for some thrilling heroics',
        'font-weight: bold; color: #00f;'
      );

      expect(console.log).toHaveBeenCalledWith(
        'Speech recognized: %cTime for some thrilling heroics and so on',
        'font-weight: bold; color: #00f;'
      );

      expect(console.log).toHaveBeenCalledWith(
        'Speech recognized: %cTime for some thrilling heroics and so on and so on',
        'font-weight: bold; color: #00f;'
      );

      expect(console.log).toHaveBeenCalledWith(
        'Speech recognized: %cTime for some thrilling heroics and so on and so on and so on',
        'font-weight: bold; color: #00f;'
      );

      expect(console.log).toHaveBeenCalledWith(
        'Speech recognized: %cTime for some thrilling heroics and so on and so on and so on and so on',
        'font-weight: bold; color: #00f;'
      );
    });

    it('should not write to console the speech recognition alternatives when no command matches and debug is off', function() {
      annyang.start();
      annyang.debug(false);
      recognition.say('Time for some thrilling heroics');

      expect(console.log).not.toHaveBeenCalled();
    });

    it('should write to console each speech recognition alternative that is recognized, until a command is matched', function() {
      annyang.addCommands({
        'Time for some thrilling heroics and so on': function() {},
      });
      annyang.start();
      annyang.debug(true);

      expect(console.log).not.toHaveBeenCalled();
      recognition.say('Time for some thrilling heroics');

      expect(console.log).toHaveBeenCalledTimes(3); // 2 console logs for speech recognized + 1 for the command matching
      expect(console.log).toHaveBeenCalledWith(
        'Speech recognized: %cTime for some thrilling heroics',
        'font-weight: bold; color: #00f;'
      );

      expect(console.log).toHaveBeenCalledWith(
        'Speech recognized: %cTime for some thrilling heroics and so on',
        'font-weight: bold; color: #00f;'
      );
    });

    it('should not write to console speech recognition alternatives when debug is off', function() {
      annyang.addCommands({
        'Time for some thrilling heroics and so on': function() {},
      });
      annyang.start();
      annyang.debug(false);
      recognition.say('Time for some thrilling heroics');

      expect(console.log).not.toHaveBeenCalled();
    });

    it('should recognize when Speech Recognition engine was aborted', function() {
      annyang.start();

      expect(annyang.isListening()).toBe(true);
      recognition.abort();

      expect(annyang.isListening()).toBe(false);
    });

    it('should recognize when Speech Recognition engine is repeatedly aborted as soon as it is started and console.log about it once every 10 seconds', function() {
      recognition.addEventListener('start', function() {
        setTimeout(function() {
          recognition.abort();
        }, 1);
      });
      annyang.start();
      annyang.debug(true);
      jasmine.clock().tick(20000);

      expect(console.log).toHaveBeenCalledTimes(2);
      expect(console.log).toHaveBeenCalledWith(
        'Speech Recognition is repeatedly stopping and starting. See http://is.gd/annyang_restarts for tips.'
      );
    });

    it('should not log to console when Speech Recognition engine is repeatedly aborted if debug is off', function() {
      recognition.addEventListener('start', function() {
        setTimeout(function() {
          recognition.abort();
        }, 1);
      });
      annyang.start();
      annyang.debug(false);
      jasmine.clock().tick(20000);

      expect(console.log).not.toHaveBeenCalled();
    });
  });
});
