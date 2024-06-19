//! annyang
//! version : 3.0.0-dev
//! author  : Tal Ater @TalAter
//! license : MIT
//! https://www.TalAter.com/annyang/
'use strict';

/**
 * # Quick Tutorial, Intro, and Demos
 *
 * The quickest way to get started is to visit the [annyang homepage](https://www.talater.com/annyang/).
 *
 * For a more in-depth look at annyang, read on.
 *
 * # API Reference
 */

// Get the SpeechRecognition object, accounting for possible browser prefixes
const SpeechRecognition =
  globalThis.SpeechRecognition ||
  globalThis.webkitSpeechRecognition ||
  globalThis.mozSpeechRecognition ||
  globalThis.msSpeechRecognition ||
  globalThis.oSpeechRecognition;

const annyang = {
  isSpeechRecognitionSupported: () => !!SpeechRecognition,
};

// Check if SpeechRecognition is supported by the browser. Skip adding anything to annyang besides `isSpeechRecognitionSupported` if it isn't
if (SpeechRecognition) {
  let commandsList = [];
  let recognition;
  const callbacks = {
    start: [],
    error: [],
    end: [],
    soundstart: [],
    result: [],
    resultMatch: [],
    resultNoMatch: [],
    errorNetwork: [],
    errorPermissionBlocked: [],
    errorPermissionDenied: [],
  };
  let autoRestart = true;
  let lastStartedAt = 0;
  let autoRestartCount = 0;
  let debugState = false;
  const debugStyle = 'font-weight: bold; color: #00f;';
  let pauseListening = false;
  let isListening = false;

  // The command matching code is a modified version of Backbone.Router by Jeremy Ashkenas, under the MIT license.
  const optionalParam = /\s*\((.*?)\)\s*/g;
  const optionalRegex = /(\(\?:[^)]+\))\?/g;
  const namedParam = /(\(\?)?:\w+/g;
  const splatParam = /\*\w+/g;
  const escapeRegExp = /[-{}[\]+?.,\\^$|#]/g;
  const commandToRegExp = command => {
    const parsedCommand = command
      .replace(escapeRegExp, '\\$&')
      .replace(optionalParam, '(?:$1)?')
      .replace(namedParam, (match, optional) => {
        return optional ? match : '([^\\s]+)';
      })
      .replace(splatParam, '(.*?)')
      .replace(optionalRegex, '\\s*$1?\\s*');
    return new RegExp(`^${parsedCommand}$`, 'i');
  };

  // This method receives an array of callbacks and invokes each of them
  const invokeCallbacks = (callbacksArr, ...args) => {
    callbacksArr.forEach(callback => {
      callback.callback.apply(callback.context, args);
    });
  };

  const isInitialized = () => {
    return recognition !== undefined;
  };

  // Method for logging to the console when debug mode is on
  const logMessage = (text, extraParameters) => {
    if (text.indexOf('%c') === -1 && !extraParameters) {
      console.log(text);
    } else {
      console.log(text, extraParameters || debugStyle);
    }
  };

  const initIfNeeded = () => {
    if (!isInitialized()) {
      annyang.init({}, false);
    }
  };

  const registerCommand = (command, callback, originalPhrase) => {
    commandsList.push({ command, callback, originalPhrase });
    if (debugState) {
      logMessage(`Command successfully loaded: %c${originalPhrase}`, debugStyle);
    }
  };

  const parseResults = function (recognitionResults) {
    invokeCallbacks(callbacks.result, recognitionResults);
    let commandText;
    // go over each of the RecognitionResults received (maxAlternatives is set to 5)
    for (let i = 0; i < recognitionResults.length; i += 1) {
      // the text recognized
      commandText = recognitionResults[i].trim();
      if (debugState) {
        logMessage(`Speech recognized: %c${commandText}`, debugStyle);
      }

      // try and match the recognized text to one of the commands on the list
      for (let j = 0, l = commandsList.length; j < l; j += 1) {
        const currentCommand = commandsList[j];
        const matchedCommand = currentCommand.command.exec(commandText);
        if (matchedCommand) {
          const parameters = matchedCommand.slice(1);
          if (debugState) {
            logMessage(`command matched: %c${currentCommand.originalPhrase}`, debugStyle);
            if (parameters.length) {
              logMessage('with parameters', parameters);
            }
          }
          // execute the matched command
          currentCommand.callback.apply(this, parameters);
          invokeCallbacks(callbacks.resultMatch, commandText, currentCommand.originalPhrase, recognitionResults);
          return;
        }
      }
    }
    invokeCallbacks(callbacks.resultNoMatch, recognitionResults);
  };

  /**
   * Add commands that annyang will respond to. Similar in syntax to init(), but doesn't remove existing commands.
   *
   * #### Examples:
   * ````javascript
   * const commands = {'hello :name': helloFunction, 'howdy': helloFunction};
   * const commands2 = {'hi': helloFunction};
   *
   * annyang.addCommands(commands);
   * annyang.addCommands(commands2);
   * // annyang will now listen for all three commands
   * ````
   *
   * @param {Object} commands - Commands that annyang should listen for
   * @method addCommands
   * @see [Commands Object](#commands-object)
   */
  annyang.addCommands = commands => {
    initIfNeeded();

    Object.keys(commands).forEach(phrase => {
      const cb = window[commands[phrase]] || commands[phrase];
      if (typeof cb === 'function') {
        // convert command to regex then register the command
        registerCommand(commandToRegExp(phrase), cb, phrase);
      } else if (typeof cb === 'object' && cb.regexp instanceof RegExp) {
        // register the command
        registerCommand(new RegExp(cb.regexp.source, 'i'), cb.callback, phrase);
      } else if (debugState) {
        logMessage(`Can not register command: %c${phrase}`, debugStyle);
      }
    });
  };

  /**
   * Start listening.
   * It's a good idea to call this after adding some commands first (but not mandatory)
   *
   * Receives an optional options object which supports the following options:
   *
   * - `autoRestart`  (boolean) Should annyang restart itself if it is closed indirectly, because of silence or window conflicts?
   * - `continuous`   (boolean) Allow forcing continuous mode on or off. annyang is pretty smart about this, so only set this if you know what you're doing.
   * - `paused`       (boolean) Start annyang in paused mode.
   *
   * #### Examples:
   * ````javascript
   * // Start listening, don't restart automatically
   * annyang.start({ autoRestart: false });
   * // Start listening, don't restart automatically, stop recognition after first phrase recognized
   * annyang.start({ autoRestart: false, continuous: false });
   * ````
   * @param {Object} [options] - Optional options.
   * @method start
   */
  annyang.start = (options = {}) => {
    initIfNeeded();
    if (options.paused !== undefined) {
      pauseListening = !!options.paused;
    } else {
      pauseListening = false;
    }
    if (options.autoRestart !== undefined) {
      autoRestart = !!options.autoRestart;
    }
    if (options.continuous !== undefined) {
      recognition.continuous = !!options.continuous;
    }

    lastStartedAt = new Date().getTime();
    try {
      recognition.start();
    } catch (e) {
      if (debugState) {
        logMessage(e.message);
      }
    }
  };

  /**
   * Stop listening and turn off the mic.
   *
   * Alternatively, to only temporarily pause annyang responding to commands without stopping the SpeechRecognition engine or closing the mic, use pause() instead.
   * @see [pause()](#pause)
   *
   * @method abort
   */
  annyang.abort = () => {
    autoRestart = false;
    autoRestartCount = 0;
    if (isInitialized()) {
      recognition.abort();
    }
  };

  /**
   * Pause listening. annyang will stop responding to commands (until the resume or start methods are called), without turning off the browser's SpeechRecognition engine or the mic.
   *
   * Alternatively, to stop the SpeechRecognition engine and close the mic, use abort() instead.
   * @see [abort()](#abort)
   *
   * @method pause
   */
  annyang.pause = () => {
    pauseListening = true;
  };

  /**
   * Resumes listening and restore command callback execution when a command is matched.
   * If SpeechRecognition was aborted (stopped), start it.
   *
   * @method resume
   */
  annyang.resume = () => {
    annyang.start();
  };

  /**
   * Turn on the output of debug messages to the console. Ugly, but super-handy!
   *
   * @param {boolean} [newState=true] - Turn on/off debug messages
   * @method debug
   */
  annyang.debug = (newState = true) => {
    debugState = !!newState;
  };

  /**
   * Set the language the user will speak in. If this method is not called, defaults to 'en-US'.
   *
   * @param {string} language - The language (locale)
   * @method setLanguage
   * @see [Languages](https://github.com/TalAter/annyang/blob/master/docs/FAQ.md#what-languages-are-supported)
   */
  annyang.setLanguage = language => {
    initIfNeeded();
    recognition.lang = language;
  };

  /**
   * Remove existing commands. Called with a single phrase, an array of phrases, or methodically. Pass no params to remove all commands.
   *
   * #### Examples:
   * ````javascript
   * const commands = {'hello': helloFunction, 'howdy': helloFunction, 'hi': helloFunction};
   *
   * // Remove all existing commands
   * annyang.removeCommands();
   *
   * // Add some commands
   * annyang.addCommands(commands);
   *
   * // Don't respond to hello
   * annyang.removeCommands('hello');
   *
   * // Don't respond to howdy or hi
   * annyang.removeCommands(['howdy', 'hi']);
   * ````
   * @param {string|string[]|undefined} [commandsToRemove] - Commands to remove
   * @method removeCommands
   */
  annyang.removeCommands = commandsToRemove => {
    if (commandsToRemove === undefined) {
      commandsList.length = 0;
    } else {
      const commandsToRemoveArray = Array.isArray(commandsToRemove) ? commandsToRemove : [commandsToRemove];
      commandsList = commandsList.filter(command => !commandsToRemoveArray.includes(command.originalPhrase));
    }
  };

  /**
   * Add a callback function to be called in case one of the following events happens:
   *
   * * `start` - Fired as soon as the browser's Speech Recognition engine starts listening.
   *
   * * `soundstart` - Fired as soon as any sound (possibly speech) has been detected.
   *
   *     This will fire once per Speech Recognition starting. See https://is.gd/annyang_sound_start.
   *
   * * `error` - Fired when the browser's Speech Recognition engine returns an error, this generic error callback will be followed by more accurate error callbacks (both will fire if both are defined).
   *
   *     The Callback function will be called with the error event as the first argument.
   *
   * * `errorNetwork` - Fired when Speech Recognition fails because of a network error.
   *
   *     The Callback function will be called with the error event as the first argument.
   *
   * * `errorPermissionBlocked` - Fired when the browser blocks the permission request to use Speech Recognition.
   *
   *     The Callback function will be called with the error event as the first argument.
   *
   * * `errorPermissionDenied` - Fired when the user blocks the permission request to use Speech Recognition.
   *
   *     The Callback function will be called with the error event as the first argument.
   *
   * * `end` - Fired when the browser's Speech Recognition engine stops.
   *
   * * `result` - Fired as soon as some speech was identified. This generic callback will be followed by either the `resultMatch` or `resultNoMatch` callbacks.
   *
   *     The Callback functions for this event will be called with an array of possible phrases the user said as the first argument.
   *
   * * `resultMatch` - Fired when annyang was able to match between what the user said and a registered command.
   *
   *     The Callback functions for this event will be called with three arguments in the following order:
   *
   *     * The phrase the user said that matched a command.
   *     * The command that was matched.
   *     * An array of possible alternative phrases the user might have said.
   *
   * * `resultNoMatch` - Fired when what the user said didn't match any of the registered commands.
   *
   *     Callback functions for this event will be called with an array of possible phrases the user might have said as the first argument.
   *
   * #### Examples:
   * ````javascript
   * annyang.addCallback('error', () => {
   *   $('.myErrorText').text('There was an error!');
   * });
   *
   * annyang.addCallback('resultMatch', (userSaid, commandText, phrases) => {
   *   console.log(userSaid); // sample output: 'hello'
   *   console.log(commandText); // sample output: 'hello (there)'
   *   console.log(phrases); // sample output: ['hello', 'halo', 'yellow', 'polo', 'hello kitty']
   * });
   *
   * // pass local context to a global function called notConnected
   * annyang.addCallback('errorNetwork', notConnected, this);
   * ````
   * @param {string} type - Name of event that will trigger this callback
   * @param {function} callback - The function to call when event is triggered
   * @param {Object} [context] - Optional context for the callback function
   * @method addCallback
   */
  annyang.addCallback = (type, callback, context = undefined) => {
    const cb = window[callback] || callback;
    if (typeof cb === 'function' && callbacks[type] !== undefined) {
      callbacks[type].push({ callback: cb, context });
    }
  };

  /**
   * Remove callbacks from events.
   *
   * - Pass an event name and a callback command to remove that callback command from that event type.
   * - Pass just an event name to remove all callback commands from that event type.
   * - Pass undefined as event name and a callback command to remove that callback command from all event types.
   * - Pass no params to remove all callback commands from all event types.
   *
   * #### Examples:
   * ````javascript
   * annyang.addCallback('start', myFunction1);
   * annyang.addCallback('start', myFunction2);
   * annyang.addCallback('end', myFunction1);
   * annyang.addCallback('end', myFunction2);
   *
   * // Remove all callbacks from all events:
   * annyang.removeCallback();
   *
   * // Remove all callbacks attached to end event:
   * annyang.removeCallback('end');
   *
   * // Remove myFunction2 from being called on start:
   * annyang.removeCallback('start', myFunction2);
   *
   * // Remove myFunction1 from being called on all events:
   * annyang.removeCallback(undefined, myFunction1);
   * ````
   *
   * @param type Name of event type to remove callback from
   * @param callback The callback function to remove
   * @returns undefined
   * @method removeCallback
   */
  annyang.removeCallback = (type, callback) => {
    const compareWithCallbackParameter = cb => {
      return cb.callback !== callback;
    };
    // Iterate over each callback type in the callbacks object
    Object.keys(callbacks).forEach(callbackType => {
      // if this is the type user asked to delete, or he asked to delete all, go ahead.
      if (type === undefined || type === callbackType) {
        // If user asked to delete all callbacks in this type or all types
        if (callback === undefined) {
          callbacks[callbackType] = [];
        } else {
          // Remove all matching callbacks
          callbacks[callbackType] = callbacks[callbackType].filter(compareWithCallbackParameter);
        }
      }
    });
  };

  /**
   * Returns true if speech recognition is currently on.
   * Returns false if speech recognition is off or annyang is paused.
   *
   * @return boolean true = SpeechRecognition is on and annyang is listening
   * @method isListening
   */
  annyang.isListening = () => {
    return isListening && !pauseListening;
  };

  /**
   * Returns the instance of the browser's SpeechRecognition object used by annyang.
   * Useful in case you want direct access to the browser's Speech Recognition engine.
   *
   * @returns SpeechRecognition The browser's Speech Recognizer currently used by annyang
   * @method getSpeechRecognizer
   */
  annyang.getSpeechRecognizer = () => {
    return recognition;
  };

  /**
   * Simulate speech being recognized. This will trigger the same events and behavior as when the Speech Recognition
   * detects speech.
   *
   * Can accept either a string containing a single sentence or an array containing multiple sentences to be checked
   * in order until one of them matches a command (similar to the way Speech Recognition Alternatives are parsed)
   *
   * #### Examples:
   * ````javascript
   * annyang.trigger('Time for some thrilling heroics');
   * annyang.trigger(
   *     ['Time for some thrilling heroics', 'Time for some thrilling aerobics']
   *   );
   * ````
   *
   * @param string|string[] sentences A sentence as a string or an array of strings of possible sentences
   * @returns undefined
   * @method trigger
   */
  annyang.trigger = sentences => {
    if (!annyang.isListening()) {
      if (debugState) {
        if (!isListening) {
          logMessage('Cannot trigger while annyang is aborted');
        } else {
          logMessage('Speech heard, but annyang is paused');
        }
      }
      return;
    }

    parseResults(Array.isArray(sentences) ? sentences : [sentences]);
  };

  /**
   * Initialize annyang with a list of commands to recognize.
   *
   * #### Examples:
   * ````javascript
   * const commands = {'hello :name': helloFunction};
   * const commands2 = {'hi': helloFunction};
   *
   * // initialize annyang, overwriting any previously added commands
   * annyang.init(commands, true);
   * // adds an additional command without removing the previous commands
   * annyang.init(commands2, false);
   * ````
   * As of v1.1.0 it is no longer required to call init(). Just start() listening whenever you want, and addCommands() whenever, and as often as you like.
   *
   * @param {Object} commands - Commands that annyang should listen to
   * @param {boolean} [resetCommands=true] - Remove all commands before initializing?
   * @method init
   * @deprecated
   * @see [Commands Object](#commands-object)
   */
  annyang.init = (commands, resetCommands = true) => {
    // Abort previous instances of recognition already running
    if (recognition && recognition.abort) {
      recognition.abort();
    }

    // initiate SpeechRecognition
    recognition = new SpeechRecognition();

    // Set the max number of alternative transcripts to try and match with a command
    recognition.maxAlternatives = 5;

    // In HTTPS, turn off continuous mode for faster results.
    // In HTTP,  turn on  continuous mode for much slower results, but no repeating security notices
    recognition.continuous = globalThis.location.protocol === 'http:';

    // Sets the language to the default 'en-US'. This can be changed with annyang.setLanguage()
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      isListening = true;
      invokeCallbacks(callbacks.start);
    };

    recognition.onsoundstart = () => {
      invokeCallbacks(callbacks.soundstart);
    };

    recognition.onerror = event => {
      invokeCallbacks(callbacks.error, event);
      /* eslint-disable-next-line default-case */
      switch (event.error) {
        case 'network':
          invokeCallbacks(callbacks.errorNetwork, event);
          break;
        case 'not-allowed':
        case 'service-not-allowed':
          // if permission to use the mic is denied, turn off auto-restart
          autoRestart = false;
          // determine if permission was denied by user or automatically.
          if (new Date().getTime() - lastStartedAt < 200) {
            invokeCallbacks(callbacks.errorPermissionBlocked, event);
          } else {
            invokeCallbacks(callbacks.errorPermissionDenied, event);
          }
          break;
      }
    };

    recognition.onend = () => {
      isListening = false;
      invokeCallbacks(callbacks.end);
      // annyang will auto restart if it is closed automatically and not by user action.
      if (autoRestart) {
        // play nicely with the browser, and never restart annyang automatically more than once per second
        const timeSinceLastStart = new Date().getTime() - lastStartedAt;
        autoRestartCount += 1;
        if (autoRestartCount % 10 === 0) {
          if (debugState) {
            logMessage(
              'Speech Recognition is repeatedly stopping and starting. See http://is.gd/annyang_restarts for tips.'
            );
          }
        }
        if (timeSinceLastStart < 1000) {
          setTimeout(() => {
            annyang.start({ paused: pauseListening });
          }, 1000 - timeSinceLastStart);
        } else {
          annyang.start({ paused: pauseListening });
        }
      }
    };

    recognition.onresult = event => {
      if (pauseListening) {
        if (debugState) {
          logMessage('Speech heard, but annyang is paused');
        }
        return;
      }

      // Map the results to an array
      const SpeechRecognitionResults = event.results[event.resultIndex];
      const results = Array.from(SpeechRecognitionResults, result => result.transcript);
      parseResults(results);
    };

    // build commands list
    if (resetCommands) {
      commandsList.length = 0;
    }
    if (commands.length) {
      annyang.addCommands(commands);
    }
  };
}

/**
 * # Good to Know
 *
 * ## Commands Object
 *
 * Both the [init()]() and addCommands() methods receive a `commands` object.
 *
 * annyang understands commands with `named variables`, `splats`, and `optional words`.
 *
 * - Use `named variables` for one-word arguments in your command.
 * - Use `splats` to capture multi-word text at the end of your command (greedy).
 * - Use `optional words` or phrases to define a part of the command as optional.
 *
 * #### Examples:
 * ````html
 * <script>
 * const commands = {
 *   // annyang will capture anything after a splat (*) and pass it to the function.
 *   // For example saying "Show me Batman and Robin" will call showFlickr('Batman and Robin');
 *   'show me *tag': showFlickr,
 *
 *   // A named variable is a one-word variable, that can fit anywhere in your command.
 *   // For example saying "calculate October stats" will call calculateStats('October');
 *   'calculate :month stats': calculateStats,
 *
 *   // By defining a part of the following command as optional, annyang will respond
 *   // to both: "say hello to my little friend" as well as "say hello friend"
 *   'say hello (to my little) friend': greeting
 * };
 *
 * const showFlickr = tag => {
 *   const url = 'http://api.flickr.com/services/rest/?tags='+tag;
 *   $.getJSON(url);
 * }
 *
 * const calculateStats = month => {
 *   $('#stats').text('Statistics for '+month);
 * }
 *
 * const greeting = () => {
 *   $('#greeting').text('Hello!');
 * }
 * </script>
 * ````
 *
 * ### Using Regular Expressions in commands
 * For advanced commands, you can pass a regular expression object, instead of
 * a simple string command.
 *
 * This is done by passing an object containing two properties: `regexp`, and
 * `callback` instead of the function.
 *
 * #### Examples:
 * ````javascript
 * const calculateFunction = month => { console.log(month); }
 * const commands = {
 *   // This example will accept any word as the "month"
 *   'calculate :month stats': calculateFunction,
 *   // This example will only accept months which are at the start of a quarter
 *   'calculate :quarter stats': {'regexp': /^calculate (January|April|July|October) stats$/, 'callback': calculateFunction}
 * }
 ````
 *
 */

module.exports = annyang;