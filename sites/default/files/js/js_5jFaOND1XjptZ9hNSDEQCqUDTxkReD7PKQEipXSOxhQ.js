/**
 * @file
 * Initialize Pardot Engagement Tracker Javascript.
 */

piAId = drupalSettings.gtPardot.accountId;
piCId = drupalSettings.gtPardot.campaignId;
piHostname = drupalSettings.gtPardot.trackerDomain;

(function() {
  function async_load(){
    var s = document.createElement('script'); s.type = 'text/javascript';
    s.src = ('https:' == document.location.protocol ? 'https://pi' : 'http://cdn') + '.pardot.com/pd.js';
    var c = document.getElementsByTagName('script')[0]; c.parentNode.insertBefore(s, c);
  }
  if(window.attachEvent) { window.attachEvent('onload', async_load); }
  else { window.addEventListener('load', async_load, false); }
})();
;
/**
 * @file
 * Drupal Bootstrap object.
 */

/**
 * All Drupal Bootstrap JavaScript APIs are contained in this namespace.
 *
 * @param {underscore} _
 * @param {jQuery} $
 * @param {Drupal} Drupal
 * @param {drupalSettings} drupalSettings
 */
(function (_, $, Drupal, drupalSettings) {
  'use strict';

  /**
   * @typedef Drupal.bootstrap
   */
  var Bootstrap = {
    processedOnce: {},
    settings: drupalSettings.bootstrap || {}
  };

  /**
   * Wraps Drupal.checkPlain() to ensure value passed isn't empty.
   *
   * Encodes special characters in a plain-text string for display as HTML.
   *
   * @param {string} str
   *   The string to be encoded.
   *
   * @return {string}
   *   The encoded string.
   *
   * @ingroup sanitization
   */
  Bootstrap.checkPlain = function (str) {
    return str && Drupal.checkPlain(str) || '';
  };

  /**
   * Creates a jQuery plugin.
   *
   * @param {String} id
   *   A jQuery plugin identifier located in $.fn.
   * @param {Function} plugin
   *   A constructor function used to initialize the for the jQuery plugin.
   * @param {Boolean} [noConflict]
   *   Flag indicating whether or not to create a ".noConflict()" helper method
   *   for the plugin.
   */
  Bootstrap.createPlugin = function (id, plugin, noConflict) {
    // Immediately return if plugin doesn't exist.
    if ($.fn[id] !== void 0) {
      return this.fatal('Specified jQuery plugin identifier already exists: @id. Use Drupal.bootstrap.replacePlugin() instead.', {'@id': id});
    }

    // Immediately return if plugin isn't a function.
    if (typeof plugin !== 'function') {
      return this.fatal('You must provide a constructor function to create a jQuery plugin "@id": @plugin', {'@id': id, '@plugin':  plugin});
    }

    // Add a ".noConflict()" helper method.
    this.pluginNoConflict(id, plugin, noConflict);

    $.fn[id] = plugin;
  };

  /**
   * Diff object properties.
   *
   * @param {...Object} objects
   *   Two or more objects. The first object will be used to return properties
   *   values.
   *
   * @return {Object}
   *   Returns the properties of the first passed object that are not present
   *   in all other passed objects.
   */
  Bootstrap.diffObjects = function (objects) {
    var args = Array.prototype.slice.call(arguments);
    return _.pick(args[0], _.difference.apply(_, _.map(args, function (obj) {
      return Object.keys(obj);
    })));
  };

  /**
   * Map of supported events by regular expression.
   *
   * @type {Object<Event|MouseEvent|KeyboardEvent|TouchEvent,RegExp>}
   */
  Bootstrap.eventMap = {
    Event: /^(?:load|unload|abort|error|select|change|submit|reset|focus|blur|resize|scroll)$/,
    MouseEvent: /^(?:click|dblclick|mouse(?:down|enter|leave|up|over|move|out))$/,
    KeyboardEvent: /^(?:key(?:down|press|up))$/,
    TouchEvent: /^(?:touch(?:start|end|move|cancel))$/
  };

  /**
   * Extends a jQuery Plugin.
   *
   * @param {String} id
   *   A jQuery plugin identifier located in $.fn.
   * @param {Function} callback
   *   A constructor function used to initialize the for the jQuery plugin.
   *
   * @return {Function|Boolean}
   *   The jQuery plugin constructor or FALSE if the plugin does not exist.
   */
  Bootstrap.extendPlugin = function (id, callback) {
    // Immediately return if plugin doesn't exist.
    if (typeof $.fn[id] !== 'function') {
      return this.fatal('Specified jQuery plugin identifier does not exist: @id', {'@id':  id});
    }

    // Immediately return if callback isn't a function.
    if (typeof callback !== 'function') {
      return this.fatal('You must provide a callback function to extend the jQuery plugin "@id": @callback', {'@id': id, '@callback':  callback});
    }

    // Determine existing plugin constructor.
    var constructor = $.fn[id] && $.fn[id].Constructor || $.fn[id];
    var plugin = callback.apply(constructor, [this.settings]);
    if (!$.isPlainObject(plugin)) {
      return this.fatal('Returned value from callback is not a plain object that can be used to extend the jQuery plugin "@id": @obj', {'@obj':  plugin});
    }

    this.wrapPluginConstructor(constructor, plugin, true);

    return $.fn[id];
  };

  Bootstrap.superWrapper = function (parent, fn) {
    return function () {
      var previousSuper = this.super;
      this.super = parent;
      var ret = fn.apply(this, arguments);
      if (previousSuper) {
        this.super = previousSuper;
      }
      else {
        delete this.super;
      }
      return ret;
    };
  };

  /**
   * Provide a helper method for displaying when something is went wrong.
   *
   * @param {String} message
   *   The message to display.
   * @param {Object} [args]
   *   An arguments to use in message.
   *
   * @return {Boolean}
   *   Always returns FALSE.
   */
  Bootstrap.fatal = function (message, args) {
    if (this.settings.dev && console.warn) {
      for (var name in args) {
        if (args.hasOwnProperty(name) && typeof args[name] === 'object') {
          args[name] = JSON.stringify(args[name]);
        }
      }
      Drupal.throwError(new Error(Drupal.formatString(message, args)));
    }
    return false;
  };

  /**
   * Intersects object properties.
   *
   * @param {...Object} objects
   *   Two or more objects. The first object will be used to return properties
   *   values.
   *
   * @return {Object}
   *   Returns the properties of first passed object that intersects with all
   *   other passed objects.
   */
  Bootstrap.intersectObjects = function (objects) {
    var args = Array.prototype.slice.call(arguments);
    return _.pick(args[0], _.intersection.apply(_, _.map(args, function (obj) {
      return Object.keys(obj);
    })));
  };

  /**
   * Normalizes an object's values.
   *
   * @param {Object} obj
   *   The object to normalize.
   *
   * @return {Object}
   *   The normalized object.
   */
  Bootstrap.normalizeObject = function (obj) {
    if (!$.isPlainObject(obj)) {
      return obj;
    }

    for (var k in obj) {
      if (typeof obj[k] === 'string') {
        if (obj[k] === 'true') {
          obj[k] = true;
        }
        else if (obj[k] === 'false') {
          obj[k] = false;
        }
        else if (obj[k].match(/^[\d-.]$/)) {
          obj[k] = parseFloat(obj[k]);
        }
      }
      else if ($.isPlainObject(obj[k])) {
        obj[k] = Bootstrap.normalizeObject(obj[k]);
      }
    }

    return obj;
  };

  /**
   * An object based once plugin (similar to jquery.once, but without the DOM).
   *
   * @param {String} id
   *   A unique identifier.
   * @param {Function} callback
   *   The callback to invoke if the identifier has not yet been seen.
   *
   * @return {Bootstrap}
   */
  Bootstrap.once = function (id, callback) {
    // Immediately return if identifier has already been processed.
    if (this.processedOnce[id]) {
      return this;
    }
    callback.call(this, this.settings);
    this.processedOnce[id] = true;
    return this;
  };

  /**
   * Provide jQuery UI like ability to get/set options for Bootstrap plugins.
   *
   * @param {string|object} key
   *   A string value of the option to set, can be dot like to a nested key.
   *   An object of key/value pairs.
   * @param {*} [value]
   *   (optional) A value to set for key.
   *
   * @returns {*}
   *   - Returns nothing if key is an object or both key and value parameters
   *   were provided to set an option.
   *   - Returns the a value for a specific setting if key was provided.
   *   - Returns an object of key/value pairs of all the options if no key or
   *   value parameter was provided.
   *
   * @see https://github.com/jquery/jquery-ui/blob/master/ui/widget.js
   */
  Bootstrap.option = function (key, value) {
    var options = $.isPlainObject(key) ? $.extend({}, key) : {};

    // Get all options (clone so it doesn't reference the internal object).
    if (arguments.length === 0) {
      return $.extend({}, this.options);
    }

    // Get/set single option.
    if (typeof key === "string") {
      // Handle nested keys in dot notation.
      // e.g., "foo.bar" => { foo: { bar: true } }
      var parts = key.split('.');
      key = parts.shift();
      var obj = options;
      if (parts.length) {
        for (var i = 0; i < parts.length - 1; i++) {
          obj[parts[i]] = obj[parts[i]] || {};
          obj = obj[parts[i]];
        }
        key = parts.pop();
      }

      // Get.
      if (arguments.length === 1) {
        return obj[key] === void 0 ? null : obj[key];
      }

      // Set.
      obj[key] = value;
    }

    // Set multiple options.
    $.extend(true, this.options, options);
  };

  /**
   * Adds a ".noConflict()" helper method if needed.
   *
   * @param {String} id
   *   A jQuery plugin identifier located in $.fn.
   * @param {Function} plugin
   * @param {Function} plugin
   *   A constructor function used to initialize the for the jQuery plugin.
   * @param {Boolean} [noConflict]
   *   Flag indicating whether or not to create a ".noConflict()" helper method
   *   for the plugin.
   */
  Bootstrap.pluginNoConflict = function (id, plugin, noConflict) {
    if (plugin.noConflict === void 0 && (noConflict === void 0 || noConflict)) {
      var old = $.fn[id];
      plugin.noConflict = function () {
        $.fn[id] = old;
        return this;
      };
    }
  };

  /**
   * Creates a handler that relays to another event name.
   *
   * @param {HTMLElement|jQuery} target
   *   A target element.
   * @param {String} name
   *   The name of the event to trigger.
   * @param {Boolean} [stopPropagation=true]
   *   Flag indicating whether to stop the propagation of the event, defaults
   *   to true.
   *
   * @return {Function}
   *   An even handler callback function.
   */
  Bootstrap.relayEvent = function (target, name, stopPropagation) {
    return function (e) {
      if (stopPropagation === void 0 || stopPropagation) {
        e.stopPropagation();
      }
      var $target = $(target);
      var parts = name.split('.').filter(Boolean);
      var type = parts.shift();
      e.target = $target[0];
      e.currentTarget = $target[0];
      e.namespace = parts.join('.');
      e.type = type;
      $target.trigger(e);
    };
  };

  /**
   * Replaces a Bootstrap jQuery plugin definition.
   *
   * @param {String} id
   *   A jQuery plugin identifier located in $.fn.
   * @param {Function} callback
   *   A callback function that is immediately invoked and must return a
   *   function that will be used as the plugin constructor.
   * @param {Boolean} [noConflict]
   *   Flag indicating whether or not to create a ".noConflict()" helper method
   *   for the plugin.
   */
  Bootstrap.replacePlugin = function (id, callback, noConflict) {
    // Immediately return if plugin doesn't exist.
    if (typeof $.fn[id] !== 'function') {
      return this.fatal('Specified jQuery plugin identifier does not exist: @id', {'@id':  id});
    }

    // Immediately return if callback isn't a function.
    if (typeof callback !== 'function') {
      return this.fatal('You must provide a valid callback function to replace a jQuery plugin: @callback', {'@callback': callback});
    }

    // Determine existing plugin constructor.
    var constructor = $.fn[id] && $.fn[id].Constructor || $.fn[id];
    var plugin = callback.apply(constructor, [this.settings]);

    // Immediately return if plugin isn't a function.
    if (typeof plugin !== 'function') {
      return this.fatal('Returned value from callback is not a usable function to replace a jQuery plugin "@id": @plugin', {'@id': id, '@plugin': plugin});
    }

    this.wrapPluginConstructor(constructor, plugin);

    // Add a ".noConflict()" helper method.
    this.pluginNoConflict(id, plugin, noConflict);

    $.fn[id] = plugin;
  };

  /**
   * Simulates a native event on an element in the browser.
   *
   * Note: This is a fairly complete modern implementation. If things aren't
   * working quite the way you intend (in older browsers), you may wish to use
   * the jQuery.simulate plugin. If it's available, this method will defer to
   * that plugin.
   *
   * @see https://github.com/jquery/jquery-simulate
   *
   * @param {HTMLElement|jQuery} element
   *   A DOM element to dispatch event on. Note: this may be a jQuery object,
   *   however be aware that this will trigger the same event for each element
   *   inside the jQuery collection; use with caution.
   * @param {String|String[]} type
   *   The type(s) of event to simulate.
   * @param {Object} [options]
   *   An object of options to pass to the event constructor. Typically, if
   *   an event is being proxied, you should just pass the original event
   *   object here. This allows, if the browser supports it, to be a truly
   *   simulated event.
   *
   * @return {Boolean}
   *   The return value is false if event is cancelable and at least one of the
   *   event handlers which handled this event called Event.preventDefault().
   *   Otherwise it returns true.
   */
  Bootstrap.simulate = function (element, type, options) {
    // Handle jQuery object wrappers so it triggers on each element.
    var ret = true;
    if (element instanceof $) {
      element.each(function () {
        if (!Bootstrap.simulate(this, type, options)) {
          ret = false;
        }
      });
      return ret;
    }

    if (!(element instanceof HTMLElement)) {
      this.fatal('Passed element must be an instance of HTMLElement, got "@type" instead.', {
        '@type': typeof element,
      });
    }

    // Defer to the jQuery.simulate plugin, if it's available.
    if (typeof $.simulate === 'function') {
      new $.simulate(element, type, options);
      return true;
    }

    var event;
    var ctor;
    var types = [].concat(type);
    for (var i = 0, l = types.length; i < l; i++) {
      type = types[i];
      for (var name in this.eventMap) {
        if (this.eventMap[name].test(type)) {
          ctor = name;
          break;
        }
      }
      if (!ctor) {
        throw new SyntaxError('Only rudimentary HTMLEvents, KeyboardEvents and MouseEvents are supported: ' + type);
      }
      var opts = {bubbles: true, cancelable: true};
      if (ctor === 'KeyboardEvent' || ctor === 'MouseEvent') {
        $.extend(opts, {ctrlKey: !1, altKey: !1, shiftKey: !1, metaKey: !1});
      }
      if (ctor === 'MouseEvent') {
        $.extend(opts, {button: 0, pointerX: 0, pointerY: 0, view: window});
      }
      if (options) {
        $.extend(opts, options);
      }
      if (typeof window[ctor] === 'function') {
        event = new window[ctor](type, opts);
        if (!element.dispatchEvent(event)) {
          ret = false;
        }
      }
      else if (document.createEvent) {
        event = document.createEvent(ctor);
        event.initEvent(type, opts.bubbles, opts.cancelable);
        if (!element.dispatchEvent(event)) {
          ret = false;
        }
      }
      else if (typeof element.fireEvent === 'function') {
        event = $.extend(document.createEventObject(), opts);
        if (!element.fireEvent('on' + type, event)) {
          ret = false;
        }
      }
      else if (typeof element[type]) {
        element[type]();
      }
    }
    return ret;
  };

  /**
   * Strips HTML and returns just text.
   *
   * @param {String|Element|jQuery} html
   *   A string of HTML content, an Element DOM object or a jQuery object.
   *
   * @return {String}
   *   The text without HTML tags.
   *
   * @todo Replace with http://locutus.io/php/strings/strip_tags/
   */
  Bootstrap.stripHtml = function (html) {
    if (html instanceof $) {
      html = html.html();
    }
    else if (html instanceof Element) {
      html = html.innerHTML;
    }
    var tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return (tmp.textContent || tmp.innerText || '').replace(/^[\s\n\t]*|[\s\n\t]*$/, '');
  };

  /**
   * Provide a helper method for displaying when something is unsupported.
   *
   * @param {String} type
   *   The type of unsupported object, e.g. method or option.
   * @param {String} name
   *   The name of the unsupported object.
   * @param {*} [value]
   *   The value of the unsupported object.
   */
  Bootstrap.unsupported = function (type, name, value) {
    Bootstrap.warn('Unsupported by Drupal Bootstrap: (@type) @name -> @value', {
      '@type': type,
      '@name': name,
      '@value': typeof value === 'object' ? JSON.stringify(value) : value
    });
  };

  /**
   * Provide a helper method to display a warning.
   *
   * @param {String} message
   *   The message to display.
   * @param {Object} [args]
   *   Arguments to use as replacements in Drupal.formatString.
   */
  Bootstrap.warn = function (message, args) {
    if (this.settings.dev && console.warn) {
      console.warn(Drupal.formatString(message, args));
    }
  };

  /**
   * Wraps a plugin with common functionality.
   *
   * @param {Function} constructor
   *   A plugin constructor being wrapped.
   * @param {Object|Function} plugin
   *   The plugin being wrapped.
   * @param {Boolean} [extend = false]
   *   Whether to add super extensibility.
   */
  Bootstrap.wrapPluginConstructor = function (constructor, plugin, extend) {
    var proto = constructor.prototype;

    // Add a jQuery UI like option getter/setter method.
    var option = this.option;
    if (proto.option === void(0)) {
      proto.option = function () {
        return option.apply(this, arguments);
      };
    }

    if (extend) {
      // Handle prototype properties separately.
      if (plugin.prototype !== void 0) {
        for (var key in plugin.prototype) {
          if (!plugin.prototype.hasOwnProperty(key)) continue;
          var value = plugin.prototype[key];
          if (typeof value === 'function') {
            proto[key] = this.superWrapper(proto[key] || function () {}, value);
          }
          else {
            proto[key] = $.isPlainObject(value) ? $.extend(true, {}, proto[key], value) : value;
          }
        }
      }
      delete plugin.prototype;

      // Handle static properties.
      for (key in plugin) {
        if (!plugin.hasOwnProperty(key)) continue;
        value = plugin[key];
        if (typeof value === 'function') {
          constructor[key] = this.superWrapper(constructor[key] || function () {}, value);
        }
        else {
          constructor[key] = $.isPlainObject(value) ? $.extend(true, {}, constructor[key], value) : value;
        }
      }
    }
  };

  // Add Bootstrap to the global Drupal object.
  Drupal.bootstrap = Drupal.bootstrap || Bootstrap;

})(window._, window.jQuery, window.Drupal, window.drupalSettings);
;
(function ($, _) {

  /**
   * @class Attributes
   *
   * Modifies attributes.
   *
   * @param {Object|Attributes} attributes
   *   An object to initialize attributes with.
   */
  var Attributes = function (attributes) {
    this.data = {};
    this.data['class'] = [];
    this.merge(attributes);
  };

  /**
   * Renders the attributes object as a string to inject into an HTML element.
   *
   * @return {String}
   *   A rendered string suitable for inclusion in HTML markup.
   */
  Attributes.prototype.toString = function () {
    var output = '';
    var name, value;
    var checkPlain = function (str) {
      return str && str.toString().replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;') || '';
    };
    var data = this.getData();
    for (name in data) {
      if (!data.hasOwnProperty(name)) continue;
      value = data[name];
      if (_.isFunction(value)) value = value();
      if (_.isObject(value)) value = _.values(value);
      if (_.isArray(value)) value = value.join(' ');
      output += ' ' + checkPlain(name) + '="' + checkPlain(value) + '"';
    }
    return output;
  };

  /**
   * Renders the Attributes object as a plain object.
   *
   * @return {Object}
   *   A plain object suitable for inclusion in DOM elements.
   */
  Attributes.prototype.toPlainObject = function () {
    var object = {};
    var name, value;
    var data = this.getData();
    for (name in data) {
      if (!data.hasOwnProperty(name)) continue;
      value = data[name];
      if (_.isFunction(value)) value = value();
      if (_.isObject(value)) value = _.values(value);
      if (_.isArray(value)) value = value.join(' ');
      object[name] = value;
    }
    return object;
  };

  /**
   * Add class(es) to the array.
   *
   * @param {string|Array} value
   *   An individual class or an array of classes to add.
   *
   * @return {Attributes}
   *
   * @chainable
   */
  Attributes.prototype.addClass = function (value) {
    var args = Array.prototype.slice.call(arguments);
    this.data['class'] = this.sanitizeClasses(this.data['class'].concat(args));
    return this;
  };

  /**
   * Returns whether the requested attribute exists.
   *
   * @param {string} name
   *   An attribute name to check.
   *
   * @return {boolean}
   *   TRUE or FALSE
   */
  Attributes.prototype.exists = function (name) {
    return this.data[name] !== void(0) && this.data[name] !== null;
  };

  /**
   * Retrieve a specific attribute from the array.
   *
   * @param {string} name
   *   The specific attribute to retrieve.
   * @param {*} defaultValue
   *   (optional) The default value to set if the attribute does not exist.
   *
   * @return {*}
   *   A specific attribute value, passed by reference.
   */
  Attributes.prototype.get = function (name, defaultValue) {
    if (!this.exists(name)) this.data[name] = defaultValue;
    return this.data[name];
  };

  /**
   * Retrieves a cloned copy of the internal attributes data object.
   *
   * @return {Object}
   */
  Attributes.prototype.getData = function () {
    return _.extend({}, this.data);
  };

  /**
   * Retrieves classes from the array.
   *
   * @return {Array}
   *   The classes array.
   */
  Attributes.prototype.getClasses = function () {
    return this.get('class', []);
  };

  /**
   * Indicates whether a class is present in the array.
   *
   * @param {string|Array} className
   *   The class(es) to search for.
   *
   * @return {boolean}
   *   TRUE or FALSE
   */
  Attributes.prototype.hasClass = function (className) {
    className = this.sanitizeClasses(Array.prototype.slice.call(arguments));
    var classes = this.getClasses();
    for (var i = 0, l = className.length; i < l; i++) {
      // If one of the classes fails, immediately return false.
      if (_.indexOf(classes, className[i]) === -1) {
        return false;
      }
    }
    return true;
  };

  /**
   * Merges multiple values into the array.
   *
   * @param {Attributes|Node|jQuery|Object} object
   *   An Attributes object with existing data, a Node DOM element, a jQuery
   *   instance or a plain object where the key is the attribute name and the
   *   value is the attribute value.
   * @param {boolean} [recursive]
   *   Flag determining whether or not to recursively merge key/value pairs.
   *
   * @return {Attributes}
   *
   * @chainable
   */
  Attributes.prototype.merge = function (object, recursive) {
    // Immediately return if there is nothing to merge.
    if (!object) {
      return this;
    }

    // Get attributes from a jQuery element.
    if (object instanceof $) {
      object = object[0];
    }

    // Get attributes from a DOM element.
    if (object instanceof Node) {
      object = Array.prototype.slice.call(object.attributes).reduce(function (attributes, attribute) {
        attributes[attribute.name] = attribute.value;
        return attributes;
      }, {});
    }
    // Get attributes from an Attributes instance.
    else if (object instanceof Attributes) {
      object = object.getData();
    }
    // Otherwise, clone the object.
    else {
      object = _.extend({}, object);
    }

    // By this point, there should be a valid plain object.
    if (!$.isPlainObject(object)) {
      setTimeout(function () {
        throw new Error('Passed object is not supported: ' + object);
      });
      return this;
    }

    // Handle classes separately.
    if (object && object['class'] !== void 0) {
      this.addClass(object['class']);
      delete object['class'];
    }

    if (recursive === void 0 || recursive) {
      this.data = $.extend(true, {}, this.data, object);
    }
    else {
      this.data = $.extend({}, this.data, object);
    }

    return this;
  };

  /**
   * Removes an attribute from the array.
   *
   * @param {string} name
   *   The name of the attribute to remove.
   *
   * @return {Attributes}
   *
   * @chainable
   */
  Attributes.prototype.remove = function (name) {
    if (this.exists(name)) delete this.data[name];
    return this;
  };

  /**
   * Removes a class from the attributes array.
   *
   * @param {...string|Array} className
   *   An individual class or an array of classes to remove.
   *
   * @return {Attributes}
   *
   * @chainable
   */
  Attributes.prototype.removeClass = function (className) {
    var remove = this.sanitizeClasses(Array.prototype.slice.apply(arguments));
    this.data['class'] = _.without(this.getClasses(), remove);
    return this;
  };

  /**
   * Replaces a class in the attributes array.
   *
   * @param {string} oldValue
   *   The old class to remove.
   * @param {string} newValue
   *   The new class. It will not be added if the old class does not exist.
   *
   * @return {Attributes}
   *
   * @chainable
   */
  Attributes.prototype.replaceClass = function (oldValue, newValue) {
    var classes = this.getClasses();
    var i = _.indexOf(this.sanitizeClasses(oldValue), classes);
    if (i >= 0) {
      classes[i] = newValue;
      this.set('class', classes);
    }
    return this;
  };

  /**
   * Ensures classes are flattened into a single is an array and sanitized.
   *
   * @param {...String|Array} classes
   *   The class or classes to sanitize.
   *
   * @return {Array}
   *   A sanitized array of classes.
   */
  Attributes.prototype.sanitizeClasses = function (classes) {
    return _.chain(Array.prototype.slice.call(arguments))
      // Flatten in case there's a mix of strings and arrays.
      .flatten()

      // Split classes that may have been added with a space as a separator.
      .map(function (string) {
        return string.split(' ');
      })

      // Flatten again since it was just split into arrays.
      .flatten()

      // Filter out empty items.
      .filter()

      // Clean the class to ensure it's a valid class name.
      .map(function (value) {
        return Attributes.cleanClass(value);
      })

      // Ensure classes are unique.
      .uniq()

      // Retrieve the final value.
      .value();
  };

  /**
   * Sets an attribute on the array.
   *
   * @param {string} name
   *   The name of the attribute to set.
   * @param {*} value
   *   The value of the attribute to set.
   *
   * @return {Attributes}
   *
   * @chainable
   */
  Attributes.prototype.set = function (name, value) {
    var obj = $.isPlainObject(name) ? name : {};
    if (typeof name === 'string') {
      obj[name] = value;
    }
    return this.merge(obj);
  };

  /**
   * Prepares a string for use as a CSS identifier (element, class, or ID name).
   *
   * Note: this is essentially a direct copy from
   * \Drupal\Component\Utility\Html::cleanCssIdentifier
   *
   * @param {string} identifier
   *   The identifier to clean.
   * @param {Object} [filter]
   *   An object of string replacements to use on the identifier.
   *
   * @return {string}
   *   The cleaned identifier.
   */
  Attributes.cleanClass = function (identifier, filter) {
    filter = filter || {
      ' ': '-',
      '_': '-',
      '/': '-',
      '[': '-',
      ']': ''
    };

    identifier = identifier.toLowerCase();

    if (filter['__'] === void 0) {
      identifier = identifier.replace('__', '#DOUBLE_UNDERSCORE#');
    }

    identifier = identifier.replace(Object.keys(filter), Object.keys(filter).map(function(key) { return filter[key]; }));

    if (filter['__'] === void 0) {
      identifier = identifier.replace('#DOUBLE_UNDERSCORE#', '__');
    }

    identifier = identifier.replace(/[^\u002D\u0030-\u0039\u0041-\u005A\u005F\u0061-\u007A\u00A1-\uFFFF]/g, '');
    identifier = identifier.replace(['/^[0-9]/', '/^(-[0-9])|^(--)/'], ['_', '__']);

    return identifier;
  };

  /**
   * Creates an Attributes instance.
   *
   * @param {object|Attributes} [attributes]
   *   An object to initialize attributes with.
   *
   * @return {Attributes}
   *   An Attributes instance.
   *
   * @constructor
   */
  Attributes.create = function (attributes) {
    return new Attributes(attributes);
  };

  window.Attributes = Attributes;

})(window.jQuery, window._);
;
/**
 * @file
 * Theme hooks for the Drupal Bootstrap base theme.
 */
(function ($, Drupal, Bootstrap, Attributes) {

  /**
   * Fallback for theming an icon if the Icon API module is not installed.
   */
  if (!Drupal.icon) Drupal.icon = { bundles: {} };
  if (!Drupal.theme.icon || Drupal.theme.prototype.icon) {
    $.extend(Drupal.theme, /** @lends Drupal.theme */ {
      /**
       * Renders an icon.
       *
       * @param {string} bundle
       *   The bundle which the icon belongs to.
       * @param {string} icon
       *   The name of the icon to render.
       * @param {object|Attributes} [attributes]
       *   An object of attributes to also apply to the icon.
       *
       * @returns {string}
       */
      icon: function (bundle, icon, attributes) {
        if (!Drupal.icon.bundles[bundle]) return '';
        attributes = Attributes.create(attributes).addClass('icon').set('aria-hidden', 'true');
        icon = Drupal.icon.bundles[bundle](icon, attributes);
        return '<span' + attributes + '></span>';
      }
    });
  }

  /**
   * Callback for modifying an icon in the "bootstrap" icon bundle.
   *
   * @param {string} icon
   *   The icon being rendered.
   * @param {Attributes} attributes
   *   Attributes object for the icon.
   */
  Drupal.icon.bundles.bootstrap = function (icon, attributes) {
    attributes.addClass(['glyphicon', 'glyphicon-' + icon]);
  };

  /**
   * Add necessary theming hooks.
   */
  $.extend(Drupal.theme, /** @lends Drupal.theme */ {

    /**
     * Renders a Bootstrap AJAX glyphicon throbber.
     *
     * @returns {string}
     */
    ajaxThrobber: function () {
      return Drupal.theme('bootstrapIcon', 'refresh', {'class': ['ajax-throbber', 'glyphicon-spin'] });
    },

    /**
     * Renders a button element.
     *
     * @param {object|Attributes} attributes
     *   An object of attributes to apply to the button. If it contains one of:
     *   - value: The label of the button.
     *   - context: The context type of Bootstrap button, can be one of:
     *     - default
     *     - primary
     *     - success
     *     - info
     *     - warning
     *     - danger
     *     - link
     *
     * @returns {string}
     */
    button: function (attributes) {
      attributes = Attributes.create(attributes).addClass('btn');
      var context = attributes.get('context', 'default');
      var label = attributes.get('value', '');
      attributes.remove('context').remove('value');
      if (!attributes.hasClass(['btn-default', 'btn-primary', 'btn-success', 'btn-info', 'btn-warning', 'btn-danger', 'btn-link'])) {
        attributes.addClass('btn-' + Bootstrap.checkPlain(context));
      }

      // Attempt to, intelligently, provide a default button "type".
      if (!attributes.exists('type')) {
        attributes.set('type', attributes.hasClass('form-submit') ? 'submit' : 'button');
      }

      return '<button' + attributes + '>' + label + '</button>';
    },

    /**
     * Alias for "button" theme hook.
     *
     * @param {object|Attributes} attributes
     *   An object of attributes to apply to the button.
     *
     * @see Drupal.theme.button()
     *
     * @returns {string}
     */
    btn: function (attributes) {
      return Drupal.theme('button', attributes);
    },

    /**
     * Renders a button block element.
     *
     * @param {object|Attributes} attributes
     *   An object of attributes to apply to the button.
     *
     * @see Drupal.theme.button()
     *
     * @returns {string}
     */
    'btn-block': function (attributes) {
      return Drupal.theme('button', Attributes.create(attributes).addClass('btn-block'));
    },

    /**
     * Renders a large button element.
     *
     * @param {object|Attributes} attributes
     *   An object of attributes to apply to the button.
     *
     * @see Drupal.theme.button()
     *
     * @returns {string}
     */
    'btn-lg': function (attributes) {
      return Drupal.theme('button', Attributes.create(attributes).addClass('btn-lg'));
    },

    /**
     * Renders a small button element.
     *
     * @param {object|Attributes} attributes
     *   An object of attributes to apply to the button.
     *
     * @see Drupal.theme.button()
     *
     * @returns {string}
     */
    'btn-sm': function (attributes) {
      return Drupal.theme('button', Attributes.create(attributes).addClass('btn-sm'));
    },

    /**
     * Renders an extra small button element.
     *
     * @param {object|Attributes} attributes
     *   An object of attributes to apply to the button.
     *
     * @see Drupal.theme.button()
     *
     * @returns {string}
     */
    'btn-xs': function (attributes) {
      return Drupal.theme('button', Attributes.create(attributes).addClass('btn-xs'));
    },

    /**
     * Renders a glyphicon.
     *
     * @param {string} name
     *   The name of the glyphicon.
     * @param {object|Attributes} [attributes]
     *   An object of attributes to apply to the icon.
     *
     * @returns {string}
     */
    bootstrapIcon: function (name, attributes) {
      return Drupal.theme('icon', 'bootstrap', name, attributes);
    }

  });

})(window.jQuery, window.Drupal, window.Drupal.bootstrap, window.Attributes);
;
!function(t,e){"object"==typeof exports&&"object"==typeof module?module.exports=e():"function"==typeof define&&define.amd?define([],e):"object"==typeof exports?exports.drawer=e():(t.mdc=t.mdc||{},t.mdc.drawer=e())}(this,function(){return s={},i.m=n={0:function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var s=(Object.defineProperty(i,"cssClasses",{get:function(){return{}},enumerable:!0,configurable:!0}),Object.defineProperty(i,"strings",{get:function(){return{}},enumerable:!0,configurable:!0}),Object.defineProperty(i,"numbers",{get:function(){return{}},enumerable:!0,configurable:!0}),Object.defineProperty(i,"defaultAdapter",{get:function(){return{}},enumerable:!0,configurable:!0}),i.prototype.init=function(){},i.prototype.destroy=function(){},i);function i(t){void 0===t&&(t={}),this.adapter=t}e.MDCFoundation=s,e.default=s},1:function(t,e,n){"use strict";var s=this&&this.__read||function(t,e){var n="function"==typeof Symbol&&t[Symbol.iterator];if(!n)return t;var s,i,r=n.call(t),o=[];try{for(;(void 0===e||0<e--)&&!(s=r.next()).done;)o.push(s.value)}catch(t){i={error:t}}finally{try{s&&!s.done&&(n=r.return)&&n.call(r)}finally{if(i)throw i.error}}return o},i=this&&this.__spread||function(){for(var t=[],e=0;e<arguments.length;e++)t=t.concat(s(arguments[e]));return t};Object.defineProperty(e,"__esModule",{value:!0});var r=n(0),o=(a.attachTo=function(t){return new a(t,new r.MDCFoundation({}))},a.prototype.initialize=function(){for(var t=[],e=0;e<arguments.length;e++)t[e]=arguments[e]},a.prototype.getDefaultFoundation=function(){throw new Error("Subclasses must override getDefaultFoundation to return a properly configured foundation class")},a.prototype.initialSyncWithDOM=function(){},a.prototype.destroy=function(){this.foundation.destroy()},a.prototype.listen=function(t,e,n){this.root.addEventListener(t,e,n)},a.prototype.unlisten=function(t,e,n){this.root.removeEventListener(t,e,n)},a.prototype.emit=function(t,e,n){var s;void 0===n&&(n=!1),"function"==typeof CustomEvent?s=new CustomEvent(t,{bubbles:n,detail:e}):(s=document.createEvent("CustomEvent")).initCustomEvent(t,n,!1,e),this.root.dispatchEvent(s)},a);function a(t,e){for(var n=[],s=2;s<arguments.length;s++)n[s-2]=arguments[s];this.root=t,this.initialize.apply(this,i(n)),this.foundation=void 0===e?this.getDefaultFoundation():e,this.foundation.init(),this.initialSyncWithDOM()}e.MDCComponent=o,e.default=o},13:function(t,e,n){"use strict";var s,i=this&&this.__extends||(s=function(t,e){return(s=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var n in e)e.hasOwnProperty(n)&&(t[n]=e[n])})(t,e)},function(t,e){function n(){this.constructor=t}s(t,e),t.prototype=null===e?Object.create(e):(n.prototype=e.prototype,new n)}),r=this&&this.__assign||function(){return(r=Object.assign||function(t){for(var e,n=1,s=arguments.length;n<s;n++)for(var i in e=arguments[n])Object.prototype.hasOwnProperty.call(e,i)&&(t[i]=e[i]);return t}).apply(this,arguments)},o=this&&this.__importStar||function(t){if(t&&t.__esModule)return t;var e={};if(null!=t)for(var n in t)Object.hasOwnProperty.call(t,n)&&(e[n]=t[n]);return e.default=t,e};Object.defineProperty(e,"__esModule",{value:!0});var a=n(0),I=n(8),_=n(9),E=o(n(20)),m=n(14);var u,c=(u=a.MDCFoundation,i(d,u),Object.defineProperty(d,"strings",{get:function(){return _.strings},enumerable:!0,configurable:!0}),Object.defineProperty(d,"cssClasses",{get:function(){return _.cssClasses},enumerable:!0,configurable:!0}),Object.defineProperty(d,"numbers",{get:function(){return _.numbers},enumerable:!0,configurable:!0}),Object.defineProperty(d,"defaultAdapter",{get:function(){return{addClassForElementIndex:function(){},focusItemAtIndex:function(){},getAttributeForElementIndex:function(){return null},getFocusedElementIndex:function(){return 0},getListItemCount:function(){return 0},hasCheckboxAtIndex:function(){return!1},hasRadioAtIndex:function(){return!1},isCheckboxCheckedAtIndex:function(){return!1},isFocusInsideList:function(){return!1},isRootFocused:function(){return!1},listItemAtIndexHasClass:function(){return!1},notifyAction:function(){},removeClassForElementIndex:function(){},setAttributeForElementIndex:function(){},setCheckedCheckboxOrRadioAtIndex:function(){},setTabIndexForListItemChildren:function(){},getPrimaryTextAtIndex:function(){return""}}},enumerable:!0,configurable:!0}),d.prototype.layout=function(){0!==this.adapter.getListItemCount()&&(this.adapter.hasCheckboxAtIndex(0)?this.isCheckboxList_=!0:this.adapter.hasRadioAtIndex(0)?this.isRadioList_=!0:this.maybeInitializeSingleSelection(),this.hasTypeahead&&(this.sortedIndexByFirstChar=this.typeaheadInitSortedIndex()))},d.prototype.setWrapFocus=function(t){this.wrapFocus_=t},d.prototype.setVerticalOrientation=function(t){this.isVertical_=t},d.prototype.setSingleSelection=function(t){(this.isSingleSelectionList_=t)&&this.maybeInitializeSingleSelection()},d.prototype.maybeInitializeSingleSelection=function(){for(var t=0;t<this.adapter.getListItemCount();t++){var e=this.adapter.listItemAtIndexHasClass(t,_.cssClasses.LIST_ITEM_SELECTED_CLASS),n=this.adapter.listItemAtIndexHasClass(t,_.cssClasses.LIST_ITEM_ACTIVATED_CLASS);if(e||n)return n&&this.setUseActivatedClass(!0),this.isSingleSelectionList_=!0,void(this.selectedIndex_=t)}},d.prototype.setHasTypeahead=function(t){(this.hasTypeahead=t)&&(this.sortedIndexByFirstChar=this.typeaheadInitSortedIndex())},d.prototype.isTypeaheadInProgress=function(){return this.hasTypeahead&&E.isTypingInProgress(this.typeaheadState)},d.prototype.setUseActivatedClass=function(t){this.useActivatedClass_=t},d.prototype.getSelectedIndex=function(){return this.selectedIndex_},d.prototype.setSelectedIndex=function(t){this.isIndexValid_(t)&&(this.isCheckboxList_?this.setCheckboxAtIndex_(t):this.isRadioList_?this.setRadioAtIndex_(t):this.setSingleSelectionAtIndex_(t))},d.prototype.handleFocusIn=function(t,e){0<=e&&(this.focusedItemIndex=e,this.adapter.setAttributeForElementIndex(e,"tabindex","0"),this.adapter.setTabIndexForListItemChildren(e,"0"))},d.prototype.handleFocusOut=function(t,e){var n=this;0<=e&&(this.adapter.setAttributeForElementIndex(e,"tabindex","-1"),this.adapter.setTabIndexForListItemChildren(e,"-1")),setTimeout(function(){n.adapter.isFocusInsideList()||n.setTabindexToFirstSelectedOrFocusedItem()},0)},d.prototype.handleKeydown=function(t,e,n){var s=this,i="ArrowLeft"===I.normalizeKey(t),r="ArrowUp"===I.normalizeKey(t),o="ArrowRight"===I.normalizeKey(t),a="ArrowDown"===I.normalizeKey(t),u="Home"===I.normalizeKey(t),c="End"===I.normalizeKey(t),d="Enter"===I.normalizeKey(t),l="Spacebar"===I.normalizeKey(t);if(this.adapter.isRootFocused()){if(r||c?(t.preventDefault(),this.focusLastElement()):(a||u)&&(t.preventDefault(),this.focusFirstElement()),this.hasTypeahead){var f={event:t,focusItemAtIndex:function(t){s.focusItemAtIndex(t)},focusedItemIndex:-1,isTargetListItem:e,sortedIndexByFirstChar:this.sortedIndexByFirstChar,isItemAtIndexDisabled:function(t){return s.adapter.listItemAtIndexHasClass(t,_.cssClasses.LIST_ITEM_DISABLED_CLASS)}};E.handleKeydown(f,this.typeaheadState)}}else{var h=this.adapter.getFocusedElementIndex();if(!(-1===h&&(h=n)<0)){if(this.isVertical_&&a||!this.isVertical_&&o)m.preventDefaultEvent(t),this.focusNextElement(h);else if(this.isVertical_&&r||!this.isVertical_&&i)m.preventDefaultEvent(t),this.focusPrevElement(h);else if(u)m.preventDefaultEvent(t),this.focusFirstElement();else if(c)m.preventDefaultEvent(t),this.focusLastElement();else if((d||l)&&e){var p=t.target;if(p&&"A"===p.tagName&&d)return;if(m.preventDefaultEvent(t),this.adapter.listItemAtIndexHasClass(h,_.cssClasses.LIST_ITEM_DISABLED_CLASS))return;this.isTypeaheadInProgress()||(this.isSelectableList_()&&this.setSelectedIndexOnAction_(h),this.adapter.notifyAction(h))}this.hasTypeahead&&(f={event:t,focusItemAtIndex:function(t){s.focusItemAtIndex(t)},focusedItemIndex:this.focusedItemIndex,isTargetListItem:e,sortedIndexByFirstChar:this.sortedIndexByFirstChar,isItemAtIndexDisabled:function(t){return s.adapter.listItemAtIndexHasClass(t,_.cssClasses.LIST_ITEM_DISABLED_CLASS)}},E.handleKeydown(f,this.typeaheadState))}}},d.prototype.handleClick=function(t,e){t!==_.numbers.UNSET_INDEX&&(this.adapter.listItemAtIndexHasClass(t,_.cssClasses.LIST_ITEM_DISABLED_CLASS)||(this.isSelectableList_()&&this.setSelectedIndexOnAction_(t,e),this.adapter.notifyAction(t)))},d.prototype.focusNextElement=function(t){var e=t+1;if(this.adapter.getListItemCount()<=e){if(!this.wrapFocus_)return t;e=0}return this.focusItemAtIndex(e),e},d.prototype.focusPrevElement=function(t){var e=t-1;if(e<0){if(!this.wrapFocus_)return t;e=this.adapter.getListItemCount()-1}return this.focusItemAtIndex(e),e},d.prototype.focusFirstElement=function(){return this.focusItemAtIndex(0),0},d.prototype.focusLastElement=function(){var t=this.adapter.getListItemCount()-1;return this.focusItemAtIndex(t),t},d.prototype.setEnabled=function(t,e){this.isIndexValid_(t)&&(e?(this.adapter.removeClassForElementIndex(t,_.cssClasses.LIST_ITEM_DISABLED_CLASS),this.adapter.setAttributeForElementIndex(t,_.strings.ARIA_DISABLED,"false")):(this.adapter.addClassForElementIndex(t,_.cssClasses.LIST_ITEM_DISABLED_CLASS),this.adapter.setAttributeForElementIndex(t,_.strings.ARIA_DISABLED,"true")))},d.prototype.setSingleSelectionAtIndex_=function(t){if(this.selectedIndex_!==t){var e=_.cssClasses.LIST_ITEM_SELECTED_CLASS;this.useActivatedClass_&&(e=_.cssClasses.LIST_ITEM_ACTIVATED_CLASS),this.selectedIndex_!==_.numbers.UNSET_INDEX&&this.adapter.removeClassForElementIndex(this.selectedIndex_,e),this.setAriaForSingleSelectionAtIndex_(t),this.setTabindexAtIndex_(t),t!==_.numbers.UNSET_INDEX&&this.adapter.addClassForElementIndex(t,e),this.selectedIndex_=t}},d.prototype.setAriaForSingleSelectionAtIndex_=function(t){this.selectedIndex_===_.numbers.UNSET_INDEX&&(this.ariaCurrentAttrValue_=this.adapter.getAttributeForElementIndex(t,_.strings.ARIA_CURRENT));var e=null!==this.ariaCurrentAttrValue_,n=e?_.strings.ARIA_CURRENT:_.strings.ARIA_SELECTED;if(this.selectedIndex_!==_.numbers.UNSET_INDEX&&this.adapter.setAttributeForElementIndex(this.selectedIndex_,n,"false"),t!==_.numbers.UNSET_INDEX){var s=e?this.ariaCurrentAttrValue_:"true";this.adapter.setAttributeForElementIndex(t,n,s)}},d.prototype.setRadioAtIndex_=function(t){this.adapter.setCheckedCheckboxOrRadioAtIndex(t,!0),this.selectedIndex_!==_.numbers.UNSET_INDEX&&this.adapter.setAttributeForElementIndex(this.selectedIndex_,_.strings.ARIA_CHECKED,"false"),this.adapter.setAttributeForElementIndex(t,_.strings.ARIA_CHECKED,"true"),this.selectedIndex_=t},d.prototype.setCheckboxAtIndex_=function(t){for(var e=0;e<this.adapter.getListItemCount();e++){var n=!1;0<=t.indexOf(e)&&(n=!0),this.adapter.setCheckedCheckboxOrRadioAtIndex(e,n),this.adapter.setAttributeForElementIndex(e,_.strings.ARIA_CHECKED,n?"true":"false")}this.selectedIndex_=t},d.prototype.setTabindexAtIndex_=function(t){this.focusedItemIndex===_.numbers.UNSET_INDEX&&0!==t?this.adapter.setAttributeForElementIndex(0,"tabindex","-1"):0<=this.focusedItemIndex&&this.focusedItemIndex!==t&&this.adapter.setAttributeForElementIndex(this.focusedItemIndex,"tabindex","-1"),this.selectedIndex_ instanceof Array||this.selectedIndex_===t||this.adapter.setAttributeForElementIndex(this.selectedIndex_,"tabindex","-1"),t!==_.numbers.UNSET_INDEX&&this.adapter.setAttributeForElementIndex(t,"tabindex","0")},d.prototype.isSelectableList_=function(){return this.isSingleSelectionList_||this.isCheckboxList_||this.isRadioList_},d.prototype.setTabindexToFirstSelectedOrFocusedItem=function(){var t=0<=this.focusedItemIndex?this.focusedItemIndex:0;this.isSelectableList_()&&("number"==typeof this.selectedIndex_&&this.selectedIndex_!==_.numbers.UNSET_INDEX?t=this.selectedIndex_:function(t){return t instanceof Array}(this.selectedIndex_)&&0<this.selectedIndex_.length&&(t=this.selectedIndex_.reduce(function(t,e){return Math.min(t,e)}))),this.setTabindexAtIndex_(t)},d.prototype.isIndexValid_=function(t){var e=this;if(t instanceof Array){if(!this.isCheckboxList_)throw new Error("MDCListFoundation: Array of index is only supported for checkbox based list");return 0===t.length||t.some(function(t){return e.isIndexInRange_(t)})}if("number"!=typeof t)return!1;if(this.isCheckboxList_)throw new Error("MDCListFoundation: Expected array of index for checkbox based list but got number: "+t);return this.isIndexInRange_(t)||this.isSingleSelectionList_&&t===_.numbers.UNSET_INDEX},d.prototype.isIndexInRange_=function(t){var e=this.adapter.getListItemCount();return 0<=t&&t<e},d.prototype.setSelectedIndexOnAction_=function(t,e){void 0===e&&(e=!0),this.isCheckboxList_?this.toggleCheckboxAtIndex_(t,e):this.setSelectedIndex(t)},d.prototype.toggleCheckboxAtIndex_=function(e,t){var n=this.adapter.isCheckboxCheckedAtIndex(e);t&&(n=!n,this.adapter.setCheckedCheckboxOrRadioAtIndex(e,n)),this.adapter.setAttributeForElementIndex(e,_.strings.ARIA_CHECKED,n?"true":"false");var s=this.selectedIndex_===_.numbers.UNSET_INDEX?[]:this.selectedIndex_.slice();n?s.push(e):s=s.filter(function(t){return t!==e}),this.selectedIndex_=s},d.prototype.focusItemAtIndex=function(t){this.adapter.focusItemAtIndex(t),this.focusedItemIndex=t},d.prototype.typeaheadMatchItem=function(t,e,n){var s=this;void 0===n&&(n=!1);var i={focusItemAtIndex:function(t){s.focusItemAtIndex(t)},focusedItemIndex:e||this.focusedItemIndex,nextChar:t,sortedIndexByFirstChar:this.sortedIndexByFirstChar,skipFocus:n,isItemAtIndexDisabled:function(t){return s.adapter.listItemAtIndexHasClass(t,_.cssClasses.LIST_ITEM_DISABLED_CLASS)}};return E.matchItem(i,this.typeaheadState)},d.prototype.typeaheadInitSortedIndex=function(){return E.initSortedIndex(this.adapter.getListItemCount(),this.adapter.getPrimaryTextAtIndex)},d.prototype.clearTypeaheadBuffer=function(){E.clearBuffer(this.typeaheadState)},d);function d(t){var e=u.call(this,r(r({},d.defaultAdapter),t))||this;return e.wrapFocus_=!1,e.isVertical_=!0,e.isSingleSelectionList_=!1,e.selectedIndex_=_.numbers.UNSET_INDEX,e.focusedItemIndex=_.numbers.UNSET_INDEX,e.useActivatedClass_=!1,e.ariaCurrentAttrValue_=null,e.isCheckboxList_=!1,e.isRadioList_=!1,e.hasTypeahead=!1,e.typeaheadState=E.initState(),e.sortedIndexByFirstChar=new Map,e}e.MDCListFoundation=c,e.default=c},14:function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var s=["input","button","textarea","select"];e.preventDefaultEvent=function(t){var e=t.target;if(e){var n=(""+e.tagName).toLowerCase();-1===s.indexOf(n)&&t.preventDefault()}}},143:function(t,n,e){"use strict";function s(t){for(var e in t)n.hasOwnProperty(e)||(n[e]=t[e])}var i=this&&this.__importStar||function(t){if(t&&t.__esModule)return t;var e={};if(null!=t)for(var n in t)Object.hasOwnProperty.call(t,n)&&(e[n]=t[n]);return e.default=t,e};Object.defineProperty(n,"__esModule",{value:!0});var r=i(e(83));n.util=r,s(e(144)),s(e(84)),s(e(55)),s(e(85))},144:function(t,e,n){"use strict";var s,i=this&&this.__extends||(s=function(t,e){return(s=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var n in e)e.hasOwnProperty(n)&&(t[n]=e[n])})(t,e)},function(t,e){function n(){this.constructor=t}s(t,e),t.prototype=null===e?Object.create(e):(n.prototype=e.prototype,new n)}),r=this&&this.__importStar||function(t){if(t&&t.__esModule)return t;var e={};if(null!=t)for(var n in t)Object.hasOwnProperty.call(t,n)&&(e[n]=t[n]);return e.default=t,e};Object.defineProperty(e,"__esModule",{value:!0});var o,a=n(1),u=n(33),c=n(19),d=n(13),l=n(55),f=n(85),h=r(n(83)),p=l.MDCDismissibleDrawerFoundation.cssClasses,I=l.MDCDismissibleDrawerFoundation.strings,_=(o=a.MDCComponent,i(E,o),E.attachTo=function(t){return new E(t)},Object.defineProperty(E.prototype,"open",{get:function(){return this.foundation.isOpen()},set:function(t){t?this.foundation.open():this.foundation.close()},enumerable:!0,configurable:!0}),Object.defineProperty(E.prototype,"list",{get:function(){return this.list_},enumerable:!0,configurable:!0}),E.prototype.initialize=function(t,e){void 0===t&&(t=function(t){return new u.FocusTrap(t)}),void 0===e&&(e=function(t){return new c.MDCList(t)});var n=this.root.querySelector("."+d.MDCListFoundation.cssClasses.ROOT);n&&(this.list_=e(n),this.list_.wrapFocus=!0),this.focusTrapFactory_=t},E.prototype.initialSyncWithDOM=function(){var e=this,t=p.MODAL,n=I.SCRIM_SELECTOR;this.scrim_=this.root.parentNode.querySelector(n),this.scrim_&&this.root.classList.contains(t)&&(this.handleScrimClick_=function(){return e.foundation.handleScrimClick()},this.scrim_.addEventListener("click",this.handleScrimClick_),this.focusTrap_=h.createFocusTrapInstance(this.root,this.focusTrapFactory_)),this.handleKeydown_=function(t){return e.foundation.handleKeydown(t)},this.handleTransitionEnd_=function(t){return e.foundation.handleTransitionEnd(t)},this.listen("keydown",this.handleKeydown_),this.listen("transitionend",this.handleTransitionEnd_)},E.prototype.destroy=function(){this.unlisten("keydown",this.handleKeydown_),this.unlisten("transitionend",this.handleTransitionEnd_),this.list_&&this.list_.destroy();var t=p.MODAL;this.scrim_&&this.handleScrimClick_&&this.root.classList.contains(t)&&(this.scrim_.removeEventListener("click",this.handleScrimClick_),this.open=!1)},E.prototype.getDefaultFoundation=function(){var e=this,t={addClass:function(t){return e.root.classList.add(t)},removeClass:function(t){return e.root.classList.remove(t)},hasClass:function(t){return e.root.classList.contains(t)},elementHasClass:function(t,e){return t.classList.contains(e)},saveFocus:function(){return e.previousFocus_=document.activeElement},restoreFocus:function(){var t=e.previousFocus_;t&&t.focus&&e.root.contains(document.activeElement)&&t.focus()},focusActiveNavigationItem:function(){var t=e.root.querySelector("."+d.MDCListFoundation.cssClasses.LIST_ITEM_ACTIVATED_CLASS);t&&t.focus()},notifyClose:function(){return e.emit(I.CLOSE_EVENT,{},!0)},notifyOpen:function(){return e.emit(I.OPEN_EVENT,{},!0)},trapFocus:function(){return e.focusTrap_.trapFocus()},releaseFocus:function(){return e.focusTrap_.releaseFocus()}},n=p.DISMISSIBLE,s=p.MODAL;if(this.root.classList.contains(n))return new l.MDCDismissibleDrawerFoundation(t);if(this.root.classList.contains(s))return new f.MDCModalDrawerFoundation(t);throw new Error("MDCDrawer: Failed to instantiate component. Supported variants are "+n+" and "+s+".")},E);function E(){return null!==o&&o.apply(this,arguments)||this}e.MDCDrawer=_},19:function(t,e,n){"use strict";var s,i=this&&this.__extends||(s=function(t,e){return(s=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var n in e)e.hasOwnProperty(n)&&(t[n]=e[n])})(t,e)},function(t,e){function n(){this.constructor=t}s(t,e),t.prototype=null===e?Object.create(e):(n.prototype=e.prototype,new n)});Object.defineProperty(e,"__esModule",{value:!0});var r,o=n(1),a=n(2),u=n(9),c=n(13),d=(r=o.MDCComponent,i(l,r),Object.defineProperty(l.prototype,"vertical",{set:function(t){this.foundation.setVerticalOrientation(t)},enumerable:!0,configurable:!0}),Object.defineProperty(l.prototype,"listElements",{get:function(){return[].slice.call(this.root.querySelectorAll("."+u.cssClasses.LIST_ITEM_CLASS))},enumerable:!0,configurable:!0}),Object.defineProperty(l.prototype,"wrapFocus",{set:function(t){this.foundation.setWrapFocus(t)},enumerable:!0,configurable:!0}),Object.defineProperty(l.prototype,"typeaheadInProgress",{get:function(){return this.foundation.isTypeaheadInProgress()},enumerable:!0,configurable:!0}),Object.defineProperty(l.prototype,"hasTypeahead",{set:function(t){this.foundation.setHasTypeahead(t)},enumerable:!0,configurable:!0}),Object.defineProperty(l.prototype,"singleSelection",{set:function(t){this.foundation.setSingleSelection(t)},enumerable:!0,configurable:!0}),Object.defineProperty(l.prototype,"selectedIndex",{get:function(){return this.foundation.getSelectedIndex()},set:function(t){this.foundation.setSelectedIndex(t)},enumerable:!0,configurable:!0}),l.attachTo=function(t){return new l(t)},l.prototype.initialSyncWithDOM=function(){this.handleClick_=this.handleClickEvent_.bind(this),this.handleKeydown_=this.handleKeydownEvent_.bind(this),this.focusInEventListener_=this.handleFocusInEvent_.bind(this),this.focusOutEventListener_=this.handleFocusOutEvent_.bind(this),this.listen("keydown",this.handleKeydown_),this.listen("click",this.handleClick_),this.listen("focusin",this.focusInEventListener_),this.listen("focusout",this.focusOutEventListener_),this.layout(),this.initializeListType()},l.prototype.destroy=function(){this.unlisten("keydown",this.handleKeydown_),this.unlisten("click",this.handleClick_),this.unlisten("focusin",this.focusInEventListener_),this.unlisten("focusout",this.focusOutEventListener_)},l.prototype.layout=function(){var t=this.root.getAttribute(u.strings.ARIA_ORIENTATION);this.vertical=t!==u.strings.ARIA_ORIENTATION_HORIZONTAL,[].slice.call(this.root.querySelectorAll(".mdc-list-item:not([tabindex])")).forEach(function(t){t.setAttribute("tabindex","-1")}),[].slice.call(this.root.querySelectorAll(u.strings.FOCUSABLE_CHILD_ELEMENTS)).forEach(function(t){return t.setAttribute("tabindex","-1")}),this.foundation.layout()},l.prototype.getPrimaryText=function(t){var e=t.querySelector("."+u.cssClasses.LIST_ITEM_PRIMARY_TEXT_CLASS);if(e)return e.textContent||"";var n=t.querySelector("."+u.cssClasses.LIST_ITEM_TEXT_CLASS);return n&&n.textContent||""},l.prototype.initializeListType=function(){var e=this,t=this.root.querySelectorAll(u.strings.ARIA_ROLE_CHECKBOX_SELECTOR),n=this.root.querySelector(u.strings.ARIA_CHECKED_RADIO_SELECTOR);if(t.length){var s=this.root.querySelectorAll(u.strings.ARIA_CHECKED_CHECKBOX_SELECTOR);this.selectedIndex=[].map.call(s,function(t){return e.listElements.indexOf(t)})}else n&&(this.selectedIndex=this.listElements.indexOf(n))},l.prototype.setEnabled=function(t,e){this.foundation.setEnabled(t,e)},l.prototype.typeaheadMatchItem=function(t,e){return this.foundation.typeaheadMatchItem(t,e,!0)},l.prototype.getDefaultFoundation=function(){var i=this,t={addClassForElementIndex:function(t,e){var n=i.listElements[t];n&&n.classList.add(e)},focusItemAtIndex:function(t){var e=i.listElements[t];e&&e.focus()},getAttributeForElementIndex:function(t,e){return i.listElements[t].getAttribute(e)},getFocusedElementIndex:function(){return i.listElements.indexOf(document.activeElement)},getListItemCount:function(){return i.listElements.length},getPrimaryTextAtIndex:function(t){return i.getPrimaryText(i.listElements[t])},hasCheckboxAtIndex:function(t){return!!i.listElements[t].querySelector(u.strings.CHECKBOX_SELECTOR)},hasRadioAtIndex:function(t){return!!i.listElements[t].querySelector(u.strings.RADIO_SELECTOR)},isCheckboxCheckedAtIndex:function(t){return i.listElements[t].querySelector(u.strings.CHECKBOX_SELECTOR).checked},isFocusInsideList:function(){return i.root!==document.activeElement&&i.root.contains(document.activeElement)},isRootFocused:function(){return document.activeElement===i.root},listItemAtIndexHasClass:function(t,e){return i.listElements[t].classList.contains(e)},notifyAction:function(t){i.emit(u.strings.ACTION_EVENT,{index:t},!0)},removeClassForElementIndex:function(t,e){var n=i.listElements[t];n&&n.classList.remove(e)},setAttributeForElementIndex:function(t,e,n){var s=i.listElements[t];s&&s.setAttribute(e,n)},setCheckedCheckboxOrRadioAtIndex:function(t,e){var n=i.listElements[t].querySelector(u.strings.CHECKBOX_RADIO_SELECTOR);n.checked=e;var s=document.createEvent("Event");s.initEvent("change",!0,!0),n.dispatchEvent(s)},setTabIndexForListItemChildren:function(t,e){var n=i.listElements[t];[].slice.call(n.querySelectorAll(u.strings.CHILD_ELEMENTS_TO_TOGGLE_TABINDEX)).forEach(function(t){return t.setAttribute("tabindex",e)})}};return new c.MDCListFoundation(t)},l.prototype.getListItemIndex_=function(t){var e=t.target,n=a.closest(e,"."+u.cssClasses.LIST_ITEM_CLASS+", ."+u.cssClasses.ROOT);return n&&a.matches(n,"."+u.cssClasses.LIST_ITEM_CLASS)?this.listElements.indexOf(n):-1},l.prototype.handleFocusInEvent_=function(t){var e=this.getListItemIndex_(t);this.foundation.handleFocusIn(t,e)},l.prototype.handleFocusOutEvent_=function(t){var e=this.getListItemIndex_(t);this.foundation.handleFocusOut(t,e)},l.prototype.handleKeydownEvent_=function(t){var e=this.getListItemIndex_(t),n=t.target;this.foundation.handleKeydown(t,n.classList.contains(u.cssClasses.LIST_ITEM_CLASS),e)},l.prototype.handleClickEvent_=function(t){var e=this.getListItemIndex_(t),n=t.target,s=!a.matches(n,u.strings.CHECKBOX_RADIO_SELECTOR);this.foundation.handleClick(e,s)},l);function l(){return null!==r&&r.apply(this,arguments)||this}e.MDCList=d},2:function(t,e,n){"use strict";function s(t,e){return(t.matches||t.webkitMatchesSelector||t.msMatchesSelector).call(t,e)}Object.defineProperty(e,"__esModule",{value:!0}),e.closest=function(t,e){if(t.closest)return t.closest(e);for(var n=t;n;){if(s(n,e))return n;n=n.parentElement}return null},e.matches=s,e.estimateScrollWidth=function(t){var e=t;if(null!==e.offsetParent)return e.scrollWidth;var n=e.cloneNode(!0);n.style.setProperty("position","absolute"),n.style.setProperty("transform","translate(-9999px, -9999px)"),document.documentElement.appendChild(n);var s=n.scrollWidth;return document.documentElement.removeChild(n),s}},20:function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var _=n(8),c=n(9),E=n(14);function m(t,e){var n,s=t.nextChar,i=t.focusItemAtIndex,r=t.sortedIndexByFirstChar,o=t.focusedItemIndex,a=t.skipFocus,u=t.isItemAtIndexDisabled;return clearTimeout(e.bufferClearTimeout),e.bufferClearTimeout=setTimeout(function(){d(e)},c.numbers.TYPEAHEAD_BUFFER_CLEAR_TIMEOUT_MS),e.typeaheadBuffer=e.typeaheadBuffer+s,-1===(n=1===e.typeaheadBuffer.length?function(t,e,n,s){var i=s.typeaheadBuffer[0],r=t.get(i);if(!r)return-1;if(i===s.currentFirstChar&&r[s.sortedIndexCursor].index===e){s.sortedIndexCursor=(s.sortedIndexCursor+1)%r.length;var o=r[s.sortedIndexCursor].index;if(!n(o))return o}s.currentFirstChar=i;var a,u=-1;for(a=0;a<r.length;a++)if(!n(r[a].index)){u=a;break}for(;a<r.length;a++)if(r[a].index>e&&!n(r[a].index)){u=a;break}return-1===u?-1:(s.sortedIndexCursor=u,r[s.sortedIndexCursor].index)}(r,o,u,e):function(t,e,n){var s=n.typeaheadBuffer[0],i=t.get(s);if(!i)return-1;var r=i[n.sortedIndexCursor];if(0===r.text.lastIndexOf(n.typeaheadBuffer,0)&&!e(r.index))return r.index;var o=(n.sortedIndexCursor+1)%i.length,a=-1;for(;o!==n.sortedIndexCursor;){var u=i[o],c=0===u.text.lastIndexOf(n.typeaheadBuffer,0),d=!e(u.index);if(c&&d){a=o;break}o=(o+1)%i.length}return-1===a?-1:(n.sortedIndexCursor=a,i[n.sortedIndexCursor].index)}(r,u,e))||a||i(n),n}function y(t){return 0<t.typeaheadBuffer.length}function d(t){t.typeaheadBuffer=""}e.initState=function(){return{bufferClearTimeout:0,currentFirstChar:"",sortedIndexCursor:0,typeaheadBuffer:""}},e.initSortedIndex=function(t,e){for(var n=new Map,s=0;s<t;s++){var i=e(s).trim();if(i){var r=i[0].toLowerCase();n.has(r)||n.set(r,[]),n.get(r).push({text:i.toLowerCase(),index:s})}}return n.forEach(function(t){t.sort(function(t,e){return t.index-e.index})}),n},e.matchItem=m,e.isTypingInProgress=y,e.clearBuffer=d,e.handleKeydown=function(t,e){var n=t.event,s=t.isTargetListItem,i=t.focusedItemIndex,r=t.focusItemAtIndex,o=t.sortedIndexByFirstChar,a=t.isItemAtIndexDisabled,u="ArrowLeft"===_.normalizeKey(n),c="ArrowUp"===_.normalizeKey(n),d="ArrowRight"===_.normalizeKey(n),l="ArrowDown"===_.normalizeKey(n),f="Home"===_.normalizeKey(n),h="End"===_.normalizeKey(n),p="Enter"===_.normalizeKey(n),I="Spacebar"===_.normalizeKey(n);return u||c||d||l||f||h||p?-1:I||1!==n.key.length?I?(s&&E.preventDefaultEvent(n),s&&y(e)?m({focusItemAtIndex:r,focusedItemIndex:i,nextChar:" ",sortedIndexByFirstChar:o,skipFocus:!1,isItemAtIndexDisabled:a},e):-1):-1:(E.preventDefaultEvent(n),m({focusItemAtIndex:r,focusedItemIndex:i,nextChar:n.key.toLowerCase(),sortedIndexByFirstChar:o,skipFocus:!1,isItemAtIndexDisabled:a},e))}},33:function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var r="mdc-dom-focus-sentinel",s=(i.prototype.trapFocus=function(){var t=this.getFocusableElements(this.root);if(0===t.length)throw new Error("FocusTrap: Element must have at least one focusable child.");this.elFocusedBeforeTrapFocus=document.activeElement instanceof HTMLElement?document.activeElement:null,this.wrapTabFocus(this.root,t),this.options.skipInitialFocus||this.focusInitialElement(t,this.options.initialFocusEl)},i.prototype.releaseFocus=function(){[].slice.call(this.root.querySelectorAll("."+r)).forEach(function(t){t.parentElement.removeChild(t)}),this.elFocusedBeforeTrapFocus&&this.elFocusedBeforeTrapFocus.focus()},i.prototype.wrapTabFocus=function(t,e){var n=this.createSentinel(),s=this.createSentinel();n.addEventListener("focus",function(){0<e.length&&e[e.length-1].focus()}),s.addEventListener("focus",function(){0<e.length&&e[0].focus()}),t.insertBefore(n,t.children[0]),t.appendChild(s)},i.prototype.focusInitialElement=function(t,e){var n=0;e&&(n=Math.max(t.indexOf(e),0)),t[n].focus()},i.prototype.getFocusableElements=function(t){return[].slice.call(t.querySelectorAll("[autofocus], [tabindex], a, input, textarea, select, button")).filter(function(t){var e="true"===t.getAttribute("aria-disabled")||null!=t.getAttribute("disabled")||null!=t.getAttribute("hidden")||"true"===t.getAttribute("aria-hidden"),n=0<=t.tabIndex&&0<t.getBoundingClientRect().width&&!t.classList.contains(r)&&!e,s=!1;if(n){var i=getComputedStyle(t);s="none"===i.display||"hidden"===i.visibility}return n&&!s})},i.prototype.createSentinel=function(){var t=document.createElement("div");return t.setAttribute("tabindex","0"),t.setAttribute("aria-hidden","true"),t.classList.add(r),t},i);function i(t,e){void 0===e&&(e={}),this.root=t,this.options=e,this.elFocusedBeforeTrapFocus=null}e.FocusTrap=s},55:function(t,e,n){"use strict";var s,i=this&&this.__extends||(s=function(t,e){return(s=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var n in e)e.hasOwnProperty(n)&&(t[n]=e[n])})(t,e)},function(t,e){function n(){this.constructor=t}s(t,e),t.prototype=null===e?Object.create(e):(n.prototype=e.prototype,new n)}),r=this&&this.__assign||function(){return(r=Object.assign||function(t){for(var e,n=1,s=arguments.length;n<s;n++)for(var i in e=arguments[n])Object.prototype.hasOwnProperty.call(e,i)&&(t[i]=e[i]);return t}).apply(this,arguments)};Object.defineProperty(e,"__esModule",{value:!0});var o,a=n(0),u=n(84),c=(o=a.MDCFoundation,i(d,o),Object.defineProperty(d,"strings",{get:function(){return u.strings},enumerable:!0,configurable:!0}),Object.defineProperty(d,"cssClasses",{get:function(){return u.cssClasses},enumerable:!0,configurable:!0}),Object.defineProperty(d,"defaultAdapter",{get:function(){return{addClass:function(){},removeClass:function(){},hasClass:function(){return!1},elementHasClass:function(){return!1},notifyClose:function(){},notifyOpen:function(){},saveFocus:function(){},restoreFocus:function(){},focusActiveNavigationItem:function(){},trapFocus:function(){},releaseFocus:function(){}}},enumerable:!0,configurable:!0}),d.prototype.destroy=function(){this.animationFrame_&&cancelAnimationFrame(this.animationFrame_),this.animationTimer_&&clearTimeout(this.animationTimer_)},d.prototype.open=function(){var t=this;this.isOpen()||this.isOpening()||this.isClosing()||(this.adapter.addClass(u.cssClasses.OPEN),this.adapter.addClass(u.cssClasses.ANIMATE),this.runNextAnimationFrame_(function(){t.adapter.addClass(u.cssClasses.OPENING)}),this.adapter.saveFocus())},d.prototype.close=function(){!this.isOpen()||this.isOpening()||this.isClosing()||this.adapter.addClass(u.cssClasses.CLOSING)},d.prototype.isOpen=function(){return this.adapter.hasClass(u.cssClasses.OPEN)},d.prototype.isOpening=function(){return this.adapter.hasClass(u.cssClasses.OPENING)||this.adapter.hasClass(u.cssClasses.ANIMATE)},d.prototype.isClosing=function(){return this.adapter.hasClass(u.cssClasses.CLOSING)},d.prototype.handleKeydown=function(t){var e=t.keyCode;"Escape"!==t.key&&27!==e||this.close()},d.prototype.handleTransitionEnd=function(t){var e=u.cssClasses.OPENING,n=u.cssClasses.CLOSING,s=u.cssClasses.OPEN,i=u.cssClasses.ANIMATE,r=u.cssClasses.ROOT;this.isElement_(t.target)&&this.adapter.elementHasClass(t.target,r)&&(this.isClosing()?(this.adapter.removeClass(s),this.closed_(),this.adapter.restoreFocus(),this.adapter.notifyClose()):(this.adapter.focusActiveNavigationItem(),this.opened_(),this.adapter.notifyOpen()),this.adapter.removeClass(i),this.adapter.removeClass(e),this.adapter.removeClass(n))},d.prototype.opened_=function(){},d.prototype.closed_=function(){},d.prototype.runNextAnimationFrame_=function(t){var e=this;cancelAnimationFrame(this.animationFrame_),this.animationFrame_=requestAnimationFrame(function(){e.animationFrame_=0,clearTimeout(e.animationTimer_),e.animationTimer_=setTimeout(t,0)})},d.prototype.isElement_=function(t){return Boolean(t.classList)},d);function d(t){var e=o.call(this,r(r({},d.defaultAdapter),t))||this;return e.animationFrame_=0,e.animationTimer_=0,e}e.MDCDismissibleDrawerFoundation=c,e.default=c},8:function(t,s,e){"use strict";Object.defineProperty(s,"__esModule",{value:!0}),s.KEY={UNKNOWN:"Unknown",BACKSPACE:"Backspace",ENTER:"Enter",SPACEBAR:"Spacebar",PAGE_UP:"PageUp",PAGE_DOWN:"PageDown",END:"End",HOME:"Home",ARROW_LEFT:"ArrowLeft",ARROW_UP:"ArrowUp",ARROW_RIGHT:"ArrowRight",ARROW_DOWN:"ArrowDown",DELETE:"Delete",ESCAPE:"Escape"};var i=new Set;i.add(s.KEY.BACKSPACE),i.add(s.KEY.ENTER),i.add(s.KEY.SPACEBAR),i.add(s.KEY.PAGE_UP),i.add(s.KEY.PAGE_DOWN),i.add(s.KEY.END),i.add(s.KEY.HOME),i.add(s.KEY.ARROW_LEFT),i.add(s.KEY.ARROW_UP),i.add(s.KEY.ARROW_RIGHT),i.add(s.KEY.ARROW_DOWN),i.add(s.KEY.DELETE),i.add(s.KEY.ESCAPE);var n=8,r=13,o=32,a=33,u=34,c=35,d=36,l=37,f=38,h=39,p=40,I=46,_=27,E=new Map;E.set(n,s.KEY.BACKSPACE),E.set(r,s.KEY.ENTER),E.set(o,s.KEY.SPACEBAR),E.set(a,s.KEY.PAGE_UP),E.set(u,s.KEY.PAGE_DOWN),E.set(c,s.KEY.END),E.set(d,s.KEY.HOME),E.set(l,s.KEY.ARROW_LEFT),E.set(f,s.KEY.ARROW_UP),E.set(h,s.KEY.ARROW_RIGHT),E.set(p,s.KEY.ARROW_DOWN),E.set(I,s.KEY.DELETE),E.set(_,s.KEY.ESCAPE);var m=new Set;function y(t){var e=t.key;if(i.has(e))return e;var n=E.get(t.keyCode);return n||s.KEY.UNKNOWN}m.add(s.KEY.PAGE_UP),m.add(s.KEY.PAGE_DOWN),m.add(s.KEY.END),m.add(s.KEY.HOME),m.add(s.KEY.ARROW_LEFT),m.add(s.KEY.ARROW_UP),m.add(s.KEY.ARROW_RIGHT),m.add(s.KEY.ARROW_DOWN),s.normalizeKey=y,s.isNavigationEvent=function(t){return m.has(y(t))}},83:function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.createFocusTrapInstance=function(t,e){return e(t,{skipInitialFocus:!0})}},84:function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});e.cssClasses={ANIMATE:"mdc-drawer--animate",CLOSING:"mdc-drawer--closing",DISMISSIBLE:"mdc-drawer--dismissible",MODAL:"mdc-drawer--modal",OPEN:"mdc-drawer--open",OPENING:"mdc-drawer--opening",ROOT:"mdc-drawer"};e.strings={APP_CONTENT_SELECTOR:".mdc-drawer-app-content",CLOSE_EVENT:"MDCDrawer:closed",OPEN_EVENT:"MDCDrawer:opened",SCRIM_SELECTOR:".mdc-drawer-scrim"}},85:function(t,e,n){"use strict";var s,i=this&&this.__extends||(s=function(t,e){return(s=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var n in e)e.hasOwnProperty(n)&&(t[n]=e[n])})(t,e)},function(t,e){function n(){this.constructor=t}s(t,e),t.prototype=null===e?Object.create(e):(n.prototype=e.prototype,new n)});Object.defineProperty(e,"__esModule",{value:!0});var r,o=n(55),a=(r=o.MDCDismissibleDrawerFoundation,i(u,r),u.prototype.handleScrimClick=function(){this.close()},u.prototype.opened_=function(){this.adapter.trapFocus()},u.prototype.closed_=function(){this.adapter.releaseFocus()},u);function u(){return null!==r&&r.apply(this,arguments)||this}e.MDCModalDrawerFoundation=a,e.default=a},9:function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var s={LIST_ITEM_ACTIVATED_CLASS:"mdc-list-item--activated",LIST_ITEM_CLASS:"mdc-list-item",LIST_ITEM_DISABLED_CLASS:"mdc-list-item--disabled",LIST_ITEM_SELECTED_CLASS:"mdc-list-item--selected",LIST_ITEM_TEXT_CLASS:"mdc-list-item__text",LIST_ITEM_PRIMARY_TEXT_CLASS:"mdc-list-item__primary-text",ROOT:"mdc-list"},i={ACTION_EVENT:"MDCList:action",ARIA_CHECKED:"aria-checked",ARIA_CHECKED_CHECKBOX_SELECTOR:'[role="checkbox"][aria-checked="true"]',ARIA_CHECKED_RADIO_SELECTOR:'[role="radio"][aria-checked="true"]',ARIA_CURRENT:"aria-current",ARIA_DISABLED:"aria-disabled",ARIA_ORIENTATION:"aria-orientation",ARIA_ORIENTATION_HORIZONTAL:"horizontal",ARIA_ROLE_CHECKBOX_SELECTOR:'[role="checkbox"]',ARIA_SELECTED:"aria-selected",CHECKBOX_RADIO_SELECTOR:'input[type="checkbox"], input[type="radio"]',CHECKBOX_SELECTOR:'input[type="checkbox"]',CHILD_ELEMENTS_TO_TOGGLE_TABINDEX:"\n    ."+(e.cssClasses=s).LIST_ITEM_CLASS+" button:not(:disabled),\n    ."+s.LIST_ITEM_CLASS+" a\n  ",FOCUSABLE_CHILD_ELEMENTS:"\n    ."+s.LIST_ITEM_CLASS+" button:not(:disabled),\n    ."+s.LIST_ITEM_CLASS+" a,\n    ."+s.LIST_ITEM_CLASS+' input[type="radio"]:not(:disabled),\n    .'+s.LIST_ITEM_CLASS+' input[type="checkbox"]:not(:disabled)\n  ',RADIO_SELECTOR:'input[type="radio"]'};e.strings=i;e.numbers={UNSET_INDEX:-1,TYPEAHEAD_BUFFER_CLEAR_TIMEOUT_MS:300}}},i.c=s,i.d=function(t,e,n){i.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:n})},i.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},i.t=function(e,t){if(1&t&&(e=i(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(i.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var s in e)i.d(n,s,function(t){return e[t]}.bind(null,s));return n},i.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return i.d(e,"a",e),e},i.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},i.p="",i(i.s=143);function i(t){if(s[t])return s[t].exports;var e=s[t]={i:t,l:!1,exports:{}};return n[t].call(e.exports,e,e.exports,i),e.l=!0,e.exports}var n,s});;
!function(t,e){"object"==typeof exports&&"object"==typeof module?module.exports=e():"function"==typeof define&&define.amd?define([],e):"object"==typeof exports?exports.topAppBar=e():(t.mdc=t.mdc||{},t.mdc.topAppBar=e())}(this,function(){return i={},r.m=n={0:function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});var i=(Object.defineProperty(r,"cssClasses",{get:function(){return{}},enumerable:!0,configurable:!0}),Object.defineProperty(r,"strings",{get:function(){return{}},enumerable:!0,configurable:!0}),Object.defineProperty(r,"numbers",{get:function(){return{}},enumerable:!0,configurable:!0}),Object.defineProperty(r,"defaultAdapter",{get:function(){return{}},enumerable:!0,configurable:!0}),r.prototype.init=function(){},r.prototype.destroy=function(){},r);function r(t){void 0===t&&(t={}),this.adapter=t}e.MDCFoundation=i,e.default=i},1:function(t,e,n){"use strict";var i=this&&this.__read||function(t,e){var n="function"==typeof Symbol&&t[Symbol.iterator];if(!n)return t;var i,r,o=n.call(t),a=[];try{for(;(void 0===e||0<e--)&&!(i=o.next()).done;)a.push(i.value)}catch(t){r={error:t}}finally{try{i&&!i.done&&(n=o.return)&&n.call(o)}finally{if(r)throw r.error}}return a},r=this&&this.__spread||function(){for(var t=[],e=0;e<arguments.length;e++)t=t.concat(i(arguments[e]));return t};Object.defineProperty(e,"__esModule",{value:!0});var o=n(0),a=(s.attachTo=function(t){return new s(t,new o.MDCFoundation({}))},s.prototype.initialize=function(){for(var t=[],e=0;e<arguments.length;e++)t[e]=arguments[e]},s.prototype.getDefaultFoundation=function(){throw new Error("Subclasses must override getDefaultFoundation to return a properly configured foundation class")},s.prototype.initialSyncWithDOM=function(){},s.prototype.destroy=function(){this.foundation.destroy()},s.prototype.listen=function(t,e,n){this.root.addEventListener(t,e,n)},s.prototype.unlisten=function(t,e,n){this.root.removeEventListener(t,e,n)},s.prototype.emit=function(t,e,n){var i;void 0===n&&(n=!1),"function"==typeof CustomEvent?i=new CustomEvent(t,{bubbles:n,detail:e}):(i=document.createEvent("CustomEvent")).initCustomEvent(t,n,!1,e),this.root.dispatchEvent(i)},s);function s(t,e){for(var n=[],i=2;i<arguments.length;i++)n[i-2]=arguments[i];this.root=t,this.initialize.apply(this,r(n)),this.foundation=void 0===e?this.getDefaultFoundation():e,this.foundation.init(),this.initialSyncWithDOM()}e.MDCComponent=a,e.default=a},120:function(t,e,n){"use strict";var i,r=this&&this.__extends||(i=function(t,e){return(i=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var n in e)e.hasOwnProperty(n)&&(t[n]=e[n])})(t,e)},function(t,e){function n(){this.constructor=t}i(t,e),t.prototype=null===e?Object.create(e):(n.prototype=e.prototype,new n)});Object.defineProperty(e,"__esModule",{value:!0});var o,a=n(32),s=n(69),c=(o=s.MDCTopAppBarFoundation,r(u,o),u.prototype.handleTargetScroll=function(){this.adapter.getViewportScrollY()<=0?this.wasScrolled_&&(this.adapter.removeClass(a.cssClasses.FIXED_SCROLLED_CLASS),this.wasScrolled_=!1):this.wasScrolled_||(this.adapter.addClass(a.cssClasses.FIXED_SCROLLED_CLASS),this.wasScrolled_=!0)},u);function u(){var t=null!==o&&o.apply(this,arguments)||this;return t.wasScrolled_=!1,t}e.MDCFixedTopAppBarFoundation=c,e.default=c},121:function(t,e,n){"use strict";var i,r=this&&this.__extends||(i=function(t,e){return(i=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var n in e)e.hasOwnProperty(n)&&(t[n]=e[n])})(t,e)},function(t,e){function n(){this.constructor=t}i(t,e),t.prototype=null===e?Object.create(e):(n.prototype=e.prototype,new n)});Object.defineProperty(e,"__esModule",{value:!0});var o,a=n(32),s=n(70),c=(o=s.MDCTopAppBarBaseFoundation,r(u,o),Object.defineProperty(u.prototype,"isCollapsed",{get:function(){return this.isCollapsed_},enumerable:!0,configurable:!0}),u.prototype.init=function(){o.prototype.init.call(this),0<this.adapter.getTotalActionItems()&&this.adapter.addClass(a.cssClasses.SHORT_HAS_ACTION_ITEM_CLASS),this.setAlwaysCollapsed(this.adapter.hasClass(a.cssClasses.SHORT_COLLAPSED_CLASS))},u.prototype.setAlwaysCollapsed=function(t){this.isAlwaysCollapsed_=!!t,this.isAlwaysCollapsed_?this.collapse_():this.maybeCollapseBar_()},u.prototype.getAlwaysCollapsed=function(){return this.isAlwaysCollapsed_},u.prototype.handleTargetScroll=function(){this.maybeCollapseBar_()},u.prototype.maybeCollapseBar_=function(){this.isAlwaysCollapsed_||(this.adapter.getViewportScrollY()<=0?this.isCollapsed_&&this.uncollapse_():this.isCollapsed_||this.collapse_())},u.prototype.uncollapse_=function(){this.adapter.removeClass(a.cssClasses.SHORT_COLLAPSED_CLASS),this.isCollapsed_=!1},u.prototype.collapse_=function(){this.adapter.addClass(a.cssClasses.SHORT_COLLAPSED_CLASS),this.isCollapsed_=!0},u);function u(t){var e=o.call(this,t)||this;return e.isCollapsed_=!1,e.isAlwaysCollapsed_=!1,e}e.MDCShortTopAppBarFoundation=c,e.default=c},185:function(t,n,e){"use strict";function i(t){for(var e in t)n.hasOwnProperty(e)||(n[e]=t[e])}Object.defineProperty(n,"__esModule",{value:!0}),i(e(186)),i(e(32)),i(e(70)),i(e(120)),i(e(121)),i(e(69))},186:function(t,e,n){"use strict";var i,r=this&&this.__extends||(i=function(t,e){return(i=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var n in e)e.hasOwnProperty(n)&&(t[n]=e[n])})(t,e)},function(t,e){function n(){this.constructor=t}i(t,e),t.prototype=null===e?Object.create(e):(n.prototype=e.prototype,new n)});Object.defineProperty(e,"__esModule",{value:!0});var o,a=n(1),s=n(6),c=n(32),u=n(120),p=n(121),d=n(69),l=(o=a.MDCComponent,r(f,o),f.attachTo=function(t){return new f(t)},f.prototype.initialize=function(n){void 0===n&&(n=function(t){return s.MDCRipple.attachTo(t)}),this.navIcon_=this.root.querySelector(c.strings.NAVIGATION_ICON_SELECTOR);var t=[].slice.call(this.root.querySelectorAll(c.strings.ACTION_ITEM_SELECTOR));this.navIcon_&&t.push(this.navIcon_),this.iconRipples_=t.map(function(t){var e=n(t);return e.unbounded=!0,e}),this.scrollTarget_=window},f.prototype.initialSyncWithDOM=function(){this.handleNavigationClick_=this.foundation.handleNavigationClick.bind(this.foundation),this.handleWindowResize_=this.foundation.handleWindowResize.bind(this.foundation),this.handleTargetScroll_=this.foundation.handleTargetScroll.bind(this.foundation),this.scrollTarget_.addEventListener("scroll",this.handleTargetScroll_),this.navIcon_&&this.navIcon_.addEventListener("click",this.handleNavigationClick_);var t=this.root.classList.contains(c.cssClasses.FIXED_CLASS);this.root.classList.contains(c.cssClasses.SHORT_CLASS)||t||window.addEventListener("resize",this.handleWindowResize_)},f.prototype.destroy=function(){this.iconRipples_.forEach(function(t){return t.destroy()}),this.scrollTarget_.removeEventListener("scroll",this.handleTargetScroll_),this.navIcon_&&this.navIcon_.removeEventListener("click",this.handleNavigationClick_);var t=this.root.classList.contains(c.cssClasses.FIXED_CLASS);this.root.classList.contains(c.cssClasses.SHORT_CLASS)||t||window.removeEventListener("resize",this.handleWindowResize_),o.prototype.destroy.call(this)},f.prototype.setScrollTarget=function(t){this.scrollTarget_.removeEventListener("scroll",this.handleTargetScroll_),this.scrollTarget_=t,this.handleTargetScroll_=this.foundation.handleTargetScroll.bind(this.foundation),this.scrollTarget_.addEventListener("scroll",this.handleTargetScroll_)},f.prototype.getDefaultFoundation=function(){var n=this,t={hasClass:function(t){return n.root.classList.contains(t)},addClass:function(t){return n.root.classList.add(t)},removeClass:function(t){return n.root.classList.remove(t)},setStyle:function(t,e){return n.root.style.setProperty(t,e)},getTopAppBarHeight:function(){return n.root.clientHeight},notifyNavigationIconClicked:function(){return n.emit(c.strings.NAVIGATION_EVENT,{})},getViewportScrollY:function(){var t=n.scrollTarget_,e=n.scrollTarget_;return void 0!==t.pageYOffset?t.pageYOffset:e.scrollTop},getTotalActionItems:function(){return n.root.querySelectorAll(c.strings.ACTION_ITEM_SELECTOR).length}};return this.root.classList.contains(c.cssClasses.SHORT_CLASS)?new p.MDCShortTopAppBarFoundation(t):this.root.classList.contains(c.cssClasses.FIXED_CLASS)?new u.MDCFixedTopAppBarFoundation(t):new d.MDCTopAppBarFoundation(t)},f);function f(){return null!==o&&o.apply(this,arguments)||this}e.MDCTopAppBar=l},2:function(t,e,n){"use strict";function i(t,e){return(t.matches||t.webkitMatchesSelector||t.msMatchesSelector).call(t,e)}Object.defineProperty(e,"__esModule",{value:!0}),e.closest=function(t,e){if(t.closest)return t.closest(e);for(var n=t;n;){if(i(n,e))return n;n=n.parentElement}return null},e.matches=i,e.estimateScrollWidth=function(t){var e=t;if(null!==e.offsetParent)return e.scrollWidth;var n=e.cloneNode(!0);n.style.setProperty("position","absolute"),n.style.setProperty("transform","translate(-9999px, -9999px)"),document.documentElement.appendChild(n);var i=n.scrollWidth;return document.documentElement.removeChild(n),i}},3:function(t,e,n){"use strict";var a;Object.defineProperty(e,"__esModule",{value:!0}),e.supportsCssVariables=function(t,e){void 0===e&&(e=!1);var n,i=t.CSS;if("boolean"==typeof a&&!e)return a;if(!(i&&"function"==typeof i.supports))return!1;var r=i.supports("--css-vars","yes"),o=i.supports("(--css-vars: yes)")&&i.supports("color","#00000000");return n=r||o,e||(a=n),n},e.getNormalizedEventCoords=function(t,e,n){if(!t)return{x:0,y:0};var i,r,o=e.x,a=e.y,s=o+n.left,c=a+n.top;if("touchstart"===t.type){var u=t;i=u.changedTouches[0].pageX-s,r=u.changedTouches[0].pageY-c}else{var p=t;i=p.pageX-s,r=p.pageY-c}return{x:i,y:r}}},32:function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0});e.cssClasses={FIXED_CLASS:"mdc-top-app-bar--fixed",FIXED_SCROLLED_CLASS:"mdc-top-app-bar--fixed-scrolled",SHORT_CLASS:"mdc-top-app-bar--short",SHORT_COLLAPSED_CLASS:"mdc-top-app-bar--short-collapsed",SHORT_HAS_ACTION_ITEM_CLASS:"mdc-top-app-bar--short-has-action-item"};e.numbers={DEBOUNCE_THROTTLE_RESIZE_TIME_MS:100,MAX_TOP_APP_BAR_HEIGHT:128};e.strings={ACTION_ITEM_SELECTOR:".mdc-top-app-bar__action-item",NAVIGATION_EVENT:"MDCTopAppBar:nav",NAVIGATION_ICON_SELECTOR:".mdc-top-app-bar__navigation-icon",ROOT_SELECTOR:".mdc-top-app-bar",TITLE_SELECTOR:".mdc-top-app-bar__title"}},4:function(t,e,n){"use strict";var i,r=this&&this.__extends||(i=function(t,e){return(i=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var n in e)e.hasOwnProperty(n)&&(t[n]=e[n])})(t,e)},function(t,e){function n(){this.constructor=t}i(t,e),t.prototype=null===e?Object.create(e):(n.prototype=e.prototype,new n)}),o=this&&this.__assign||function(){return(o=Object.assign||function(t){for(var e,n=1,i=arguments.length;n<i;n++)for(var r in e=arguments[n])Object.prototype.hasOwnProperty.call(e,r)&&(t[r]=e[r]);return t}).apply(this,arguments)};Object.defineProperty(e,"__esModule",{value:!0});var a,s=n(0),c=n(7),u=n(3),p=["touchstart","pointerdown","mousedown","keydown"],d=["touchend","pointerup","mouseup","contextmenu"],l=[],f=(a=s.MDCFoundation,r(_,a),Object.defineProperty(_,"cssClasses",{get:function(){return c.cssClasses},enumerable:!0,configurable:!0}),Object.defineProperty(_,"strings",{get:function(){return c.strings},enumerable:!0,configurable:!0}),Object.defineProperty(_,"numbers",{get:function(){return c.numbers},enumerable:!0,configurable:!0}),Object.defineProperty(_,"defaultAdapter",{get:function(){return{addClass:function(){},browserSupportsCssVars:function(){return!0},computeBoundingRect:function(){return{top:0,right:0,bottom:0,left:0,width:0,height:0}},containsEventTarget:function(){return!0},deregisterDocumentInteractionHandler:function(){},deregisterInteractionHandler:function(){},deregisterResizeHandler:function(){},getWindowPageOffset:function(){return{x:0,y:0}},isSurfaceActive:function(){return!0},isSurfaceDisabled:function(){return!0},isUnbounded:function(){return!0},registerDocumentInteractionHandler:function(){},registerInteractionHandler:function(){},registerResizeHandler:function(){},removeClass:function(){},updateCssVariable:function(){}}},enumerable:!0,configurable:!0}),_.prototype.init=function(){var t=this,e=this.supportsPressRipple_();if(this.registerRootHandlers_(e),e){var n=_.cssClasses,i=n.ROOT,r=n.UNBOUNDED;requestAnimationFrame(function(){t.adapter.addClass(i),t.adapter.isUnbounded()&&(t.adapter.addClass(r),t.layoutInternal_())})}},_.prototype.destroy=function(){var t=this;if(this.supportsPressRipple_()){this.activationTimer_&&(clearTimeout(this.activationTimer_),this.activationTimer_=0,this.adapter.removeClass(_.cssClasses.FG_ACTIVATION)),this.fgDeactivationRemovalTimer_&&(clearTimeout(this.fgDeactivationRemovalTimer_),this.fgDeactivationRemovalTimer_=0,this.adapter.removeClass(_.cssClasses.FG_DEACTIVATION));var e=_.cssClasses,n=e.ROOT,i=e.UNBOUNDED;requestAnimationFrame(function(){t.adapter.removeClass(n),t.adapter.removeClass(i),t.removeCssVars_()})}this.deregisterRootHandlers_(),this.deregisterDeactivationHandlers_()},_.prototype.activate=function(t){this.activate_(t)},_.prototype.deactivate=function(){this.deactivate_()},_.prototype.layout=function(){var t=this;this.layoutFrame_&&cancelAnimationFrame(this.layoutFrame_),this.layoutFrame_=requestAnimationFrame(function(){t.layoutInternal_(),t.layoutFrame_=0})},_.prototype.setUnbounded=function(t){var e=_.cssClasses.UNBOUNDED;t?this.adapter.addClass(e):this.adapter.removeClass(e)},_.prototype.handleFocus=function(){var t=this;requestAnimationFrame(function(){return t.adapter.addClass(_.cssClasses.BG_FOCUSED)})},_.prototype.handleBlur=function(){var t=this;requestAnimationFrame(function(){return t.adapter.removeClass(_.cssClasses.BG_FOCUSED)})},_.prototype.supportsPressRipple_=function(){return this.adapter.browserSupportsCssVars()},_.prototype.defaultActivationState_=function(){return{activationEvent:void 0,hasDeactivationUXRun:!1,isActivated:!1,isProgrammatic:!1,wasActivatedByPointer:!1,wasElementMadeActive:!1}},_.prototype.registerRootHandlers_=function(t){var e=this;t&&(p.forEach(function(t){e.adapter.registerInteractionHandler(t,e.activateHandler_)}),this.adapter.isUnbounded()&&this.adapter.registerResizeHandler(this.resizeHandler_)),this.adapter.registerInteractionHandler("focus",this.focusHandler_),this.adapter.registerInteractionHandler("blur",this.blurHandler_)},_.prototype.registerDeactivationHandlers_=function(t){var e=this;"keydown"===t.type?this.adapter.registerInteractionHandler("keyup",this.deactivateHandler_):d.forEach(function(t){e.adapter.registerDocumentInteractionHandler(t,e.deactivateHandler_)})},_.prototype.deregisterRootHandlers_=function(){var e=this;p.forEach(function(t){e.adapter.deregisterInteractionHandler(t,e.activateHandler_)}),this.adapter.deregisterInteractionHandler("focus",this.focusHandler_),this.adapter.deregisterInteractionHandler("blur",this.blurHandler_),this.adapter.isUnbounded()&&this.adapter.deregisterResizeHandler(this.resizeHandler_)},_.prototype.deregisterDeactivationHandlers_=function(){var e=this;this.adapter.deregisterInteractionHandler("keyup",this.deactivateHandler_),d.forEach(function(t){e.adapter.deregisterDocumentInteractionHandler(t,e.deactivateHandler_)})},_.prototype.removeCssVars_=function(){var e=this,n=_.strings;Object.keys(n).forEach(function(t){0===t.indexOf("VAR_")&&e.adapter.updateCssVariable(n[t],null)})},_.prototype.activate_=function(t){var e=this;if(!this.adapter.isSurfaceDisabled()){var n=this.activationState_;if(!n.isActivated){var i=this.previousActivationEvent_;i&&void 0!==t&&i.type!==t.type||(n.isActivated=!0,n.isProgrammatic=void 0===t,n.activationEvent=t,n.wasActivatedByPointer=!n.isProgrammatic&&void 0!==t&&("mousedown"===t.type||"touchstart"===t.type||"pointerdown"===t.type),void 0!==t&&0<l.length&&l.some(function(t){return e.adapter.containsEventTarget(t)})?this.resetActivationState_():(void 0!==t&&(l.push(t.target),this.registerDeactivationHandlers_(t)),n.wasElementMadeActive=this.checkElementMadeActive_(t),n.wasElementMadeActive&&this.animateActivation_(),requestAnimationFrame(function(){l=[],n.wasElementMadeActive||void 0===t||" "!==t.key&&32!==t.keyCode||(n.wasElementMadeActive=e.checkElementMadeActive_(t),n.wasElementMadeActive&&e.animateActivation_()),n.wasElementMadeActive||(e.activationState_=e.defaultActivationState_())})))}}},_.prototype.checkElementMadeActive_=function(t){return void 0===t||"keydown"!==t.type||this.adapter.isSurfaceActive()},_.prototype.animateActivation_=function(){var t=this,e=_.strings,n=e.VAR_FG_TRANSLATE_START,i=e.VAR_FG_TRANSLATE_END,r=_.cssClasses,o=r.FG_DEACTIVATION,a=r.FG_ACTIVATION,s=_.numbers.DEACTIVATION_TIMEOUT_MS;this.layoutInternal_();var c="",u="";if(!this.adapter.isUnbounded()){var p=this.getFgTranslationCoordinates_(),d=p.startPoint,l=p.endPoint;c=d.x+"px, "+d.y+"px",u=l.x+"px, "+l.y+"px"}this.adapter.updateCssVariable(n,c),this.adapter.updateCssVariable(i,u),clearTimeout(this.activationTimer_),clearTimeout(this.fgDeactivationRemovalTimer_),this.rmBoundedActivationClasses_(),this.adapter.removeClass(o),this.adapter.computeBoundingRect(),this.adapter.addClass(a),this.activationTimer_=setTimeout(function(){return t.activationTimerCallback_()},s)},_.prototype.getFgTranslationCoordinates_=function(){var t,e=this.activationState_,n=e.activationEvent;return{startPoint:t={x:(t=e.wasActivatedByPointer?u.getNormalizedEventCoords(n,this.adapter.getWindowPageOffset(),this.adapter.computeBoundingRect()):{x:this.frame_.width/2,y:this.frame_.height/2}).x-this.initialSize_/2,y:t.y-this.initialSize_/2},endPoint:{x:this.frame_.width/2-this.initialSize_/2,y:this.frame_.height/2-this.initialSize_/2}}},_.prototype.runDeactivationUXLogicIfReady_=function(){var t=this,e=_.cssClasses.FG_DEACTIVATION,n=this.activationState_,i=n.hasDeactivationUXRun,r=n.isActivated;!i&&r||!this.activationAnimationHasEnded_||(this.rmBoundedActivationClasses_(),this.adapter.addClass(e),this.fgDeactivationRemovalTimer_=setTimeout(function(){t.adapter.removeClass(e)},c.numbers.FG_DEACTIVATION_MS))},_.prototype.rmBoundedActivationClasses_=function(){var t=_.cssClasses.FG_ACTIVATION;this.adapter.removeClass(t),this.activationAnimationHasEnded_=!1,this.adapter.computeBoundingRect()},_.prototype.resetActivationState_=function(){var t=this;this.previousActivationEvent_=this.activationState_.activationEvent,this.activationState_=this.defaultActivationState_(),setTimeout(function(){return t.previousActivationEvent_=void 0},_.numbers.TAP_DELAY_MS)},_.prototype.deactivate_=function(){var t=this,e=this.activationState_;if(e.isActivated){var n=o({},e);e.isProgrammatic?(requestAnimationFrame(function(){return t.animateDeactivation_(n)}),this.resetActivationState_()):(this.deregisterDeactivationHandlers_(),requestAnimationFrame(function(){t.activationState_.hasDeactivationUXRun=!0,t.animateDeactivation_(n),t.resetActivationState_()}))}},_.prototype.animateDeactivation_=function(t){var e=t.wasActivatedByPointer,n=t.wasElementMadeActive;(e||n)&&this.runDeactivationUXLogicIfReady_()},_.prototype.layoutInternal_=function(){var t=this;this.frame_=this.adapter.computeBoundingRect();var e=Math.max(this.frame_.height,this.frame_.width);this.maxRadius_=this.adapter.isUnbounded()?e:Math.sqrt(Math.pow(t.frame_.width,2)+Math.pow(t.frame_.height,2))+_.numbers.PADDING;var n=Math.floor(e*_.numbers.INITIAL_ORIGIN_SCALE);this.adapter.isUnbounded()&&n%2!=0?this.initialSize_=n-1:this.initialSize_=n,this.fgScale_=""+this.maxRadius_/this.initialSize_,this.updateLayoutCssVars_()},_.prototype.updateLayoutCssVars_=function(){var t=_.strings,e=t.VAR_FG_SIZE,n=t.VAR_LEFT,i=t.VAR_TOP,r=t.VAR_FG_SCALE;this.adapter.updateCssVariable(e,this.initialSize_+"px"),this.adapter.updateCssVariable(r,this.fgScale_),this.adapter.isUnbounded()&&(this.unboundedCoords_={left:Math.round(this.frame_.width/2-this.initialSize_/2),top:Math.round(this.frame_.height/2-this.initialSize_/2)},this.adapter.updateCssVariable(n,this.unboundedCoords_.left+"px"),this.adapter.updateCssVariable(i,this.unboundedCoords_.top+"px"))},_);function _(t){var e=a.call(this,o(o({},_.defaultAdapter),t))||this;return e.activationAnimationHasEnded_=!1,e.activationTimer_=0,e.fgDeactivationRemovalTimer_=0,e.fgScale_="0",e.frame_={width:0,height:0},e.initialSize_=0,e.layoutFrame_=0,e.maxRadius_=0,e.unboundedCoords_={left:0,top:0},e.activationState_=e.defaultActivationState_(),e.activationTimerCallback_=function(){e.activationAnimationHasEnded_=!0,e.runDeactivationUXLogicIfReady_()},e.activateHandler_=function(t){return e.activate_(t)},e.deactivateHandler_=function(){return e.deactivate_()},e.focusHandler_=function(){return e.handleFocus()},e.blurHandler_=function(){return e.handleBlur()},e.resizeHandler_=function(){return e.layout()},e}e.MDCRippleFoundation=f,e.default=f},5:function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.applyPassive=function(t){return void 0===t&&(t=window),!!function(t){void 0===t&&(t=window);var e=!1;try{var n={get passive(){return!(e=!0)}},i=function(){};t.document.addEventListener("test",i,n),t.document.removeEventListener("test",i,n)}catch(t){e=!1}return e}(t)&&{passive:!0}}},6:function(t,e,n){"use strict";var i,r=this&&this.__extends||(i=function(t,e){return(i=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var n in e)e.hasOwnProperty(n)&&(t[n]=e[n])})(t,e)},function(t,e){function n(){this.constructor=t}i(t,e),t.prototype=null===e?Object.create(e):(n.prototype=e.prototype,new n)}),o=this&&this.__importStar||function(t){if(t&&t.__esModule)return t;var e={};if(null!=t)for(var n in t)Object.hasOwnProperty.call(t,n)&&(e[n]=t[n]);return e.default=t,e};Object.defineProperty(e,"__esModule",{value:!0});var a,s=n(1),c=n(5),u=n(2),p=n(4),d=o(n(3)),l=(a=s.MDCComponent,r(f,a),f.attachTo=function(t,e){void 0===e&&(e={isUnbounded:void 0});var n=new f(t);return void 0!==e.isUnbounded&&(n.unbounded=e.isUnbounded),n},f.createAdapter=function(n){return{addClass:function(t){return n.root.classList.add(t)},browserSupportsCssVars:function(){return d.supportsCssVariables(window)},computeBoundingRect:function(){return n.root.getBoundingClientRect()},containsEventTarget:function(t){return n.root.contains(t)},deregisterDocumentInteractionHandler:function(t,e){return document.documentElement.removeEventListener(t,e,c.applyPassive())},deregisterInteractionHandler:function(t,e){return n.root.removeEventListener(t,e,c.applyPassive())},deregisterResizeHandler:function(t){return window.removeEventListener("resize",t)},getWindowPageOffset:function(){return{x:window.pageXOffset,y:window.pageYOffset}},isSurfaceActive:function(){return u.matches(n.root,":active")},isSurfaceDisabled:function(){return Boolean(n.disabled)},isUnbounded:function(){return Boolean(n.unbounded)},registerDocumentInteractionHandler:function(t,e){return document.documentElement.addEventListener(t,e,c.applyPassive())},registerInteractionHandler:function(t,e){return n.root.addEventListener(t,e,c.applyPassive())},registerResizeHandler:function(t){return window.addEventListener("resize",t)},removeClass:function(t){return n.root.classList.remove(t)},updateCssVariable:function(t,e){return n.root.style.setProperty(t,e)}}},Object.defineProperty(f.prototype,"unbounded",{get:function(){return Boolean(this.unbounded_)},set:function(t){this.unbounded_=Boolean(t),this.setUnbounded_()},enumerable:!0,configurable:!0}),f.prototype.activate=function(){this.foundation.activate()},f.prototype.deactivate=function(){this.foundation.deactivate()},f.prototype.layout=function(){this.foundation.layout()},f.prototype.getDefaultFoundation=function(){return new p.MDCRippleFoundation(f.createAdapter(this))},f.prototype.initialSyncWithDOM=function(){var t=this.root;this.unbounded="mdcRippleIsUnbounded"in t.dataset},f.prototype.setUnbounded_=function(){this.foundation.setUnbounded(Boolean(this.unbounded_))},f);function f(){var t=null!==a&&a.apply(this,arguments)||this;return t.disabled=!1,t}e.MDCRipple=l},69:function(t,e,n){"use strict";var i,r=this&&this.__extends||(i=function(t,e){return(i=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var n in e)e.hasOwnProperty(n)&&(t[n]=e[n])})(t,e)},function(t,e){function n(){this.constructor=t}i(t,e),t.prototype=null===e?Object.create(e):(n.prototype=e.prototype,new n)});Object.defineProperty(e,"__esModule",{value:!0});var o,a=n(32),s=n(70),c=(o=s.MDCTopAppBarBaseFoundation,r(u,o),u.prototype.destroy=function(){o.prototype.destroy.call(this),this.adapter.setStyle("top","")},u.prototype.handleTargetScroll=function(){var t=Math.max(this.adapter.getViewportScrollY(),0),e=t-this.lastScrollPosition_;this.lastScrollPosition_=t,this.isCurrentlyBeingResized_||(this.currentAppBarOffsetTop_-=e,0<this.currentAppBarOffsetTop_?this.currentAppBarOffsetTop_=0:Math.abs(this.currentAppBarOffsetTop_)>this.topAppBarHeight_&&(this.currentAppBarOffsetTop_=-this.topAppBarHeight_),this.moveTopAppBar_())},u.prototype.handleWindowResize=function(){var t=this;this.resizeThrottleId_||(this.resizeThrottleId_=setTimeout(function(){t.resizeThrottleId_=0,t.throttledResizeHandler_()},a.numbers.DEBOUNCE_THROTTLE_RESIZE_TIME_MS)),this.isCurrentlyBeingResized_=!0,this.resizeDebounceId_&&clearTimeout(this.resizeDebounceId_),this.resizeDebounceId_=setTimeout(function(){t.handleTargetScroll(),t.isCurrentlyBeingResized_=!1,t.resizeDebounceId_=0},a.numbers.DEBOUNCE_THROTTLE_RESIZE_TIME_MS)},u.prototype.checkForUpdate_=function(){var t=-this.topAppBarHeight_,e=this.currentAppBarOffsetTop_<0,n=this.currentAppBarOffsetTop_>t,i=e&&n;if(i)this.wasDocked_=!1;else{if(!this.wasDocked_)return this.wasDocked_=!0;if(this.isDockedShowing_!==n)return this.isDockedShowing_=n,!0}return i},u.prototype.moveTopAppBar_=function(){if(this.checkForUpdate_()){var t=this.currentAppBarOffsetTop_;Math.abs(t)>=this.topAppBarHeight_&&(t=-a.numbers.MAX_TOP_APP_BAR_HEIGHT),this.adapter.setStyle("top",t+"px")}},u.prototype.throttledResizeHandler_=function(){var t=this.adapter.getTopAppBarHeight();this.topAppBarHeight_!==t&&(this.wasDocked_=!1,this.currentAppBarOffsetTop_-=this.topAppBarHeight_-t,this.topAppBarHeight_=t),this.handleTargetScroll()},u);function u(t){var e=o.call(this,t)||this;return e.wasDocked_=!0,e.isDockedShowing_=!0,e.currentAppBarOffsetTop_=0,e.isCurrentlyBeingResized_=!1,e.resizeThrottleId_=0,e.resizeDebounceId_=0,e.lastScrollPosition_=e.adapter.getViewportScrollY(),e.topAppBarHeight_=e.adapter.getTopAppBarHeight(),e}e.MDCTopAppBarFoundation=c,e.default=c},7:function(t,e,n){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.cssClasses={BG_FOCUSED:"mdc-ripple-upgraded--background-focused",FG_ACTIVATION:"mdc-ripple-upgraded--foreground-activation",FG_DEACTIVATION:"mdc-ripple-upgraded--foreground-deactivation",ROOT:"mdc-ripple-upgraded",UNBOUNDED:"mdc-ripple-upgraded--unbounded"},e.strings={VAR_FG_SCALE:"--mdc-ripple-fg-scale",VAR_FG_SIZE:"--mdc-ripple-fg-size",VAR_FG_TRANSLATE_END:"--mdc-ripple-fg-translate-end",VAR_FG_TRANSLATE_START:"--mdc-ripple-fg-translate-start",VAR_LEFT:"--mdc-ripple-left",VAR_TOP:"--mdc-ripple-top"},e.numbers={DEACTIVATION_TIMEOUT_MS:225,FG_DEACTIVATION_MS:150,INITIAL_ORIGIN_SCALE:.6,PADDING:10,TAP_DELAY_MS:300}},70:function(t,e,n){"use strict";var i,r=this&&this.__extends||(i=function(t,e){return(i=Object.setPrototypeOf||{__proto__:[]}instanceof Array&&function(t,e){t.__proto__=e}||function(t,e){for(var n in e)e.hasOwnProperty(n)&&(t[n]=e[n])})(t,e)},function(t,e){function n(){this.constructor=t}i(t,e),t.prototype=null===e?Object.create(e):(n.prototype=e.prototype,new n)}),o=this&&this.__assign||function(){return(o=Object.assign||function(t){for(var e,n=1,i=arguments.length;n<i;n++)for(var r in e=arguments[n])Object.prototype.hasOwnProperty.call(e,r)&&(t[r]=e[r]);return t}).apply(this,arguments)};Object.defineProperty(e,"__esModule",{value:!0});var a,s=n(0),c=n(32),u=(a=s.MDCFoundation,r(p,a),Object.defineProperty(p,"strings",{get:function(){return c.strings},enumerable:!0,configurable:!0}),Object.defineProperty(p,"cssClasses",{get:function(){return c.cssClasses},enumerable:!0,configurable:!0}),Object.defineProperty(p,"numbers",{get:function(){return c.numbers},enumerable:!0,configurable:!0}),Object.defineProperty(p,"defaultAdapter",{get:function(){return{addClass:function(){},removeClass:function(){},hasClass:function(){return!1},setStyle:function(){},getTopAppBarHeight:function(){return 0},notifyNavigationIconClicked:function(){},getViewportScrollY:function(){return 0},getTotalActionItems:function(){return 0}}},enumerable:!0,configurable:!0}),p.prototype.handleTargetScroll=function(){},p.prototype.handleWindowResize=function(){},p.prototype.handleNavigationClick=function(){this.adapter.notifyNavigationIconClicked()},p);function p(t){return a.call(this,o(o({},p.defaultAdapter),t))||this}e.MDCTopAppBarBaseFoundation=u,e.default=u}},r.c=i,r.d=function(t,e,n){r.o(t,e)||Object.defineProperty(t,e,{enumerable:!0,get:n})},r.r=function(t){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var i in e)r.d(n,i,function(t){return e[t]}.bind(null,i));return n},r.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return r.d(e,"a",e),e},r.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},r.p="",r(r.s=185);function r(t){if(i[t])return i[t].exports;var e=i[t]={i:t,l:!1,exports:{}};return n[t].call(e.exports,e,e.exports,r),e.l=!0,e.exports}var n,i});;
/* ========================================================================
 * Bootstrap: alert.js v3.4.1
 * https://getbootstrap.com/docs/3.4/javascript/#alerts
 * ========================================================================
 * Copyright 2011-2019 Twitter, Inc.
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/master/LICENSE)
 * ======================================================================== */


+function ($) {
  'use strict';

  // ALERT CLASS DEFINITION
  // ======================

  var dismiss = '[data-dismiss="alert"]'
  var Alert   = function (el) {
    $(el).on('click', dismiss, this.close)
  }

  Alert.VERSION = '3.4.1'

  Alert.TRANSITION_DURATION = 150

  Alert.prototype.close = function (e) {
    var $this    = $(this)
    var selector = $this.attr('data-target')

    if (!selector) {
      selector = $this.attr('href')
      selector = selector && selector.replace(/.*(?=#[^\s]*$)/, '') // strip for ie7
    }

    selector    = selector === '#' ? [] : selector
    var $parent = $(document).find(selector)

    if (e) e.preventDefault()

    if (!$parent.length) {
      $parent = $this.closest('.alert')
    }

    $parent.trigger(e = $.Event('close.bs.alert'))

    if (e.isDefaultPrevented()) return

    $parent.removeClass('in')

    function removeElement() {
      // detach from parent, fire event then clean up data
      $parent.detach().trigger('closed.bs.alert').remove()
    }

    $.support.transition && $parent.hasClass('fade') ?
      $parent
        .one('bsTransitionEnd', removeElement)
        .emulateTransitionEnd(Alert.TRANSITION_DURATION) :
      removeElement()
  }


  // ALERT PLUGIN DEFINITION
  // =======================

  function Plugin(option) {
    return this.each(function () {
      var $this = $(this)
      var data  = $this.data('bs.alert')

      if (!data) $this.data('bs.alert', (data = new Alert(this)))
      if (typeof option == 'string') data[option].call($this)
    })
  }

  var old = $.fn.alert

  $.fn.alert             = Plugin
  $.fn.alert.Constructor = Alert


  // ALERT NO CONFLICT
  // =================

  $.fn.alert.noConflict = function () {
    $.fn.alert = old
    return this
  }


  // ALERT DATA-API
  // ==============

  $(document).on('click.bs.alert.data-api', dismiss, Alert.prototype.close)

}(jQuery);
;
/**
 * @file
 * Attaches behaviors for the Greentech Renewables theme.
 */

((Drupal, mdc) => {
  /**
   * CS theme namespace.
   *
   * @namespace
   */
  Drupal.cs = {
    /**
     * Add/remove an "open" class on element when toggleElement is clicked.
     *
     * @param {HTMLElement} element
     *   The element that should receive the "open" class when toggleElement is
     *   clicked.
     * @param {HTMLElement} toggleElement
     *   The element that, when clicked, should cause the "open" class to toggle
     *   on element.
     */
    makeToggleable(element, toggleElement) {
      toggleElement.addEventListener("click", () => {
        if (element.classList.contains("open")) {
          element.classList.remove("open");
        } else {
          element.classList.add("open");
        }
      });
    },

    /**
     * Support touch interaction with the menu dropdowns.
     *
     * First touch expands the menu, second touch follows the link.
     *
     * @param {string} selector
     *   CSS selector targeting the DOM element that is receiving an event.
     * @param {HTMLDocument|HTMLElement} context
     *   A DOM Element or Document used as context.
     */
    addTouchSupport(selector, context) {
      const $parents = jQuery(selector, context);

      $parents
        .once("cs-primary-nav-touch")
        .on("click mouseout", function action(event) {
          const $subMenu = jQuery(this).next("ul");

          switch (event.originalEvent.type) {
            case "click":
              if (!$subMenu.hasClass("open")) {
                // Submenu didn't have the open class, so this is the first
                // click.  Add class so submenu displays and prevent link
                // follow.
                $subMenu.addClass("open");
                event.preventDefault();
              }
              break;

            case "mouseout":
              // Close the menu.  Visitor is interacting with something else.
              $subMenu.removeClass("open");
              break;

            default:
          }
        });
    },

    /**
     * Size all breakout sections taking scrollbar width into account.
     */
    sizeBreakoutSections() {
      const width = `${document.documentElement.clientWidth}px`;
      const elements = document.querySelectorAll(".breakout");
      elements.forEach((element) => {
        element.style.width = width;
        element.style.left = `calc(-1 * (${width} - 100%) / 2)`;
      });
    },

    /**
     * Apply classes that depend on vertical scroll position.
     */
    applyScrollClasses() {
      const topAppBar = document.querySelector(".mdc-top-app-bar");
      if (topAppBar) {
        // We want the toolbar to appear embedded in the page until we're
        // beneath it, at which point we add the class that elevates it.
        if (window.scrollY > 64) {
          topAppBar.classList.add("mdc-top-app-bar--fixed-scrolled");
        } else {
          topAppBar.classList.remove("mdc-top-app-bar--fixed-scrolled");
        }
      }
    },
  };

  /**
   * Enable dark top styling if a through-top, dark-top hero block is found.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *  Attaches the behavior to the right context.
   */
  Drupal.behaviors.csHeroDarkenThroughTop = {
    attach(context) {
      if (context.querySelector(".block-hero.through-top.darken-top")) {
        document.body.classList.add("dark-top");
      }
    },
  };

  /**
   * Activate drawer and toggle.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *  Attaches the behavior to the right context.
   */
  Drupal.behaviors.csDrawer = {
    attach(context) {
      const toggleEl = context.querySelector(".drawer-toggle-primary");
      const appBarEl = context.querySelector("#app-bar");
      const drawerEl = context.querySelector(
        ".primary-drawer.mdc-drawer--modal"
      );

      if (drawerEl) {
        const topAppBar = mdc.topAppBar.MDCTopAppBar.attachTo(appBarEl);
        const modalDrawer = mdc.drawer.MDCDrawer.attachTo(drawerEl);

        // Listen for clicks of the navigation icon (sandwich).
        topAppBar.listen("MDCTopAppBar:nav", () => {
          if (!modalDrawer.open) {
            toggleEl.classList.add("menu-open");
            modalDrawer.open = true;
          } else {
            toggleEl.classList.remove("menu-open");
            modalDrawer.open = false;
          }
        });

        modalDrawer.listen("MDCDrawer:closed", () => {
          toggleEl.classList.remove("menu-open");
        });

        // Pre-expand drawer menu item that is active.
        const activeItem = drawerEl.querySelector(
          ".navbar-nav > li.active.expanded"
        );
        if (activeItem) {
          activeItem.classList.add("open");
        }

        // Expand and collapse drawer menu items on click.
        const dropdownToggles = drawerEl.querySelectorAll(".dropdown-toggle");
        dropdownToggles.forEach((toggle) =>
          toggle.addEventListener("click", (e) => {
            const el = e.currentTarget.parentNode;
            if (el.classList.contains("open")) {
              el.classList.remove("open");
            } else {
              el.classList.add("open");
            }
          })
        );
      }
    },
  };

  /**
   * Activate sidebar-first-filters region toggle.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *  Attaches the behavior to the right context.
   */
  Drupal.behaviors.csSidebarFirstFilters = {
    attach(context) {
      // Find the elements we'll be working with.
      const filtersEl = context.querySelector(".sidebar-first-filters");
      const toggleEl = context.querySelector(
        ".sidebar-first-filters .filters-title"
      );
      if (toggleEl) {
        // Hook up the toggle functionality.
        Drupal.cs.makeToggleable(filtersEl, toggleEl);
      }
    },
  };

  /**
   * Search enhancements.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *  Attaches the behavior to the right context.
   */
  Drupal.behaviors.csSearch = {
    attach(context) {
      // Turn the items-per-page block collapsible on title click.
      const ippBlockEl = context.querySelector(
        ".cs-base-search-items-per-page-block"
      );
      const ippToggleEl = context.querySelector(
        ".cs-base-search-items-per-page-block .block-title"
      );
      if (ippToggleEl) {
        // Hook up the toggle functionality.
        Drupal.cs.makeToggleable(ippBlockEl, ippToggleEl);
      }

      // Turn the sorts block collapsible on title click.
      const sortsBlockEl = context.querySelector(
        ".block-cs-search-api-sorts-blockviews-pagesolr-search-content__page-1"
      );
      const SortsToggleEl = context.querySelector(
        ".block-cs-search-api-sorts-blockviews-pagesolr-search-content__page-1 .block-title"
      );
      if (SortsToggleEl) {
        // Hook up the toggle functionality.
        Drupal.cs.makeToggleable(sortsBlockEl, SortsToggleEl);
      }
    },
  };

  /**
   * Support touch interaction with nav dropdowns.
   *
   * First touch opens the menu, second touch follows the link.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *  Attaches the behavior to the right context.
   */
  Drupal.behaviors.csDropdownNav = {
    attach(context) {
      // Add touch support to dropdown menus if the device is touch-enabled.
      // Credit to Minimit for this touch-device-check.
      // @see http://www.minimit.com/articles/solutions-tutorials/jquery-dropdowns-with-touch-support
      if (
        "ontouchstart" in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0
      ) {
        Drupal.cs.addTouchSupport("li.dropdown.expanded > a", context);
      }

      // Add touch support to the main menu in the drawer (for all devices)
      // because this menu doesn't support hover and needs to be expanded on
      // click even if the mouse is used.
      Drupal.cs.addTouchSupport(
        "#block-cs-main-menu ul.menu--main > li.expanded > a",
        context
      );
    },
  };

  /**
   * Breakout div enhancements.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *  Attaches the behavior to the right context.
   */
  Drupal.behaviors.csBreakout = {
    attach() {
      // Adjust breakout div width and position to account for scrollbar.
      Drupal.cs.sizeBreakoutSections();

      // Run again if the window is resized.
      window.addEventListener("resize", Drupal.cs.sizeBreakoutSections);
    },
  };

  /**
   * Adjustments necessary for form styling enhancements.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *  Attaches the behavior to the right context.
   */
  Drupal.behaviors.csFormStyle = {
    attach() {
      const items = document.querySelectorAll(
        "form:not(.webform-submission-newsletter-signup-form) .form-item.material"
      );
      for (let i = 0, len = items.length; i < len; i++) {
        const input = items[i].querySelector("input, textarea, select");
        const label = items[i].querySelector("label");
        if (input && label) {
          // Ensure input has a placeholder attribute that is an empty space.
          // Our styling rules will use the label as the placeholder, then
          // use ":placeholder-shown" to move the label out of the way when
          // text input is present.
          input.setAttribute("placeholder", " ");

          if (input.classList.contains("extension")) {
            label.textContent = Drupal.t("Ext.");
          }

          // Ensure label is placed immediately after input groups.
          if (input.parentElement.classList.contains("input-group")) {
            input.parentElement.insertBefore(label, input.nextSibling);
          }
        }
      }
    },
  };

  /**
   * Add a class to the top toolbar when the page is scrolled.
   *
   * Sets appropriate background and elevation.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *  Attaches the behavior to the right context.
   */
  Drupal.behaviors.csScrolled = {
    attach() {
      Drupal.cs.applyScrollClasses();

      let lastKnownScrollPosition = 0;
      document.addEventListener("scroll", () => {
        // If we have just reached the top of the page or have just moved
        // beneath the top toolbar, set the top toolbar class appropriately.
        if (
          (!window.scrollY && lastKnownScrollPosition) ||
          (window.scrollY > 64 && lastKnownScrollPosition < 64)
        ) {
          Drupal.cs.applyScrollClasses();
        }
        lastKnownScrollPosition = window.scrollY;
      });
    },
  };
})(Drupal, window.mdc);
;
/**
 * @file
 * CKEditor Accordion functionality.
 */

(function ($, Drupal, drupalSettings) {
  'use strict';
  Drupal.behaviors.ckeditorAccordion = {
    attach: function (context, settings) {

      // Create accordion functionality if the required elements exist is available.
      var $ckeditorAccordion = $('.ckeditor-accordion');
      if ($ckeditorAccordion.length > 0) {
        // Create simple accordion mechanism for each tab.
        $ckeditorAccordion.each(function () {
          var $accordion = $(this);
          if ($accordion.hasClass('styled')) {
            return;
          }

          // The first one is the correct one.
          if (!drupalSettings.ckeditorAccordion.accordionStyle.collapseAll) {
            $accordion.children('dt:first').addClass('active');
            $accordion.children('dd:first').addClass('active');
            $accordion.children('dd:first').css('display', 'block');
          }

          // Turn the accordion tabs to links so that the content is accessible & can be traversed using keyboard.
          $accordion.children('dt').each(function () {
            var $tab = $(this);
            var tabText = $tab.text().trim();
            var toggleClass = $tab.hasClass('active') ? ' active' : '';
            $tab.html('<a class="ckeditor-accordion-toggler" href="#"><span class="ckeditor-accordion-toggle' + toggleClass + '"></span>' + tabText + '</a>');
          });

          // Wrap the accordion in a div element so that quick edit function shows the source correctly.
          $accordion.addClass('styled').removeClass('ckeditor-accordion').wrap('<div class="ckeditor-accordion-container"></div>');

          // Trigger an ckeditorAccordionAttached event to let other frameworks know that the accordion has been attached.
          $accordion.trigger('ckeditorAccordionAttached');
        });

        // Add click event to body once because quick edits & ajax calls might reset the HTML.
        $('body').once('ckeditorAccordionToggleEvent').on('click', '.ckeditor-accordion-toggler', function (e) {
          var $t = $(this).parent();
          var $parent = $t.parent();

          // Clicking on open element, close it.
          if ($t.hasClass('active')) {
            $t.removeClass('active');
            $t.next().slideUp();
          }
          else {
            if(!drupalSettings.ckeditorAccordion.accordionStyle.keepRowsOpen) {
              // Remove active classes.
              $parent.children('dt.active').removeClass('active').children('a').removeClass('active');
              $parent.children('dd.active').slideUp(function () {
                $(this).removeClass('active');
              });
            }

            // Show the selected tab.
            $t.addClass('active');
            $t.next().slideDown(300).addClass('active');
          }

          // Don't add hash to url.
          e.preventDefault();
        });
      }
    }
  };
})(jQuery, Drupal, drupalSettings);
;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/
Drupal.debounce = function (func, wait, immediate) {
  var timeout;
  var result;
  return function () {
    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments[_key];
    }
    var context = this;
    var later = function later() {
      timeout = null;
      if (!immediate) {
        result = func.apply(context, args);
      }
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) {
      result = func.apply(context, args);
    }
    return result;
  };
};;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/
(function ($, Drupal, debounce) {
  $.fn.drupalGetSummary = function () {
    var callback = this.data('summaryCallback');
    return this[0] && callback ? callback(this[0]).trim() : '';
  };
  $.fn.drupalSetSummary = function (callback) {
    var self = this;
    if (typeof callback !== 'function') {
      var val = callback;
      callback = function callback() {
        return val;
      };
    }
    return this.data('summaryCallback', callback).off('formUpdated.summary').on('formUpdated.summary', function () {
      self.trigger('summaryUpdated');
    }).trigger('summaryUpdated');
  };
  Drupal.behaviors.formSingleSubmit = {
    attach: function attach() {
      function onFormSubmit(e) {
        var $form = $(e.currentTarget);
        var formValues = $form.serialize();
        var previousValues = $form.attr('data-drupal-form-submit-last');
        if (previousValues === formValues) {
          e.preventDefault();
        } else {
          $form.attr('data-drupal-form-submit-last', formValues);
        }
      }
      $(once('form-single-submit', 'body')).on('submit.singleSubmit', 'form:not([method~="GET"])', onFormSubmit);
    }
  };
  function triggerFormUpdated(element) {
    $(element).trigger('formUpdated');
  }
  function fieldsList(form) {
    return [].map.call(form.querySelectorAll('[name][id]'), function (el) {
      return el.id;
    });
  }
  Drupal.behaviors.formUpdated = {
    attach: function attach(context) {
      var $context = $(context);
      var contextIsForm = $context.is('form');
      var $forms = $(once('form-updated', contextIsForm ? $context : $context.find('form')));
      var formFields;
      if ($forms.length) {
        $.makeArray($forms).forEach(function (form) {
          var events = 'change.formUpdated input.formUpdated ';
          var eventHandler = debounce(function (event) {
            triggerFormUpdated(event.target);
          }, 300);
          formFields = fieldsList(form).join(',');
          form.setAttribute('data-drupal-form-fields', formFields);
          $(form).on(events, eventHandler);
        });
      }
      if (contextIsForm) {
        formFields = fieldsList(context).join(',');
        var currentFields = $(context).attr('data-drupal-form-fields');
        if (formFields !== currentFields) {
          triggerFormUpdated(context);
        }
      }
    },
    detach: function detach(context, settings, trigger) {
      var $context = $(context);
      var contextIsForm = $context.is('form');
      if (trigger === 'unload') {
        once.remove('form-updated', contextIsForm ? $context : $context.find('form')).forEach(function (form) {
          form.removeAttribute('data-drupal-form-fields');
          $(form).off('.formUpdated');
        });
      }
    }
  };
  Drupal.behaviors.fillUserInfoFromBrowser = {
    attach: function attach(context, settings) {
      var userInfo = ['name', 'mail', 'homepage'];
      var $forms = $(once('user-info-from-browser', '[data-user-info-from-browser]'));
      if ($forms.length) {
        userInfo.forEach(function (info) {
          var $element = $forms.find("[name=".concat(info, "]"));
          var browserData = localStorage.getItem("Drupal.visitor.".concat(info));
          if (!$element.length) {
            return;
          }
          var emptyValue = $element[0].value === '';
          var defaultValue = $element.attr('data-drupal-default-value') === $element[0].value;
          if (browserData && (emptyValue || defaultValue)) {
            $element.each(function (index, item) {
              item.value = browserData;
            });
          }
        });
      }
      $forms.on('submit', function () {
        userInfo.forEach(function (info) {
          var $element = $forms.find("[name=".concat(info, "]"));
          if ($element.length) {
            localStorage.setItem("Drupal.visitor.".concat(info), $element[0].value);
          }
        });
      });
    }
  };
  var handleFragmentLinkClickOrHashChange = function handleFragmentLinkClickOrHashChange(e) {
    var url;
    if (e.type === 'click') {
      url = e.currentTarget.location ? e.currentTarget.location : e.currentTarget;
    } else {
      url = window.location;
    }
    var hash = url.hash.substr(1);
    if (hash) {
      var $target = $("#".concat(hash));
      $('body').trigger('formFragmentLinkClickOrHashChange', [$target]);
      setTimeout(function () {
        return $target.trigger('focus');
      }, 300);
    }
  };
  var debouncedHandleFragmentLinkClickOrHashChange = debounce(handleFragmentLinkClickOrHashChange, 300, true);
  $(window).on('hashchange.form-fragment', debouncedHandleFragmentLinkClickOrHashChange);
  $(document).on('click.form-fragment', 'a[href*="#"]', debouncedHandleFragmentLinkClickOrHashChange);
})(jQuery, Drupal, Drupal.debounce);;
/**
 * @file
 * Extends methods from core/misc/form.js.
 */

(function ($, window, Drupal, drupalSettings, once) {

  /**
   * Behavior for "forms_has_error_value_toggle" theme setting.
   */
  Drupal.behaviors.bootstrapForm = {
    attach: function (context) {
      if (drupalSettings.bootstrap && drupalSettings.bootstrap.forms_has_error_value_toggle) {
        var $context = $(context);
        $(once('error', '.form-item.has-error:not(.form-type-password.has-feedback)', context)).each(function () {
          var $formItem = $(this);
          var $input = $formItem.find(':input');
          $input.on('keyup focus blur', function () {
            if (this.defaultValue !== void 0) {
              $formItem[this.defaultValue !== this.value ? 'removeClass' : 'addClass']('has-error');
              $input[this.defaultValue !== this.value ? 'removeClass' : 'addClass']('error');
            }
          });
        });
      }
    }
  };


})(jQuery, this, Drupal, drupalSettings, once);
;
/**
 * @file
 * Webform behaviors.
 */

(function ($, Drupal) {

  'use strict';

  // Trigger Drupal's attaching of behaviors after the page is
  // completely loaded.
  // @see https://stackoverflow.com/questions/37838430/detect-if-page-is-load-from-back-button
  // @see https://stackoverflow.com/questions/20899274/how-to-refresh-page-on-back-button-click/20899422#20899422
  var isChrome = (/chrom(e|ium)/.test(window.navigator.userAgent.toLowerCase()));
  if (isChrome) {
    // Track back button in navigation.
    // @see https://stackoverflow.com/questions/37838430/detect-if-page-is-load-from-back-button
    var backButton = false;
    if (window.performance) {
      var navEntries = window.performance.getEntriesByType('navigation');
      if (navEntries.length > 0 && navEntries[0].type === 'back_forward') {
        backButton = true;
      }
      else if (window.performance.navigation
        && window.performance.navigation.type === window.performance.navigation.TYPE_BACK_FORWARD) {
        backButton = true;
      }
    }

    // If the back button is pressed, delay Drupal's attaching of behaviors.
    if (backButton) {
      var attachBehaviors = Drupal.attachBehaviors;
      Drupal.attachBehaviors = function (context, settings) {
        setTimeout(function (context, settings) {
          attachBehaviors(context, settings);
        }, 300);
      };
    }
  }

})(jQuery, Drupal);
;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/
(function ($, Drupal) {
  var states = {
    postponed: []
  };
  Drupal.states = states;
  function invert(a, invertState) {
    return invertState && typeof a !== 'undefined' ? !a : a;
  }
  function _compare2(a, b) {
    if (a === b) {
      return typeof a === 'undefined' ? a : true;
    }
    return typeof a === 'undefined' || typeof b === 'undefined';
  }
  function ternary(a, b) {
    if (typeof a === 'undefined') {
      return b;
    }
    if (typeof b === 'undefined') {
      return a;
    }
    return a && b;
  }
  Drupal.behaviors.states = {
    attach: function attach(context, settings) {
      var $states = $(context).find('[data-drupal-states]');
      var il = $states.length;
      var _loop = function _loop(i) {
        var config = JSON.parse($states[i].getAttribute('data-drupal-states'));
        Object.keys(config || {}).forEach(function (state) {
          new states.Dependent({
            element: $($states[i]),
            state: states.State.sanitize(state),
            constraints: config[state]
          });
        });
      };
      for (var i = 0; i < il; i++) {
        _loop(i);
      }
      while (states.postponed.length) {
        states.postponed.shift()();
      }
    }
  };
  states.Dependent = function (args) {
    var _this = this;
    $.extend(this, {
      values: {},
      oldValue: null
    }, args);
    this.dependees = this.getDependees();
    Object.keys(this.dependees || {}).forEach(function (selector) {
      _this.initializeDependee(selector, _this.dependees[selector]);
    });
  };
  states.Dependent.comparisons = {
    RegExp: function RegExp(reference, value) {
      return reference.test(value);
    },
    Function: function Function(reference, value) {
      return reference(value);
    },
    Number: function Number(reference, value) {
      return typeof value === 'string' ? _compare2(reference.toString(), value) : _compare2(reference, value);
    }
  };
  states.Dependent.prototype = {
    initializeDependee: function initializeDependee(selector, dependeeStates) {
      var _this2 = this;
      this.values[selector] = {};
      Object.keys(dependeeStates).forEach(function (i) {
        var state = dependeeStates[i];
        if ($.inArray(state, dependeeStates) === -1) {
          return;
        }
        state = states.State.sanitize(state);
        _this2.values[selector][state.name] = null;
        $(selector).on("state:".concat(state), {
          selector: selector,
          state: state
        }, function (e) {
          _this2.update(e.data.selector, e.data.state, e.value);
        });
        new states.Trigger({
          selector: selector,
          state: state
        });
      });
    },
    compare: function compare(reference, selector, state) {
      var value = this.values[selector][state.name];
      if (reference.constructor.name in states.Dependent.comparisons) {
        return states.Dependent.comparisons[reference.constructor.name](reference, value);
      }
      return _compare2(reference, value);
    },
    update: function update(selector, state, value) {
      if (value !== this.values[selector][state.name]) {
        this.values[selector][state.name] = value;
        this.reevaluate();
      }
    },
    reevaluate: function reevaluate() {
      var value = this.verifyConstraints(this.constraints);
      if (value !== this.oldValue) {
        this.oldValue = value;
        value = invert(value, this.state.invert);
        this.element.trigger({
          type: "state:".concat(this.state),
          value: value,
          trigger: true
        });
      }
    },
    verifyConstraints: function verifyConstraints(constraints, selector) {
      var result;
      if ($.isArray(constraints)) {
        var hasXor = $.inArray('xor', constraints) === -1;
        var len = constraints.length;
        for (var i = 0; i < len; i++) {
          if (constraints[i] !== 'xor') {
            var constraint = this.checkConstraints(constraints[i], selector, i);
            if (constraint && (hasXor || result)) {
              return hasXor;
            }
            result = result || constraint;
          }
        }
      } else if ($.isPlainObject(constraints)) {
        for (var n in constraints) {
          if (constraints.hasOwnProperty(n)) {
            result = ternary(result, this.checkConstraints(constraints[n], selector, n));
            if (result === false) {
              return false;
            }
          }
        }
      }
      return result;
    },
    checkConstraints: function checkConstraints(value, selector, state) {
      if (typeof state !== 'string' || /[0-9]/.test(state[0])) {
        state = null;
      } else if (typeof selector === 'undefined') {
        selector = state;
        state = null;
      }
      if (state !== null) {
        state = states.State.sanitize(state);
        return invert(this.compare(value, selector, state), state.invert);
      }
      return this.verifyConstraints(value, selector);
    },
    getDependees: function getDependees() {
      var cache = {};
      var _compare = this.compare;
      this.compare = function (reference, selector, state) {
        (cache[selector] || (cache[selector] = [])).push(state.name);
      };
      this.verifyConstraints(this.constraints);
      this.compare = _compare;
      return cache;
    }
  };
  states.Trigger = function (args) {
    $.extend(this, args);
    if (this.state in states.Trigger.states) {
      this.element = $(this.selector);
      if (!this.element.data("trigger:".concat(this.state))) {
        this.initialize();
      }
    }
  };
  states.Trigger.prototype = {
    initialize: function initialize() {
      var _this3 = this;
      var trigger = states.Trigger.states[this.state];
      if (typeof trigger === 'function') {
        trigger.call(window, this.element);
      } else {
        Object.keys(trigger || {}).forEach(function (event) {
          _this3.defaultTrigger(event, trigger[event]);
        });
      }
      this.element.data("trigger:".concat(this.state), true);
    },
    defaultTrigger: function defaultTrigger(event, valueFn) {
      var oldValue = valueFn.call(this.element);
      this.element.on(event, $.proxy(function (e) {
        var value = valueFn.call(this.element, e);
        if (oldValue !== value) {
          this.element.trigger({
            type: "state:".concat(this.state),
            value: value,
            oldValue: oldValue
          });
          oldValue = value;
        }
      }, this));
      states.postponed.push($.proxy(function () {
        this.element.trigger({
          type: "state:".concat(this.state),
          value: oldValue,
          oldValue: null
        });
      }, this));
    }
  };
  states.Trigger.states = {
    empty: {
      keyup: function keyup() {
        return this.val() === '';
      },
      change: function change() {
        return this.val() === '';
      }
    },
    checked: {
      change: function change() {
        var checked = false;
        this.each(function () {
          checked = $(this).prop('checked');
          return !checked;
        });
        return checked;
      }
    },
    value: {
      keyup: function keyup() {
        if (this.length > 1) {
          return this.filter(':checked').val() || false;
        }
        return this.val();
      },
      change: function change() {
        if (this.length > 1) {
          return this.filter(':checked').val() || false;
        }
        return this.val();
      }
    },
    collapsed: {
      collapsed: function collapsed(e) {
        return typeof e !== 'undefined' && 'value' in e ? e.value : !this.is('[open]');
      }
    }
  };
  states.State = function (state) {
    this.pristine = state;
    this.name = state;
    var process = true;
    do {
      while (this.name.charAt(0) === '!') {
        this.name = this.name.substring(1);
        this.invert = !this.invert;
      }
      if (this.name in states.State.aliases) {
        this.name = states.State.aliases[this.name];
      } else {
        process = false;
      }
    } while (process);
  };
  states.State.sanitize = function (state) {
    if (state instanceof states.State) {
      return state;
    }
    return new states.State(state);
  };
  states.State.aliases = {
    enabled: '!disabled',
    invisible: '!visible',
    invalid: '!valid',
    untouched: '!touched',
    optional: '!required',
    filled: '!empty',
    unchecked: '!checked',
    irrelevant: '!relevant',
    expanded: '!collapsed',
    open: '!collapsed',
    closed: 'collapsed',
    readwrite: '!readonly'
  };
  states.State.prototype = {
    invert: false,
    toString: function toString() {
      return this.name;
    }
  };
  var $document = $(document);
  $document.on('state:disabled', function (e) {
    if (e.trigger) {
      $(e.target).closest('.js-form-item, .js-form-submit, .js-form-wrapper').toggleClass('form-disabled', e.value).find('select, input, textarea').prop('disabled', e.value);
    }
  });
  $document.on('state:required', function (e) {
    if (e.trigger) {
      if (e.value) {
        var label = "label".concat(e.target.id ? "[for=".concat(e.target.id, "]") : '');
        var $label = $(e.target).attr({
          required: 'required',
          'aria-required': 'true'
        }).closest('.js-form-item, .js-form-wrapper').find(label);
        if (!$label.hasClass('js-form-required').length) {
          $label.addClass('js-form-required form-required');
        }
      } else {
        $(e.target).removeAttr('required aria-required').closest('.js-form-item, .js-form-wrapper').find('label.js-form-required').removeClass('js-form-required form-required');
      }
    }
  });
  $document.on('state:visible', function (e) {
    if (e.trigger) {
      $(e.target).closest('.js-form-item, .js-form-submit, .js-form-wrapper').toggle(e.value);
    }
  });
  $document.on('state:checked', function (e) {
    if (e.trigger) {
      $(e.target).closest('.js-form-item, .js-form-wrapper').find('input').prop('checked', e.value).trigger('change');
    }
  });
  $document.on('state:collapsed', function (e) {
    if (e.trigger) {
      if ($(e.target).is('[open]') === e.value) {
        $(e.target).find('> summary').trigger('click');
      }
    }
  });
})(jQuery, Drupal);;
/**
 * @file
 * Extends core/misc/states.js.
 */
(function($) {

  // Unbind core state.js from document first so we can then override below.
  $(document).unbind('state:disabled');

  /**
   * Global state change handlers. These are bound to "document" to cover all
   * elements whose state changes. Events sent to elements within the page
   * bubble up to these handlers. We use this system so that themes and modules
   * can override these state change handlers for particular parts of a page.
   */
  $(document).bind('state:disabled', function(e) {
    // Only act when this change was triggered by a dependency and not by the
    // element monitoring itself.
    if (e.trigger) {
      $(e.target)
        .attr('disabled', e.value)
        .closest('.form-item, .form-submit, .form-wrapper').toggleClass('form-disabled', e.value)
        .find(':input').attr('disabled', e.value);

      // Note: WebKit nightlies don't reflect that change correctly.
      // See https://bugs.webkit.org/show_bug.cgi?id=23789
    }
  });

})(jQuery);
;
/**
 * @file
 * JavaScript behaviors for custom webform #states.
 */

(function ($, Drupal) {

  'use strict';

  Drupal.webform = Drupal.webform || {};
  Drupal.webform.states = Drupal.webform.states || {};
  Drupal.webform.states.slideDown = Drupal.webform.states.slideDown || {};
  Drupal.webform.states.slideDown.duration = 'slow';
  Drupal.webform.states.slideUp = Drupal.webform.states.slideUp || {};
  Drupal.webform.states.slideUp.duration = 'fast';

  /* ************************************************************************ */
  // jQuery functions.
  /* ************************************************************************ */

  /**
   * Check if an element has a specified data attribute.
   *
   * @param {string} data
   *   The data attribute name.
   *
   * @return {boolean}
   *   TRUE if an element has a specified data attribute.
   */
  $.fn.hasData = function (data) {
    return (typeof this.data(data) !== 'undefined');
  };

  /**
   * Check if element is within the webform or not.
   *
   * @return {boolean}
   *   TRUE if element is within the webform.
   */
  $.fn.isWebform = function () {
    return $(this).closest('form.webform-submission-form, form[id^="webform"], form[data-is-webform]').length ? true : false;
  };

  /**
   * Check if element is to be treated as a webform element.
   *
   * @return {boolean}
   *   TRUE if element is to be treated as a webform element.
   */
  $.fn.isWebformElement = function () {
    return ($(this).isWebform() || $(this).closest('[data-is-webform-element]').length) ? true : false;
  };

  /* ************************************************************************ */
  // Trigger.
  /* ************************************************************************ */

  // The change event is triggered by cut-n-paste and select menus.
  // Issue #2445271: #states element empty check not triggered on mouse
  // based paste.
  // @see https://www.drupal.org/node/2445271
  Drupal.states.Trigger.states.empty.change = function change() {
    return this.val() === '';
  };

  /* ************************************************************************ */
  // Dependents.
  /* ************************************************************************ */

  // Apply solution included in #1962800 patch.
  // Issue #1962800: Form #states not working with literal integers as
  // values in IE11.
  // @see https://www.drupal.org/project/drupal/issues/1962800
  // @see https://www.drupal.org/files/issues/core-states-not-working-with-integers-ie11_1962800_46.patch
  //
  // This issue causes pattern, less than, and greater than support to break.
  // @see https://www.drupal.org/project/webform/issues/2981724
  var states = Drupal.states;
  Drupal.states.Dependent.prototype.compare = function compare(reference, selector, state) {
    var value = this.values[selector][state.name];

    var name = reference.constructor.name;
    if (!name) {
      name = $.type(reference);

      name = name.charAt(0).toUpperCase() + name.slice(1);
    }
    if (name in states.Dependent.comparisons) {
      return states.Dependent.comparisons[name](reference, value);
    }

    if (reference.constructor.name in states.Dependent.comparisons) {
      return states.Dependent.comparisons[reference.constructor.name](reference, value);
    }

    return _compare2(reference, value);
  };
  function _compare2(a, b) {
    if (a === b) {
      return typeof a === 'undefined' ? a : true;
    }

    return typeof a === 'undefined' || typeof b === 'undefined';
  }

  // Adds pattern, less than, and greater than support to #state API.
  // @see http://drupalsun.com/julia-evans/2012/03/09/extending-form-api-states-regular-expressions
  Drupal.states.Dependent.comparisons.Object = function (reference, value) {
    if ('pattern' in reference) {
      return (new RegExp(reference['pattern'])).test(value);
    }
    else if ('!pattern' in reference) {
      return !((new RegExp(reference['!pattern'])).test(value));
    }
    else if ('less' in reference) {
      return (value !== '' && parseFloat(reference['less']) > parseFloat(value));
    }
    else if ('less_equal' in reference) {
      return (value !== '' && parseFloat(reference['less_equal']) >= parseFloat(value));
    }
    else if ('greater' in reference) {
      return (value !== '' && parseFloat(reference['greater']) < parseFloat(value));
    }
    else if ('greater_equal' in reference) {
      return (value !== '' && parseFloat(reference['greater_equal']) <= parseFloat(value));
    }
    else if ('between' in reference || '!between' in reference) {
      if (value === '') {
        return false;
      }

      var between = reference['between'] || reference['!between'];
      var betweenParts = between.split(':');
      var greater = betweenParts[0];
      var less = (typeof betweenParts[1] !== 'undefined') ? betweenParts[1] : null;
      var isGreaterThan = (greater === null || greater === '' || parseFloat(value) >= parseFloat(greater));
      var isLessThan = (less === null || less === '' || parseFloat(value) <= parseFloat(less));
      var result = (isGreaterThan && isLessThan);
      return (reference['!between']) ? !result : result;
    }
    else {
      return reference.indexOf(value) !== false;
    }
  };

  /* ************************************************************************ */
  // States events.
  /* ************************************************************************ */

  var $document = $(document);

  $document.on('state:required', function (e) {
    if (e.trigger && $(e.target).isWebformElement()) {
      var $target = $(e.target);
      // Fix #required file upload.
      // @see Issue #2860529: Conditional required File upload field don't work.
      toggleRequired($target.find('input[type="file"]'), e.value);

      // Fix #required for radios and likert.
      // @see Issue #2856795: If radio buttons are required but not filled form is nevertheless submitted.
      if ($target.is('.js-form-type-radios, .js-form-type-webform-radios-other, .js-webform-type-radios, .js-webform-type-webform-radios-other, .js-webform-type-webform-entity-radios, .webform-likert-table')) {
        $target.toggleClass('required', e.value);
        toggleRequired($target.find('input[type="radio"]'), e.value);
      }

      // Fix #required for checkboxes.
      // @see Issue #2938414: Checkboxes don't support #states required.
      // @see checkboxRequiredhandler
      if ($target.is('.js-form-type-checkboxes, .js-form-type-webform-checkboxes-other, .js-webform-type-checkboxes, .js-webform-type-webform-checkboxes-other')) {
        $target.toggleClass('required', e.value);
        var $checkboxes = $target.find('input[type="checkbox"]');
        if (e.value) {
          // Add event handler.
          $checkboxes.on('click', statesCheckboxesRequiredEventHandler);
          // Initialize and add required attribute.
          checkboxesRequired($target);
        }
        else {
          // Remove event handler.
          $checkboxes.off('click', statesCheckboxesRequiredEventHandler);
          // Remove required attribute.
          toggleRequired($checkboxes, false);
        }
      }

      // Fix #required for tableselect.
      // @see Issue #3212581: Table select does not trigger client side validation
      if ($target.is('.js-webform-tableselect')) {
        $target.toggleClass('required', e.value);
        var isMultiple = $target.is('[multiple]');
        if (isMultiple) {
          // Checkboxes.
          var $tbody = $target.find('tbody');
          var $checkboxes = $tbody.find('input[type="checkbox"]');
          copyRequireMessage($target, $checkboxes);
          if (e.value) {
            $checkboxes.on('click change', statesCheckboxesRequiredEventHandler);
            checkboxesRequired($tbody);
          }
          else {
            $checkboxes.off('click change ', statesCheckboxesRequiredEventHandler);
            toggleRequired($tbody, false);
          }
        }
        else {
          // Radios.
          var $radios = $target.find('input[type="radio"]');
          copyRequireMessage($target, $radios);
          toggleRequired($radios, e.value);
        }
      }

      // Fix required label for elements without the for attribute.
      // @see Issue #3145300: Conditional Visible Select Other not working.
      if ($target.is('.js-form-type-webform-select-other, .js-webform-type-webform-select-other')) {
        var $select = $target.find('select');
        toggleRequired($select, e.value);
        copyRequireMessage($target, $select);
      }
      if ($target.find('> label:not([for])').length) {
        $target.find('> label').toggleClass('js-form-required form-required', e.value);
      }

      // Fix required label for checkboxes and radios.
      // @see Issue #2938414: Checkboxes don't support #states required
      // @see Issue #2731991: Setting required on radios marks all options required.
      // @see Issue #2856315: Conditional Logic - Requiring Radios in a Fieldset.
      // Fix #required for fieldsets.
      // @see Issue #2977569: Hidden fieldsets that become visible with conditional logic cannot be made required.
      if ($target.is('.js-webform-type-radios, .js-webform-type-checkboxes, fieldset')) {
        $target.find('legend span.fieldset-legend:not(.visually-hidden)').toggleClass('js-form-required form-required', e.value);
      }

      // Issue #2986017: Fieldsets shouldn't have required attribute.
      if ($target.is('fieldset')) {
        $target.removeAttr('required aria-required');
      }
    }
  });

  $document.on('state:checked', function (e) {
    if (e.trigger) {
      $(e.target).trigger('change');
    }
  });

  $document.on('state:readonly', function (e) {
    if (e.trigger && $(e.target).isWebformElement()) {
      $(e.target).prop('readonly', e.value).closest('.js-form-item, .js-form-wrapper').toggleClass('webform-readonly', e.value).find('input, textarea').prop('readonly', e.value);

      // Trigger webform:readonly.
      $(e.target).trigger('webform:readonly')
        .find('select, input, textarea, button').trigger('webform:readonly');
    }
  });

  $document.on('state:visible state:visible-slide', function (e) {
    if (e.trigger && $(e.target).isWebformElement()) {
      if (e.value) {
        $(':input', e.target).addBack().each(function () {
          restoreValueAndRequired(this);
          triggerEventHandlers(this);
        });
      }
      else {
        // @see https://www.sitepoint.com/jquery-function-clear-form-data/
        $(':input', e.target).addBack().each(function () {
          backupValueAndRequired(this);
          clearValueAndRequired(this);
          triggerEventHandlers(this);
        });
      }
    }
  });

  $document.on('state:visible-slide', function (e) {
    if (e.trigger && $(e.target).isWebformElement()) {
      var effect = e.value ? 'slideDown' : 'slideUp';
      var duration = Drupal.webform.states[effect].duration;
      $(e.target).closest('.js-form-item, .js-form-submit, .js-form-wrapper')[effect](duration);
    }
  });
  Drupal.states.State.aliases['invisible-slide'] = '!visible-slide';

  $document.on('state:disabled', function (e) {
    if (e.trigger && $(e.target).isWebformElement()) {
      // Make sure disabled property is set before triggering webform:disabled.
      // Copied from: core/misc/states.js
      $(e.target)
        .prop('disabled', e.value)
        .closest('.js-form-item, .js-form-submit, .js-form-wrapper').toggleClass('form-disabled', e.value)
        .find('select, input, textarea, button').prop('disabled', e.value);

      // Never disable hidden file[fids] because the existing values will
      // be completely lost when the webform is submitted.
      var fileElements = $(e.target)
        .find(':input[type="hidden"][name$="[fids]"]');
      if (fileElements.length) {
        // Remove 'disabled' attribute from fieldset which will block
        // all disabled elements from being submitted.
        if ($(e.target).is('fieldset')) {
          $(e.target).prop('disabled', false);
        }
        fileElements.removeAttr('disabled');
      }

      // Trigger webform:disabled.
      $(e.target).trigger('webform:disabled')
        .find('select, input, textarea, button').trigger('webform:disabled');
    }
  });

  /* ************************************************************************ */
  // Behaviors.
  /* ************************************************************************ */

  /**
   * Adds HTML5 validation to required checkboxes.
   *
   * @type {Drupal~behavior}
   *
   * @see https://www.drupal.org/project/webform/issues/3068998
   */
  Drupal.behaviors.webformCheckboxesRequired = {
    attach: function (context) {
      $('.js-form-type-checkboxes.required, .js-form-type-webform-checkboxes-other.required, .js-webform-type-checkboxes.required, .js-webform-type-webform-checkboxes-other.required, .js-webform-type-webform-radios-other.checkboxes', context)
        .once('webform-checkboxes-required')
        .each(function () {
          var $element = $(this);
          $element.find('input[type="checkbox"]').on('click', statesCheckboxesRequiredEventHandler);
          setTimeout(function () {checkboxesRequired($element);});
        });
    }
  };

  /**
   * Adds HTML5 validation to required radios.
   *
   * @type {Drupal~behavior}
   *
   * @see https://www.drupal.org/project/webform/issues/2856795
   */
  Drupal.behaviors.webformRadiosRequired = {
    attach: function (context) {
      $('.js-form-type-radios, .js-form-type-webform-radios-other, .js-webform-type-radios, .js-webform-type-webform-radios-other, .js-webform-type-webform-entity-radios, .js-webform-type-webform-scale', context)
        .once('webform-radios-required')
        .each(function () {
          var $element = $(this);
          setTimeout(function () {radiosRequired($element);});
        });
    }
  };

 /**
   * Adds HTML5 validation to required table select.
   *
   * @type {Drupal~behavior}
   *
   * @see https://www.drupal.org/project/webform/issues/2856795
   */
  Drupal.behaviors.webformTableSelectRequired = {
    attach: function (context) {
      $('.js-webform-tableselect.required', context)
        .once('webform-tableselect-required')
        .each(function () {
          var $element = $(this);
          var $tbody = $element.find('tbody');
          var isMultiple = $element.is('[multiple]');

          if (isMultiple) {
            // Check all checkbox triggers checkbox 'change' event on
            // select and deselect all.
            // @see Drupal.tableSelect
            $tbody.find('input[type="checkbox"]').on('click change', function () {
              checkboxesRequired($tbody);
            });
          }

          setTimeout(function () {
            isMultiple ? checkboxesRequired($tbody) : radiosRequired($element);
          });
        });
    }
  };

  /**
   * Add HTML5 multiple checkboxes required validation.
   *
   * @param {jQuery} $element
   *   An jQuery object containing HTML5 radios.
   *
   * @see https://stackoverflow.com/a/37825072/145846
   */
  function checkboxesRequired($element) {
    var $firstCheckbox = $element.find('input[type="checkbox"]').first();
    var isChecked = $element.find('input[type="checkbox"]').is(':checked');
    toggleRequired($firstCheckbox, !isChecked);
    copyRequireMessage($element, $firstCheckbox);
  }

  /**
   * Add HTML5 radios required validation.
   *
   * @param {jQuery} $element
   *   An jQuery object containing HTML5 radios.
   *
   * @see https://www.drupal.org/project/webform/issues/2856795
   */
  function radiosRequired($element) {
    var $radios = $element.find('input[type="radio"]');
    var isRequired = $element.hasClass('required');
    toggleRequired($radios, isRequired);
    copyRequireMessage($element, $radios);
  }

  /* ************************************************************************ */
  // Event handlers.
  /* ************************************************************************ */

  /**
   * Trigger #states API HTML5 multiple checkboxes required validation.
   *
   * @see https://stackoverflow.com/a/37825072/145846
   */
  function statesCheckboxesRequiredEventHandler() {
    var $element = $(this).closest('.js-webform-type-checkboxes, .js-webform-type-webform-checkboxes-other');
    checkboxesRequired($element);
  }

  /**
   * Trigger an input's event handlers.
   *
   * @param {element} input
   *   An input.
   */
  function triggerEventHandlers(input) {
    var $input = $(input);
    var type = input.type;
    var tag = input.tagName.toLowerCase();
    // Add 'webform.states' as extra parameter to event handlers.
    // @see Drupal.behaviors.webformUnsaved
    var extraParameters = ['webform.states'];
    if (type === 'checkbox' || type === 'radio') {
      $input
        .trigger('change', extraParameters)
        .trigger('blur', extraParameters);
    }
    else if (tag === 'select') {
      // Do not trigger the onchange event for Address element's country code
      // when it is initialized.
      // @see \Drupal\address\Element\Country
      if ($input.closest('.webform-type-address').length) {
        if (!$input.data('webform-states-address-initialized')
          && $input.attr('autocomplete') === 'country'
          && $input.val() === $input.find("option[selected]").attr('value')) {
          return;
        }
        $input.data('webform-states-address-initialized', true);
      }

      $input
        .trigger('change', extraParameters)
        .trigger('blur', extraParameters);
    }
    else if (type !== 'submit' && type !== 'button' && type !== 'file') {
      // Make sure input mask is removed and then reset when value is restored.
      // @see https://www.drupal.org/project/webform/issues/3124155
      // @see https://www.drupal.org/project/webform/issues/3202795
      var hasInputMask = ($.fn.inputmask && $input.hasClass('js-webform-input-mask'));
      hasInputMask && $input.inputmask('remove');

      $input
        .trigger('input', extraParameters)
        .trigger('change', extraParameters)
        .trigger('keydown', extraParameters)
        .trigger('keyup', extraParameters)
        .trigger('blur', extraParameters);

      hasInputMask && $input.inputmask();
    }
  }

  /* ************************************************************************ */
  // Backup and restore value functions.
  /* ************************************************************************ */

  /**
   * Backup an input's current value and required attribute
   *
   * @param {element} input
   *   An input.
   */
  function backupValueAndRequired(input) {
    var $input = $(input);
    var type = input.type;
    var tag = input.tagName.toLowerCase(); // Normalize case.

    // Backup required.
    if ($input.prop('required') && !$input.hasData('webform-required')) {
      $input.data('webform-required', true);
    }

    // Backup value.
    if (!$input.hasData('webform-value')) {
      if (type === 'checkbox' || type === 'radio') {
        $input.data('webform-value', $input.prop('checked'));
      }
      else if (tag === 'select') {
        var values = [];
        $input.find('option:selected').each(function (i, option) {
          values[i] = option.value;
        });
        $input.data('webform-value', values);
      }
      else if (type !== 'submit' && type !== 'button') {
        $input.data('webform-value', input.value);
      }
    }
  }

  /**
   * Restore an input's value and required attribute.
   *
   * @param {element} input
   *   An input.
   */
  function restoreValueAndRequired(input) {
    var $input = $(input);

    // Restore value.
    var value = $input.data('webform-value');
    if (typeof value !== 'undefined') {
      var type = input.type;
      var tag = input.tagName.toLowerCase(); // Normalize case.

      if (type === 'checkbox' || type === 'radio') {
        $input.prop('checked', value);
      }
      else if (tag === 'select') {
        $.each(value, function (i, option_value) {
          // Prevent "Syntax error, unrecognized expression" error by
          // escaping single quotes.
          // @see https://forum.jquery.com/topic/escape-characters-prior-to-using-selector
          option_value = option_value.replace(/'/g, "\\\'");
          $input.find("option[value='" + option_value + "']").prop('selected', true);
        });
      }
      else if (type !== 'submit' && type !== 'button') {
        input.value = value;
      }
      $input.removeData('webform-value');
    }

    // Restore required.
    var required = $input.data('webform-required');
    if (typeof required !== 'undefined') {
      if (required) {
        $input.prop('required', true);
      }
      $input.removeData('webform-required');
    }
  }

  /**
   * Clear an input's value and required attributes.
   *
   * @param {element} input
   *   An input.
   */
  function clearValueAndRequired(input) {
    var $input = $(input);

    // Check for #states no clear attribute.
    // @see https://css-tricks.com/snippets/jquery/make-an-jquery-hasattr/
    if ($input.closest('[data-webform-states-no-clear]').length) {
      return;
    }

    // Clear value.
    var type = input.type;
    var tag = input.tagName.toLowerCase(); // Normalize case.
    if (type === 'checkbox' || type === 'radio') {
      $input.prop('checked', false);
    }
    else if (tag === 'select') {
      if ($input.find('option[value=""]').length) {
        $input.val('');
      }
      else {
        input.selectedIndex = -1;
      }
    }
    else if (type !== 'submit' && type !== 'button') {
      input.value = (type === 'color') ? '#000000' : '';
    }

    // Clear required.
    $input.prop('required', false);
  }

  /* ************************************************************************ */
  // Helper functions.
  /* ************************************************************************ */

  /**
   * Toggle an input's required attributes.
   *
   * @param {element} $input
   *   An input.
   * @param {boolean} required
   *   Is input required.
   */
  function toggleRequired($input, required) {
    var isCheckboxOrRadio = ($input.attr('type') === 'radio' || $input.attr('type') === 'checkbox');
    if (required) {
      if (isCheckboxOrRadio) {
        $input.attr({'required': 'required'});
      }
      else {
        $input.attr({'required': 'required', 'aria-required': 'true'});
      }
    }
    else {
      if (isCheckboxOrRadio) {
        $input.removeAttr('required');
      }
      else {
        $input.removeAttr('required aria-required');
      }
    }
  }

  /**
   * Copy the clientside_validation.module's message.
   *
   * @param {jQuery} $source
   *   The source element.
   * @param {jQuery} $destination
   *   The destination element.
   */
  function copyRequireMessage($source, $destination) {
    if ($source.attr('data-msg-required')) {
      $destination.attr('data-msg-required', $source.attr('data-msg-required'));
    }
  }

})(jQuery, Drupal);
;
/**
 * @file
 * JavaScript behaviors for webforms.
 */

(function ($, Drupal) {

  'use strict';

  /**
   * Remove single submit event listener.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches the behavior for removing single submit event listener.
   *
   * @see Drupal.behaviors.formSingleSubmit
   */
  Drupal.behaviors.webformRemoveFormSingleSubmit = {
    attach: function attach() {
      function onFormSubmit(e) {
        var $form = $(e.currentTarget);
        $form.removeAttr('data-drupal-form-submit-last');
      }
      $('body')
        .once('webform-single-submit')
        .on('submit.singleSubmit', 'form.webform-remove-single-submit', onFormSubmit);
    }
  };

  /**
   * Prevent webform autosubmit on wizard pages.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches the behavior for disabling webform autosubmit.
   *   Wizard pages need to be progressed with the Previous or Next buttons,
   *   not by pressing Enter.
   */
  Drupal.behaviors.webformDisableAutoSubmit = {
    attach: function (context) {
      // Not using context so that inputs loaded via Ajax will have autosubmit
      // disabled.
      // @see http://stackoverflow.com/questions/11235622/jquery-disable-form-submit-on-enter
      $('.js-webform-disable-autosubmit input')
        .not(':button, :submit, :reset, :image, :file')
        .once('webform-disable-autosubmit')
        .on('keyup keypress', function (e) {
          if (e.which === 13) {
            e.preventDefault();
            return false;
          }
        });
    }
  };

  /**
   * Custom required and pattern validation error messages.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches the behavior for the webform custom required and pattern
   *   validation error messages.
   *
   * @see http://stackoverflow.com/questions/5272433/html5-form-required-attribute-set-custom-validation-message
   **/
  Drupal.behaviors.webformRequiredError = {
    attach: function (context) {
      $(context).find(':input[data-webform-required-error], :input[data-webform-pattern-error]').once('webform-required-error')
        .on('invalid', function () {
          this.setCustomValidity('');
          if (this.valid) {
            return;
          }

          if (this.validity.patternMismatch && $(this).attr('data-webform-pattern-error')) {
            this.setCustomValidity($(this).attr('data-webform-pattern-error'));
          }
          else if (this.validity.valueMissing && $(this).attr('data-webform-required-error')) {
            this.setCustomValidity($(this).attr('data-webform-required-error'));
          }
        })
        .on('input change', function () {
          // Find all related elements by name and reset custom validity.
          // This specifically applies to required radios and checkboxes.
          var name = $(this).attr('name');
          $(this.form).find(':input[name="' + name + '"]').each(function () {
            this.setCustomValidity('');
          });
        });
    }
  };

  // When #state:required is triggered we need to reset the target elements
  // custom validity.
  $(document).on('state:required', function (e) {
    $(e.target).filter('[data-webform-required-error]')
      .each(function () {this.setCustomValidity('');});
  });

})(jQuery, Drupal);
;
/**
 * @file
 * JavaScript behaviors for details element.
 */

(function ($, Drupal) {

  'use strict';

  // Determine if local storage exists and is enabled.
  // This approach is copied from Modernizr.
  // @see https://github.com/Modernizr/Modernizr/blob/c56fb8b09515f629806ca44742932902ac145302/modernizr.js#L696-731
  var hasLocalStorage = (function () {
    try {
      localStorage.setItem('webform', 'webform');
      localStorage.removeItem('webform');
      return true;
    }
    catch (e) {
      return false;
    }
  }());

  /**
   * Attach handler to save details open/close state.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformDetailsSave = {
    attach: function (context) {
      if (!hasLocalStorage) {
        return;
      }

      // Summary click event handler.
      $('details > summary', context).once('webform-details-summary-save').on('click', function () {
        var $details = $(this).parent();

        // @see https://css-tricks.com/snippets/jquery/make-an-jquery-hasattr/
        if ($details[0].hasAttribute('data-webform-details-nosave')) {
          return;
        }

        var name = Drupal.webformDetailsSaveGetName($details);
        if (!name) {
          return;
        }

        var open = ($details.attr('open') !== 'open') ? '1' : '0';
        localStorage.setItem(name, open);
      });

      // Initialize details open state via local storage.
      $('details', context).once('webform-details-save').each(function () {
        var $details = $(this);

        var name = Drupal.webformDetailsSaveGetName($details);
        if (!name) {
          return;
        }

        var open = localStorage.getItem(name);
        if (open === null) {
          return;
        }

        if (open === '1') {
          $details.attr('open', 'open');
        }
        else {
          $details.removeAttr('open');
        }
      });
    }

  };

  /**
   * Get the name used to store the state of details element.
   *
   * @param {jQuery} $details
   *   A details element.
   *
   * @return {string}
   *   The name used to store the state of details element.
   */
  Drupal.webformDetailsSaveGetName = function ($details) {
    if (!hasLocalStorage) {
      return '';
    }

    // Ignore details that are vertical tabs pane.
    if ($details.hasClass('vertical-tabs__pane')) {
      return '';
    }

    // Any details element not included a webform must have define its own id.
    var webformId = $details.attr('data-webform-element-id');
    if (webformId) {
      return 'Drupal.webform.' + webformId.replace('--', '.');
    }

    var detailsId = $details.attr('id');
    if (!detailsId) {
      return '';
    }

    var $form = $details.parents('form');
    if (!$form.length || !$form.attr('id')) {
      return '';
    }

    var formId = $form.attr('id');
    if (!formId) {
      return '';
    }

    // ISSUE: When Drupal renders a webform in a modal dialog it appends a unique
    // identifier to webform ids and details ids. (i.e. my-form--FeSFISegTUI)
    // WORKAROUND: Remove the unique id that delimited using double dashes.
    formId = formId.replace(/--.+?$/, '').replace(/-/g, '_');
    detailsId = detailsId.replace(/--.+?$/, '').replace(/-/g, '_');
    return 'Drupal.webform.' + formId + '.' + detailsId;
  };

})(jQuery, Drupal);
;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/
(function (Drupal, debounce) {
  var liveElement;
  var announcements = [];
  Drupal.behaviors.drupalAnnounce = {
    attach: function attach(context) {
      if (!liveElement) {
        liveElement = document.createElement('div');
        liveElement.id = 'drupal-live-announce';
        liveElement.className = 'visually-hidden';
        liveElement.setAttribute('aria-live', 'polite');
        liveElement.setAttribute('aria-busy', 'false');
        document.body.appendChild(liveElement);
      }
    }
  };
  function announce() {
    var text = [];
    var priority = 'polite';
    var announcement;
    var il = announcements.length;
    for (var i = 0; i < il; i++) {
      announcement = announcements.pop();
      text.unshift(announcement.text);
      if (announcement.priority === 'assertive') {
        priority = 'assertive';
      }
    }
    if (text.length) {
      liveElement.innerHTML = '';
      liveElement.setAttribute('aria-busy', 'true');
      liveElement.setAttribute('aria-live', priority);
      liveElement.innerHTML = text.join('\n');
      liveElement.setAttribute('aria-busy', 'false');
    }
  }
  Drupal.announce = function (text, priority) {
    announcements.push({
      text: text,
      priority: priority
    });
    return debounce(announce, 200)();
  };
})(Drupal, Drupal.debounce);;
/**
 * @file
 * JavaScript behaviors for details element.
 */

(function ($, Drupal) {

  'use strict';

  Drupal.webform = Drupal.webform || {};
  Drupal.webform.detailsToggle = Drupal.webform.detailsToggle || {};
  Drupal.webform.detailsToggle.options = Drupal.webform.detailsToggle.options || {};

  /**
   * Attach handler to toggle details open/close state.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformDetailsToggle = {
    attach: function (context) {
      $('.js-webform-details-toggle', context).once('webform-details-toggle').each(function () {
        var $form = $(this);
        var $tabs = $form.find('.webform-tabs');

        // Get only the main details elements and ignore all nested details.
        var selector = ($tabs.length) ? '.webform-tab' : '.js-webform-details-toggle, .webform-elements';
        var $details = $form.find('details').filter(function () {
          var $parents = $(this).parentsUntil(selector);
          return ($parents.find('details').length === 0);
        });

        // Toggle is only useful when there are two or more details elements.
        if ($details.length < 2) {
          return;
        }

        var options = $.extend({
          button: '<button type="button" class="webform-details-toggle-state"></button>'
        }, Drupal.webform.detailsToggle.options);

        // Create toggle buttons.
        var $toggle = $(options.button)
          .attr('title', Drupal.t('Toggle details widget state.'))
          .on('click', function (e) {
            // Get details that are not vertical tabs pane.
            var $details = $form.find('details:not(.vertical-tabs__pane)');
            var open;
            if (Drupal.webform.detailsToggle.isFormDetailsOpen($form)) {
              $details.removeAttr('open');
              open = 0;
            }
            else {
              $details.attr('open', 'open');
              open = 1;
            }
            Drupal.webform.detailsToggle.setDetailsToggleLabel($form);

            // Set the saved states for all the details elements.
            // @see webform.element.details.save.js
            if (Drupal.webformDetailsSaveGetName) {
              $details.each(function () {
                // Note: Drupal.webformDetailsSaveGetName checks if localStorage
                // exists and is enabled.
                // @see webform.element.details.save.js
                var name = Drupal.webformDetailsSaveGetName($(this));
                if (name) {
                  localStorage.setItem(name, open);
                }
              });
            }
          })
          .wrap('<div class="webform-details-toggle-state-wrapper"></div>')
          .parent();

        if ($tabs.length) {
          // Add toggle state before the tabs.
          $tabs.find('.item-list:first-child').eq(0).before($toggle);
        }
        else {
          // Add toggle state link to first details element.
          $details.eq(0).before($toggle);
        }

        Drupal.webform.detailsToggle.setDetailsToggleLabel($form);
      });
    }
  };

  /**
   * Determine if a webform's details are all opened.
   *
   * @param {jQuery} $form
   *   A webform.
   *
   * @return {boolean}
   *   TRUE if a webform's details are all opened.
   */
  Drupal.webform.detailsToggle.isFormDetailsOpen = function ($form) {
    return ($form.find('details[open]').length === $form.find('details').length);
  };

  /**
   * Set a webform's details toggle state widget label.
   *
   * @param {jQuery} $form
   *   A webform.
   */
  Drupal.webform.detailsToggle.setDetailsToggleLabel = function ($form) {
    var isOpen = Drupal.webform.detailsToggle.isFormDetailsOpen($form);

    var label = (isOpen) ? Drupal.t('Collapse all') : Drupal.t('Expand all');
    $form.find('.webform-details-toggle-state').html(label);

    var text = (isOpen) ? Drupal.t('All details have been expanded.') : Drupal.t('All details have been collapsed.');
    Drupal.announce(text);
  };

})(jQuery, Drupal);
;
/**
 * @file
 * JavaScript behaviors for webform scroll top.
 */

(function ($, Drupal) {

  'use strict';

  Drupal.webform = Drupal.webform || {};
  // Allow scrollTopOffset to be custom defined or based on whether there is a
  // floating toolbar.
  Drupal.webform.scrollTopOffset = Drupal.webform.scrollTopOffset || ($('#toolbar-administration').length ? 140 : 10);

  /**
   * Scroll to top ajax command.
   *
   * @param {Element} element
   *   The element to scroll to.
   * @param {string} target
   *   Scroll to target. (form or page)
   */
  Drupal.webformScrollTop = function (element, target) {
    if (!target) {
      return;
    }

    var $element = $(element);

    // Scroll to the top of the view. This will allow users
    // to browse newly loaded content after e.g. clicking a pager
    // link.
    var offset = $element.offset();
    // We can't guarantee that the scrollable object should be
    // the body, as the view could be embedded in something
    // more complex such as a modal popup. Recurse up the DOM
    // and scroll the first element that has a non-zero top.
    var $scrollTarget = $element;
    while ($scrollTarget.scrollTop() === 0 && $($scrollTarget).parent()) {
      $scrollTarget = $scrollTarget.parent();
    }

    if (target === 'page' && $scrollTarget.length && $scrollTarget[0].tagName === 'HTML') {
      // Scroll to top when scroll target is the entire page.
      // @see https://stackoverflow.com/questions/123999/how-to-tell-if-a-dom-element-is-visible-in-the-current-viewport
      var rect = $($scrollTarget)[0].getBoundingClientRect();
      if (!(rect.top >= 0 && rect.left >= 0 && rect.bottom <= $(window).height() && rect.right <= $(window).width())) {
        $scrollTarget.animate({scrollTop: 0}, 500);
      }
    }
    else {
      // Only scroll upward.
      if (offset.top - Drupal.webform.scrollTopOffset < $scrollTarget.scrollTop()) {
        $scrollTarget.animate({scrollTop: (offset.top - Drupal.webform.scrollTopOffset)}, 500);
      }
    }
  };

  /**
   * Scroll element into view.
   *
   * @param {jQuery} $element
   *   An element.
   */
  Drupal.webformScrolledIntoView = function ($element) {
    if (!Drupal.webformIsScrolledIntoView($element)) {
      $('html, body').animate({scrollTop: $element.offset().top - Drupal.webform.scrollTopOffset}, 500);
    }
  };

  /**
   * Determine if element is visible in the viewport.
   *
   * @param {Element} element
   *   An element.
   *
   * @return {boolean}
   *   TRUE if element is visible in the viewport.
   *
   * @see https://stackoverflow.com/questions/487073/check-if-element-is-visible-after-scrolling
   */
  Drupal.webformIsScrolledIntoView = function (element) {
    var docViewTop = $(window).scrollTop();
    var docViewBottom = docViewTop + $(window).height();

    var elemTop = $(element).offset().top;
    var elemBottom = elemTop + $(element).height();

    return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop));
  };

})(jQuery, Drupal);
;
/**
 * @file
 * JavaScript behaviors for Ajax.
 */

(function ($, Drupal, drupalSettings) {

  'use strict';

  Drupal.webform = Drupal.webform || {};
  Drupal.webform.ajax = Drupal.webform.ajax || {};
  // Allow scrollTopOffset to be custom defined or based on whether there is a
  // floating toolbar.
  Drupal.webform.ajax.scrollTopOffset = Drupal.webform.ajax.scrollTopOffset || ($('#toolbar-administration').length ? 140 : 10);

  // Set global scroll top offset.
  // @todo Remove in Webform 6.x.
  Drupal.webform.scrollTopOffset = Drupal.webform.ajax.scrollTopOffset;

  /**
   * Provide Webform Ajax link behavior.
   *
   * Display fullscreen progress indicator instead of throbber.
   * Copied from: Drupal.behaviors.AJAX
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches the behavior to a.webform-ajax-link.
   */
  Drupal.behaviors.webformAjaxLink = {
    attach: function (context) {
      $('.webform-ajax-link', context).once('webform-ajax-link').each(function () {
        var element_settings = {};
        element_settings.progress = {type: 'fullscreen'};

        // For anchor tags, these will go to the target of the anchor rather
        // than the usual location.
        var href = $(this).attr('href');
        if (href) {
          element_settings.url = href;
          element_settings.event = 'click';
        }
        element_settings.dialogType = $(this).data('dialog-type');
        element_settings.dialogRenderer = $(this).data('dialog-renderer');
        element_settings.dialog = $(this).data('dialog-options');
        element_settings.base = $(this).attr('id');
        element_settings.element = this;
        Drupal.ajax(element_settings);

        // Close all open modal dialogs when opening off-canvas dialog.
        if (element_settings.dialogRenderer === 'off_canvas') {
          $(this).on('click', function () {
            $('.ui-dialog.webform-ui-dialog:visible').find('.ui-dialog-content').dialog('close');
          });
        }
      });
    }
  };

  /**
   * Adds a hash (#) to current pages location for links and buttons
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches the behavior to a[data-hash] or :button[data-hash].
   *
   * @see \Drupal\webform_ui\WebformUiEntityElementsForm::getElementRow
   * @see Drupal.behaviors.webformFormTabs
   */
  Drupal.behaviors.webformAjaxHash = {
    attach: function (context) {
      $('[data-hash]', context).once('webform-ajax-hash').each(function () {
        var hash = $(this).data('hash');
        if (hash) {
          $(this).on('click', function () {
            location.hash = $(this).data('hash');
          });
        }
      });
    }
  };

  /**
   * Provide Ajax callback for confirmation back to link.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches the behavior to confirmation back to link.
   */
  Drupal.behaviors.webformConfirmationBackAjax = {
    attach: function (context) {
      $('.js-webform-confirmation-back-link-ajax', context)
        .once('webform-confirmation-back-ajax')
        .on('click', function (event) {
          var $form = $(this).parents('form');

          // Trigger the Ajax call back for the hidden submit button.
          // @see \Drupal\webform\WebformSubmissionForm::getCustomForm
          $form.find('.js-webform-confirmation-back-submit-ajax').trigger('click');

          // Move the progress indicator from the submit button to after this link.
          // @todo Figure out a better way to set a progress indicator.
          var $progress_indicator = $form.find('.ajax-progress');
          if ($progress_indicator) {
            $(this).after($progress_indicator);
          }

          // Cancel the click event.
          event.preventDefault();
          event.stopPropagation();
        });
    }
  };

  /** ********************************************************************** **/
  // Ajax commands.
  /** ********************************************************************** **/

  /**
   * Track the updated table row key.
   */
  var updateKey;

  /**
   * Track the add element key.
   */
  var addElement;

  /**
   * Command to insert new content into the DOM.
   *
   * @param {Drupal.Ajax} ajax
   *   {@link Drupal.Ajax} object created by {@link Drupal.ajax}.
   * @param {object} response
   *   The response from the Ajax request.
   * @param {string} response.data
   *   The data to use with the jQuery method.
   * @param {string} [response.method]
   *   The jQuery DOM manipulation method to be used.
   * @param {string} [response.selector]
   *   A optional jQuery selector string.
   * @param {object} [response.settings]
   *   An optional array of settings that will be used.
   * @param {number} [status]
   *   The XMLHttpRequest status.
   */
  Drupal.AjaxCommands.prototype.webformInsert = function (ajax, response, status) {
    // Insert the HTML.
    this.insert(ajax, response, status);

    // Add element.
    if (addElement) {
      var addSelector = (addElement === '_root_')
        ? '#webform-ui-add-element'
        : '[data-drupal-selector="edit-webform-ui-elements-' + addElement + '-add"]';
      $(addSelector).trigger('click');
    }

    // If not add element, then scroll to and highlight the updated table row.
    if (!addElement && updateKey) {
      var $element = $('tr[data-webform-key="' + updateKey + '"]');

      // Highlight the updated element's row.
      $element.addClass('color-success');
      setTimeout(function () {$element.removeClass('color-success');}, 3000);

      // Focus first tabbable item for the updated elements and handlers.
      $element.find(':tabbable:not(.tabledrag-handle)').eq(0).trigger('focus');

      // Scroll element into view.
      Drupal.webformScrolledIntoView($element);
    }
    else {
      // Focus main content.
      $('#main-content').trigger('focus');
    }

    // Display main page's status message in a floating container.
    var $wrapper = $(response.selector);
    if ($wrapper.parents('.ui-dialog').length === 0) {
      var $messages = $wrapper.find('.messages');
      // If 'add element' don't show any messages.
      if (addElement) {
        $messages.remove();
      }
      else if ($messages.length) {
        var $floatingMessage = $('#webform-ajax-messages');
        if ($floatingMessage.length === 0) {
          $floatingMessage = $('<div id="webform-ajax-messages" class="webform-ajax-messages"></div>');
          $('body').append($floatingMessage);
        }
        if ($floatingMessage.is(':animated')) {
          $floatingMessage.stop(true, true);
        }
        $floatingMessage.html($messages).show().delay(3000).fadeOut(1000);
      }
    }

    updateKey = null; // Reset element update.
    addElement = null; // Reset add element.
  };

  /**
   * Scroll to top ajax command.
   *
   * @param {Drupal.Ajax} [ajax]
   *   A {@link Drupal.ajax} object.
   * @param {object} response
   *   Ajax response.
   * @param {string} response.selector
   *   Selector to use.
   *
   * @see Drupal.AjaxCommands.prototype.viewScrollTop
   */
  Drupal.AjaxCommands.prototype.webformScrollTop = function (ajax, response) {
    // Scroll top.
    Drupal.webformScrollTop(response.selector, response.target);

    // Focus on the form wrapper content bookmark if
    // .js-webform-autofocus is not enabled.
    // @see \Drupal\webform\Form\WebformAjaxFormTrait::buildAjaxForm
    var $form = $(response.selector + '-content').find('form');
    if (!$form.hasClass('js-webform-autofocus')) {
      $(response.selector + '-content').trigger('focus');
    }
  };

  /**
   * Command to refresh the current webform page.
   *
   * @param {Drupal.Ajax} [ajax]
   *   {@link Drupal.Ajax} object created by {@link Drupal.ajax}.
   * @param {object} response
   *   The response from the Ajax request.
   * @param {string} response.url
   *   The URL to redirect to.
   * @param {number} [status]
   *   The XMLHttpRequest status.
   */
  Drupal.AjaxCommands.prototype.webformRefresh = function (ajax, response, status) {
    // Get URL path name.
    // @see https://stackoverflow.com/questions/6944744/javascript-get-portion-of-url-path
    var a = document.createElement('a');
    a.href = response.url;
    var forceReload = (response.url.match(/\?reload=([^&]+)($|&)/)) ? RegExp.$1 : null;
    if (forceReload) {
      response.url = response.url.replace(/\?reload=([^&]+)($|&)/, '');
      this.redirect(ajax, response, status);
      return;
    }

    if (a.pathname === window.location.pathname && $('.webform-ajax-refresh').length) {
      updateKey = (response.url.match(/[?|&]update=([^&]+)($|&)/)) ? RegExp.$1 : null;
      addElement = (response.url.match(/[?|&]add_element=([^&]+)($|&)/)) ? RegExp.$1 : null;
      $('.webform-ajax-refresh').trigger('click');
    }
    else {
      // Clear unsaved information flag so that the current webform page
      // can be redirected.
      // @see Drupal.behaviors.webformUnsaved.clear
      if (Drupal.behaviors.webformUnsaved) {
        Drupal.behaviors.webformUnsaved.clear();
      }

      // For webform embedded in an iframe, open all redirects in the top
      // of the browser window.
      // @see \Drupal\webform_share\Controller\WebformShareController::page
      if (drupalSettings.webform_share &&
        drupalSettings.webform_share.page) {
        window.top.location = response.url;
      }
      else {
        this.redirect(ajax, response, status);
      }
    }
  };

  /**
   * Command to close a off-canvas and modal dialog.
   *
   * If no selector is given, it defaults to trying to close the modal.
   *
   * @param {Drupal.Ajax} [ajax]
   *   {@link Drupal.Ajax} object created by {@link Drupal.ajax}.
   * @param {object} response
   *   The response from the Ajax request.
   * @param {string} response.selector
   *   Selector to use.
   * @param {bool} response.persist
   *   Whether to persist the dialog element or not.
   * @param {number} [status]
   *   The HTTP status code.
   */
  Drupal.AjaxCommands.prototype.webformCloseDialog = function (ajax, response, status) {
    if ($('#drupal-off-canvas').length) {
      // Close off-canvas system tray which is not triggered by close dialog
      // command.
      // @see Drupal.behaviors.offCanvasEvents
      $('#drupal-off-canvas').remove();
      $('body').removeClass('js-tray-open');
      // Remove all *.off-canvas events
      $(document).off('.off-canvas');
      $(window).off('.off-canvas');
      var edge = document.documentElement.dir === 'rtl' ? 'left' : 'right';
      var $mainCanvasWrapper = $('[data-off-canvas-main-canvas]');
      $mainCanvasWrapper.css('padding-' + edge, 0);

      // Resize tabs when closing off-canvas system tray.
      $(window).trigger('resize.tabs');
    }

    // https://stackoverflow.com/questions/15763909/jquery-ui-dialog-check-if-exists-by-instance-method
    if ($(response.selector).hasClass('ui-dialog-content')) {
      this.closeDialog(ajax, response, status);
    }
  };

  /**
   * Triggers confirm page reload.
   *
   * @param {Drupal.Ajax} [ajax]
   *   A {@link Drupal.ajax} object.
   * @param {object} response
   *   Ajax response.
   * @param {string} response.message
   *   A message to be displayed in the confirm dialog.
   */
  Drupal.AjaxCommands.prototype.webformConfirmReload = function (ajax, response) {
    if (window.confirm(response.message)) {
      window.location.reload(true);
    }
  };

})(jQuery, Drupal, drupalSettings);
;
/**
 * @file
 * Behaviors and functionality integrating webforms with Pardot.
 */

((Drupal) => {
  /**
   * Send prospect email address to Pardot for ajax-submitted webforms.
   *
   * If we find a webform confirmation within the given context, and the
   * pi_email query parameter is not present in the current page's URL,
   * send the prospect's email address to Pardot via iframe.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *  Attaches the gtPardotWebform behavior to the right context.
   */
  Drupal.behaviors.gtPardotWebform = {
    attach(context) {
      const confirmation = context.querySelector(".webform-confirmation");
      const url = new URL(window.location.href);
      if (
        confirmation &&
        confirmation.getAttribute("data-pi-email") &&
        !url.searchParams.get("pi_email")
      ) {
        url.searchParams.set(
          "pi_email",
          confirmation.getAttribute("data-pi-email")
        );
        // Pardot will harvest the URL hash, if present, as part of the
        // prospect's email address, creating an invalid email address.
        // Remove the hash, if present.
        url.hash = "";
        const iFrame = document.createElement("iframe");
        iFrame.src = url.toString();
        iFrame.width = 1;
        iFrame.height = 1;
        iFrame.style.opacity = 0;
        document.body.appendChild(iFrame);
      }
    },
  };
})(Drupal);
;
/**
 * @file
 * JavaScript behaviors for message element integration.
 */

(function ($, Drupal) {

  'use strict';

  // Determine if local storage exists and is enabled.
  // This approach is copied from Modernizr.
  // @see https://github.com/Modernizr/Modernizr/blob/c56fb8b09515f629806ca44742932902ac145302/modernizr.js#L696-731
  var hasLocalStorage = (function () {
    try {
      localStorage.setItem('webform', 'webform');
      localStorage.removeItem('webform');
      return true;
    }
    catch (e) {
      return false;
    }
  }());

  // Determine if session storage exists and is enabled.
  // This approach is copied from Modernizr.
  // @see https://github.com/Modernizr/Modernizr/blob/c56fb8b09515f629806ca44742932902ac145302/modernizr.js#L696-731
  var hasSessionStorage = (function () {
    try {
      sessionStorage.setItem('webform', 'webform');
      sessionStorage.removeItem('webform');
      return true;
    }
    catch (e) {
      return false;
    }
  }());

  /**
   * Behavior for handler message close.
   *
   * @type {Drupal~behavior}
   */
  Drupal.behaviors.webformMessageClose = {
    attach: function (context) {
      $(context).find('.js-webform-message--close').once('webform-message--close').each(function () {
        var $element = $(this);

        var id = $element.attr('data-message-id');
        var storage = $element.attr('data-message-storage');
        var effect = $element.attr('data-message-close-effect') || 'hide';
        switch (effect) {
          case 'slide': effect = 'slideUp'; break;

          case 'fade': effect = 'fadeOut'; break;
        }

        // Check storage status.
        if (isClosed($element, storage, id)) {
          return;
        }

        // Only show element if it's style is not set to 'display: none'
        // and it is not hidden via .js-webform-states-hidden.
        if ($element.attr('style') !== 'display: none;' && !$element.hasClass('js-webform-states-hidden')) {
          $element.show();
        }

        $element.find('.js-webform-message__link').on('click', function (event) {
          $element[effect]();
          setClosed($element, storage, id);
          $element.trigger('close');
          event.preventDefault();
        });
      });
    }
  };

  function isClosed($element, storage, id) {
    if (!id || !storage) {
      return false;
    }

    switch (storage) {
      case 'local':
        if (hasLocalStorage) {
          return localStorage.getItem('Drupal.webform.message.' + id) || false;
        }
        return false;

      case 'session':
        if (hasSessionStorage) {
          return sessionStorage.getItem('Drupal.webform.message.' + id) || false;
        }
        return false;

      default:
        return false;
    }
  }

  function setClosed($element, storage, id) {
    if (!id || !storage) {
      return;
    }

    switch (storage) {
      case 'local':
        if (hasLocalStorage) {
          localStorage.setItem('Drupal.webform.message.' + id, true);
        }
        break;

      case 'session':
        if (hasSessionStorage) {
          sessionStorage.setItem('Drupal.webform.message.' + id, true);
        }
        break;

      case 'user':
      case 'state':
      case 'custom':
        $.get($element.find('.js-webform-message__link').attr('href'));
        return true;
    }
  }

})(jQuery, Drupal);
;
/**
 * @file
 * Unlock protected forms.
 *
 * This works by resetting the form action to the path that It should be as well
 * as injecting the secret form key, only if the current user is verified to be
 * human which is done by waiting for a mousemove, swipe, or tab/enter key to be
 * pressed.
 */

(function (Drupal, drupalSettings) {
  "use strict";

  Drupal.antibot = {};

  Drupal.behaviors.antibot = {
    attach: function (context) {
      // Assume the user is not human, despite JS being enabled.
      drupalSettings.antibot.human = false;

      // Wait for a mouse to move, indicating they are human.
      document.body.addEventListener('mousemove', function () {
        // Unlock the forms.
        Drupal.antibot.unlockForms();
      });

      // Wait for a touch move event, indicating that they are human.
      document.body.addEventListener('touchmove', function () {
        // Unlock the forms.
        Drupal.antibot.unlockForms();
      });

      // A tab or enter key pressed can also indicate they are human.
      document.body.addEventListener('keydown', function (e) {
        if ((e.code == 'Tab') || (e.code == 'Enter')) {
          // Unlock the forms.
          Drupal.antibot.unlockForms();
        }
      });
    }
  };

  /**
   * Unlock all locked forms.
   */
  Drupal.antibot.unlockForms = function () {
    // Act only if we haven't yet verified this user as being human.
    if (!drupalSettings.antibot.human) {
      // Check if there are forms to unlock.
      if (drupalSettings.antibot.forms != undefined) {
        // Iterate all antibot forms that we need to unlock.
        Object.values(drupalSettings.antibot.forms).forEach(function (config) {
          // Switch the action.
          const form = document.getElementById(config.id);
          if (form) {
            form.setAttribute('action', form.getAttribute('data-action'));

            // Set the key.
            const input = form.querySelector('input[name="antibot_key"]');
            if (input) {
              input.value = config.key;
            }
          }
        });
      }
      // Mark this user as being human.
      drupalSettings.antibot.human = true;
    }
  };
})(Drupal, drupalSettings);
;
/*!
 * jQuery Form Plugin
 * version: 4.3.0
 * Requires jQuery v1.7.2 or later
 * Project repository: https://github.com/jquery-form/form

 * Copyright 2017 Kevin Morris
 * Copyright 2006 M. Alsup

 * Dual licensed under the LGPL-2.1+ or MIT licenses
 * https://github.com/jquery-form/form#license

 * This library is free software; you can redistribute it and/or
 * modify it under the terms of the GNU Lesser General Public
 * License as published by the Free Software Foundation; either
 * version 2.1 of the License, or (at your option) any later version.
 * This library is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
 * Lesser General Public License for more details.
 */
!function(r){"function"==typeof define&&define.amd?define(["jquery"],r):"object"==typeof module&&module.exports?module.exports=function(e,t){return void 0===t&&(t="undefined"!=typeof window?require("jquery"):require("jquery")(e)),r(t),t}:r(jQuery)}(function(q){"use strict";var m=/\r?\n/g,S={};S.fileapi=void 0!==q('<input type="file">').get(0).files,S.formdata=void 0!==window.FormData;var _=!!q.fn.prop;function o(e){var t=e.data;e.isDefaultPrevented()||(e.preventDefault(),q(e.target).closest("form").ajaxSubmit(t))}function i(e){var t=e.target,r=q(t);if(!r.is("[type=submit],[type=image]")){var a=r.closest("[type=submit]");if(0===a.length)return;t=a[0]}var n,o=t.form;"image"===(o.clk=t).type&&(void 0!==e.offsetX?(o.clk_x=e.offsetX,o.clk_y=e.offsetY):"function"==typeof q.fn.offset?(n=r.offset(),o.clk_x=e.pageX-n.left,o.clk_y=e.pageY-n.top):(o.clk_x=e.pageX-t.offsetLeft,o.clk_y=e.pageY-t.offsetTop)),setTimeout(function(){o.clk=o.clk_x=o.clk_y=null},100)}function N(){var e;q.fn.ajaxSubmit.debug&&(e="[jquery.form] "+Array.prototype.join.call(arguments,""),window.console&&window.console.log?window.console.log(e):window.opera&&window.opera.postError&&window.opera.postError(e))}q.fn.attr2=function(){if(!_)return this.attr.apply(this,arguments);var e=this.prop.apply(this,arguments);return e&&e.jquery||"string"==typeof e?e:this.attr.apply(this,arguments)},q.fn.ajaxSubmit=function(M,e,t,r){if(!this.length)return N("ajaxSubmit: skipping submit process - no element selected"),this;var O,a,n,o,X=this;"function"==typeof M?M={success:M}:"string"==typeof M||!1===M&&0<arguments.length?(M={url:M,data:e,dataType:t},"function"==typeof r&&(M.success=r)):void 0===M&&(M={}),O=M.method||M.type||this.attr2("method"),n=(n=(n="string"==typeof(a=M.url||this.attr2("action"))?q.trim(a):"")||window.location.href||"")&&(n.match(/^([^#]+)/)||[])[1],o=/(MSIE|Trident)/.test(navigator.userAgent||"")&&/^https/i.test(window.location.href||"")?"javascript:false":"about:blank",M=q.extend(!0,{url:n,success:q.ajaxSettings.success,type:O||q.ajaxSettings.type,iframeSrc:o},M);var i={};if(this.trigger("form-pre-serialize",[this,M,i]),i.veto)return N("ajaxSubmit: submit vetoed via form-pre-serialize trigger"),this;if(M.beforeSerialize&&!1===M.beforeSerialize(this,M))return N("ajaxSubmit: submit aborted via beforeSerialize callback"),this;var s=M.traditional;void 0===s&&(s=q.ajaxSettings.traditional);var u,c,C=[],l=this.formToArray(M.semantic,C,M.filtering);if(M.data&&(c=q.isFunction(M.data)?M.data(l):M.data,M.extraData=c,u=q.param(c,s)),M.beforeSubmit&&!1===M.beforeSubmit(l,this,M))return N("ajaxSubmit: submit aborted via beforeSubmit callback"),this;if(this.trigger("form-submit-validate",[l,this,M,i]),i.veto)return N("ajaxSubmit: submit vetoed via form-submit-validate trigger"),this;var f=q.param(l,s);u&&(f=f?f+"&"+u:u),"GET"===M.type.toUpperCase()?(M.url+=(0<=M.url.indexOf("?")?"&":"?")+f,M.data=null):M.data=f;var d,m,p,h=[];M.resetForm&&h.push(function(){X.resetForm()}),M.clearForm&&h.push(function(){X.clearForm(M.includeHidden)}),!M.dataType&&M.target?(d=M.success||function(){},h.push(function(e,t,r){var a=arguments,n=M.replaceTarget?"replaceWith":"html";q(M.target)[n](e).each(function(){d.apply(this,a)})})):M.success&&(q.isArray(M.success)?q.merge(h,M.success):h.push(M.success)),M.success=function(e,t,r){for(var a=M.context||this,n=0,o=h.length;n<o;n++)h[n].apply(a,[e,t,r||X,X])},M.error&&(m=M.error,M.error=function(e,t,r){var a=M.context||this;m.apply(a,[e,t,r,X])}),M.complete&&(p=M.complete,M.complete=function(e,t){var r=M.context||this;p.apply(r,[e,t,X])});var v=0<q("input[type=file]:enabled",this).filter(function(){return""!==q(this).val()}).length,g="multipart/form-data",x=X.attr("enctype")===g||X.attr("encoding")===g,y=S.fileapi&&S.formdata;N("fileAPI :"+y);var b,T=(v||x)&&!y;!1!==M.iframe&&(M.iframe||T)?M.closeKeepAlive?q.get(M.closeKeepAlive,function(){b=w(l)}):b=w(l):b=(v||x)&&y?function(e){for(var r=new FormData,t=0;t<e.length;t++)r.append(e[t].name,e[t].value);if(M.extraData){var a=function(e){var t,r,a=q.param(e,M.traditional).split("&"),n=a.length,o=[];for(t=0;t<n;t++)a[t]=a[t].replace(/\+/g," "),r=a[t].split("="),o.push([decodeURIComponent(r[0]),decodeURIComponent(r[1])]);return o}(M.extraData);for(t=0;t<a.length;t++)a[t]&&r.append(a[t][0],a[t][1])}M.data=null;var n=q.extend(!0,{},q.ajaxSettings,M,{contentType:!1,processData:!1,cache:!1,type:O||"POST"});M.uploadProgress&&(n.xhr=function(){var e=q.ajaxSettings.xhr();return e.upload&&e.upload.addEventListener("progress",function(e){var t=0,r=e.loaded||e.position,a=e.total;e.lengthComputable&&(t=Math.ceil(r/a*100)),M.uploadProgress(e,r,a,t)},!1),e});n.data=null;var o=n.beforeSend;return n.beforeSend=function(e,t){M.formData?t.data=M.formData:t.data=r,o&&o.call(this,e,t)},q.ajax(n)}(l):q.ajax(M),X.removeData("jqxhr").data("jqxhr",b);for(var j=0;j<C.length;j++)C[j]=null;return this.trigger("form-submit-notify",[this,M]),this;function w(e){var t,r,l,f,o,d,m,p,a,n,h,v,i=X[0],g=q.Deferred();if(g.abort=function(e){p.abort(e)},e)for(r=0;r<C.length;r++)t=q(C[r]),_?t.prop("disabled",!1):t.removeAttr("disabled");(l=q.extend(!0,{},q.ajaxSettings,M)).context=l.context||l,o="jqFormIO"+(new Date).getTime();var s=i.ownerDocument,u=X.closest("body");if(l.iframeTarget?(n=(d=q(l.iframeTarget,s)).attr2("name"))?o=n:d.attr2("name",o):(d=q('<iframe name="'+o+'" src="'+l.iframeSrc+'" />',s)).css({position:"absolute",top:"-1000px",left:"-1000px"}),m=d[0],p={aborted:0,responseText:null,responseXML:null,status:0,statusText:"n/a",getAllResponseHeaders:function(){},getResponseHeader:function(){},setRequestHeader:function(){},abort:function(e){var t="timeout"===e?"timeout":"aborted";N("aborting upload... "+t),this.aborted=1;try{m.contentWindow.document.execCommand&&m.contentWindow.document.execCommand("Stop")}catch(e){}d.attr("src",l.iframeSrc),p.error=t,l.error&&l.error.call(l.context,p,t,e),f&&q.event.trigger("ajaxError",[p,l,t]),l.complete&&l.complete.call(l.context,p,t)}},(f=l.global)&&0==q.active++&&q.event.trigger("ajaxStart"),f&&q.event.trigger("ajaxSend",[p,l]),l.beforeSend&&!1===l.beforeSend.call(l.context,p,l))return l.global&&q.active--,g.reject(),g;if(p.aborted)return g.reject(),g;(a=i.clk)&&(n=a.name)&&!a.disabled&&(l.extraData=l.extraData||{},l.extraData[n]=a.value,"image"===a.type&&(l.extraData[n+".x"]=i.clk_x,l.extraData[n+".y"]=i.clk_y));var x=1,y=2;function b(t){var r=null;try{t.contentWindow&&(r=t.contentWindow.document)}catch(e){N("cannot get iframe.contentWindow document: "+e)}if(r)return r;try{r=t.contentDocument?t.contentDocument:t.document}catch(e){N("cannot get iframe.contentDocument: "+e),r=t.document}return r}var c=q("meta[name=csrf-token]").attr("content"),T=q("meta[name=csrf-param]").attr("content");function j(){var e=X.attr2("target"),t=X.attr2("action"),r=X.attr("enctype")||X.attr("encoding")||"multipart/form-data";i.setAttribute("target",o),O&&!/post/i.test(O)||i.setAttribute("method","POST"),t!==l.url&&i.setAttribute("action",l.url),l.skipEncodingOverride||O&&!/post/i.test(O)||X.attr({encoding:"multipart/form-data",enctype:"multipart/form-data"}),l.timeout&&(v=setTimeout(function(){h=!0,A(x)},l.timeout));var a=[];try{if(l.extraData)for(var n in l.extraData)l.extraData.hasOwnProperty(n)&&(q.isPlainObject(l.extraData[n])&&l.extraData[n].hasOwnProperty("name")&&l.extraData[n].hasOwnProperty("value")?a.push(q('<input type="hidden" name="'+l.extraData[n].name+'">',s).val(l.extraData[n].value).appendTo(i)[0]):a.push(q('<input type="hidden" name="'+n+'">',s).val(l.extraData[n]).appendTo(i)[0]));l.iframeTarget||d.appendTo(u),m.attachEvent?m.attachEvent("onload",A):m.addEventListener("load",A,!1),setTimeout(function e(){try{var t=b(m).readyState;N("state = "+t),t&&"uninitialized"===t.toLowerCase()&&setTimeout(e,50)}catch(e){N("Server abort: ",e," (",e.name,")"),A(y),v&&clearTimeout(v),v=void 0}},15);try{i.submit()}catch(e){document.createElement("form").submit.apply(i)}}finally{i.setAttribute("action",t),i.setAttribute("enctype",r),e?i.setAttribute("target",e):X.removeAttr("target"),q(a).remove()}}T&&c&&(l.extraData=l.extraData||{},l.extraData[T]=c),l.forceSync?j():setTimeout(j,10);var w,S,k,D=50;function A(e){if(!p.aborted&&!k){if((S=b(m))||(N("cannot access response document"),e=y),e===x&&p)return p.abort("timeout"),void g.reject(p,"timeout");if(e===y&&p)return p.abort("server abort"),void g.reject(p,"error","server abort");if(S&&S.location.href!==l.iframeSrc||h){m.detachEvent?m.detachEvent("onload",A):m.removeEventListener("load",A,!1);var t,r="success";try{if(h)throw"timeout";var a="xml"===l.dataType||S.XMLDocument||q.isXMLDoc(S);if(N("isXml="+a),!a&&window.opera&&(null===S.body||!S.body.innerHTML)&&--D)return N("requeing onLoad callback, DOM not available"),void setTimeout(A,250);var n=S.body?S.body:S.documentElement;p.responseText=n?n.innerHTML:null,p.responseXML=S.XMLDocument?S.XMLDocument:S,a&&(l.dataType="xml"),p.getResponseHeader=function(e){return{"content-type":l.dataType}[e.toLowerCase()]},n&&(p.status=Number(n.getAttribute("status"))||p.status,p.statusText=n.getAttribute("statusText")||p.statusText);var o,i,s,u=(l.dataType||"").toLowerCase(),c=/(json|script|text)/.test(u);c||l.textarea?(o=S.getElementsByTagName("textarea")[0])?(p.responseText=o.value,p.status=Number(o.getAttribute("status"))||p.status,p.statusText=o.getAttribute("statusText")||p.statusText):c&&(i=S.getElementsByTagName("pre")[0],s=S.getElementsByTagName("body")[0],i?p.responseText=i.textContent?i.textContent:i.innerText:s&&(p.responseText=s.textContent?s.textContent:s.innerText)):"xml"===u&&!p.responseXML&&p.responseText&&(p.responseXML=F(p.responseText));try{w=E(p,u,l)}catch(e){r="parsererror",p.error=t=e||r}}catch(e){N("error caught: ",e),r="error",p.error=t=e||r}p.aborted&&(N("upload aborted"),r=null),p.status&&(r=200<=p.status&&p.status<300||304===p.status?"success":"error"),"success"===r?(l.success&&l.success.call(l.context,w,"success",p),g.resolve(p.responseText,"success",p),f&&q.event.trigger("ajaxSuccess",[p,l])):r&&(void 0===t&&(t=p.statusText),l.error&&l.error.call(l.context,p,r,t),g.reject(p,"error",t),f&&q.event.trigger("ajaxError",[p,l,t])),f&&q.event.trigger("ajaxComplete",[p,l]),f&&!--q.active&&q.event.trigger("ajaxStop"),l.complete&&l.complete.call(l.context,p,r),k=!0,l.timeout&&clearTimeout(v),setTimeout(function(){l.iframeTarget?d.attr("src",l.iframeSrc):d.remove(),p.responseXML=null},100)}}}var F=q.parseXML||function(e,t){return window.ActiveXObject?((t=new ActiveXObject("Microsoft.XMLDOM")).async="false",t.loadXML(e)):t=(new DOMParser).parseFromString(e,"text/xml"),t&&t.documentElement&&"parsererror"!==t.documentElement.nodeName?t:null},L=q.parseJSON||function(e){return window.eval("("+e+")")},E=function(e,t,r){var a=e.getResponseHeader("content-type")||"",n=("xml"===t||!t)&&0<=a.indexOf("xml"),o=n?e.responseXML:e.responseText;return n&&"parsererror"===o.documentElement.nodeName&&q.error&&q.error("parsererror"),r&&r.dataFilter&&(o=r.dataFilter(o,t)),"string"==typeof o&&(("json"===t||!t)&&0<=a.indexOf("json")?o=L(o):("script"===t||!t)&&0<=a.indexOf("javascript")&&q.globalEval(o)),o};return g}},q.fn.ajaxForm=function(e,t,r,a){if(("string"==typeof e||!1===e&&0<arguments.length)&&(e={url:e,data:t,dataType:r},"function"==typeof a&&(e.success=a)),(e=e||{}).delegation=e.delegation&&q.isFunction(q.fn.on),e.delegation||0!==this.length)return e.delegation?(q(document).off("submit.form-plugin",this.selector,o).off("click.form-plugin",this.selector,i).on("submit.form-plugin",this.selector,e,o).on("click.form-plugin",this.selector,e,i),this):(e.beforeFormUnbind&&e.beforeFormUnbind(this,e),this.ajaxFormUnbind().on("submit.form-plugin",e,o).on("click.form-plugin",e,i));var n={s:this.selector,c:this.context};return!q.isReady&&n.s?(N("DOM not ready, queuing ajaxForm"),q(function(){q(n.s,n.c).ajaxForm(e)})):N("terminating; zero elements found by selector"+(q.isReady?"":" (DOM not ready)")),this},q.fn.ajaxFormUnbind=function(){return this.off("submit.form-plugin click.form-plugin")},q.fn.formToArray=function(e,t,r){var a=[];if(0===this.length)return a;var n,o,i,s,u,c,l,f,d,m,p=this[0],h=this.attr("id"),v=(v=e||void 0===p.elements?p.getElementsByTagName("*"):p.elements)&&q.makeArray(v);if(h&&(e||/(Edge|Trident)\//.test(navigator.userAgent))&&(n=q(':input[form="'+h+'"]').get()).length&&(v=(v||[]).concat(n)),!v||!v.length)return a;for(q.isFunction(r)&&(v=q.map(v,r)),o=0,c=v.length;o<c;o++)if((m=(u=v[o]).name)&&!u.disabled)if(e&&p.clk&&"image"===u.type)p.clk===u&&(a.push({name:m,value:q(u).val(),type:u.type}),a.push({name:m+".x",value:p.clk_x},{name:m+".y",value:p.clk_y}));else if((s=q.fieldValue(u,!0))&&s.constructor===Array)for(t&&t.push(u),i=0,l=s.length;i<l;i++)a.push({name:m,value:s[i]});else if(S.fileapi&&"file"===u.type){t&&t.push(u);var g=u.files;if(g.length)for(i=0;i<g.length;i++)a.push({name:m,value:g[i],type:u.type});else a.push({name:m,value:"",type:u.type})}else null!=s&&(t&&t.push(u),a.push({name:m,value:s,type:u.type,required:u.required}));return e||!p.clk||(m=(d=(f=q(p.clk))[0]).name)&&!d.disabled&&"image"===d.type&&(a.push({name:m,value:f.val()}),a.push({name:m+".x",value:p.clk_x},{name:m+".y",value:p.clk_y})),a},q.fn.formSerialize=function(e){return q.param(this.formToArray(e))},q.fn.fieldSerialize=function(n){var o=[];return this.each(function(){var e=this.name;if(e){var t=q.fieldValue(this,n);if(t&&t.constructor===Array)for(var r=0,a=t.length;r<a;r++)o.push({name:e,value:t[r]});else null!=t&&o.push({name:this.name,value:t})}}),q.param(o)},q.fn.fieldValue=function(e){for(var t=[],r=0,a=this.length;r<a;r++){var n=this[r],o=q.fieldValue(n,e);null==o||o.constructor===Array&&!o.length||(o.constructor===Array?q.merge(t,o):t.push(o))}return t},q.fieldValue=function(e,t){var r=e.name,a=e.type,n=e.tagName.toLowerCase();if(void 0===t&&(t=!0),t&&(!r||e.disabled||"reset"===a||"button"===a||("checkbox"===a||"radio"===a)&&!e.checked||("submit"===a||"image"===a)&&e.form&&e.form.clk!==e||"select"===n&&-1===e.selectedIndex))return null;if("select"!==n)return q(e).val().replace(m,"\r\n");var o=e.selectedIndex;if(o<0)return null;for(var i=[],s=e.options,u="select-one"===a,c=u?o+1:s.length,l=u?o:0;l<c;l++){var f=s[l];if(f.selected&&!f.disabled){var d=(d=f.value)||(f.attributes&&f.attributes.value&&!f.attributes.value.specified?f.text:f.value);if(u)return d;i.push(d)}}return i},q.fn.clearForm=function(e){return this.each(function(){q("input,select,textarea",this).clearFields(e)})},q.fn.clearFields=q.fn.clearInputs=function(r){var a=/^(?:color|date|datetime|email|month|number|password|range|search|tel|text|time|url|week)$/i;return this.each(function(){var e=this.type,t=this.tagName.toLowerCase();a.test(e)||"textarea"===t?this.value="":"checkbox"===e||"radio"===e?this.checked=!1:"select"===t?this.selectedIndex=-1:"file"===e?/MSIE/.test(navigator.userAgent)?q(this).replaceWith(q(this).clone(!0)):q(this).val(""):r&&(!0===r&&/hidden/.test(e)||"string"==typeof r&&q(this).is(r))&&(this.value="")})},q.fn.resetForm=function(){return this.each(function(){var t=q(this),e=this.tagName.toLowerCase();switch(e){case"input":this.checked=this.defaultChecked;case"textarea":return this.value=this.defaultValue,!0;case"option":case"optgroup":var r=t.parents("select");return r.length&&r[0].multiple?"option"===e?this.selected=this.defaultSelected:t.find("option").resetForm():r.resetForm(),!0;case"select":return t.find("option").each(function(e){if(this.selected=this.defaultSelected,this.defaultSelected&&!t[0].multiple)return t[0].selectedIndex=e,!1}),!0;case"label":var a=q(t.attr("for")),n=t.find("input,select,textarea");return a[0]&&n.unshift(a[0]),n.resetForm(),!0;case"form":return"function"!=typeof this.reset&&("object"!=typeof this.reset||this.reset.nodeType)||this.reset(),!0;default:return t.find("form,input,label,select,textarea").resetForm(),!0}})},q.fn.enable=function(e){return void 0===e&&(e=!0),this.each(function(){this.disabled=!e})},q.fn.selected=function(r){return void 0===r&&(r=!0),this.each(function(){var e,t=this.type;"checkbox"===t||"radio"===t?this.checked=r:"option"===this.tagName.toLowerCase()&&(e=q(this).parent("select"),r&&e[0]&&"select-one"===e[0].type&&e.find("option").selected(!1),this.selected=r)})},q.fn.ajaxSubmit.debug=!1});

;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/
(function ($, Drupal, window) {
  function TableResponsive(table) {
    this.table = table;
    this.$table = $(table);
    this.showText = Drupal.t('Show all columns');
    this.hideText = Drupal.t('Hide lower priority columns');
    this.$headers = this.$table.find('th');
    this.$link = $('<button type="button" class="link tableresponsive-toggle"></button>').attr('title', Drupal.t('Show table cells that were hidden to make the table fit within a small screen.')).on('click', $.proxy(this, 'eventhandlerToggleColumns'));
    this.$table.before($('<div class="tableresponsive-toggle-columns"></div>').append(this.$link));
    $(window).on('resize.tableresponsive', $.proxy(this, 'eventhandlerEvaluateColumnVisibility')).trigger('resize.tableresponsive');
  }
  Drupal.behaviors.tableResponsive = {
    attach: function attach(context, settings) {
      once('tableresponsive', 'table.responsive-enabled', context).forEach(function (table) {
        TableResponsive.tables.push(new TableResponsive(table));
      });
    }
  };
  $.extend(TableResponsive, {
    tables: []
  });
  $.extend(TableResponsive.prototype, {
    eventhandlerEvaluateColumnVisibility: function eventhandlerEvaluateColumnVisibility(e) {
      var pegged = parseInt(this.$link.data('pegged'), 10);
      var hiddenLength = this.$headers.filter('.priority-medium:hidden, .priority-low:hidden').length;
      if (hiddenLength > 0) {
        this.$link.show();
        this.$link[0].textContent = this.showText;
      }
      if (!pegged && hiddenLength === 0) {
        this.$link.hide();
        this.$link[0].textContent = this.hideText;
      }
    },
    eventhandlerToggleColumns: function eventhandlerToggleColumns(e) {
      e.preventDefault();
      var self = this;
      var $hiddenHeaders = this.$headers.filter('.priority-medium:hidden, .priority-low:hidden');
      this.$revealedCells = this.$revealedCells || $();
      if ($hiddenHeaders.length > 0) {
        $hiddenHeaders.each(function (index, element) {
          var $header = $(this);
          var position = $header.prevAll('th').length;
          self.$table.find('tbody tr').each(function () {
            var $cells = $(this).find('td').eq(position);
            $cells.show();
            self.$revealedCells = $().add(self.$revealedCells).add($cells);
          });
          $header.show();
          self.$revealedCells = $().add(self.$revealedCells).add($header);
        });
        this.$link[0].textContent = this.hideText;
        this.$link.data('pegged', 1);
      } else {
        this.$revealedCells.hide();
        this.$revealedCells.each(function (index, element) {
          var $cell = $(this);
          var properties = $cell.attr('style').split(';');
          var newProps = [];
          var match = /^display\s*:\s*none$/;
          for (var i = 0; i < properties.length; i++) {
            var prop = properties[i];
            prop.trim();
            var isDisplayNone = match.exec(prop);
            if (isDisplayNone) {
              continue;
            }
            newProps.push(prop);
          }
          $cell.attr('style', newProps.join(';'));
        });
        this.$link[0].textContent = this.showText;
        this.$link.data('pegged', 0);
        $(window).trigger('resize.tableresponsive');
      }
    }
  });
  Drupal.TableResponsive = TableResponsive;
})(jQuery, Drupal, window);;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/
(function ($, Drupal, _ref) {
  var isTabbable = _ref.isTabbable;
  $.extend($.expr[':'], {
    tabbable: function tabbable(element) {
      Drupal.deprecationError({
        message: 'The :tabbable selector is deprecated in Drupal 9.2.0 and will be removed in Drupal 11.0.0. Use the core/tabbable library instead. See https://www.drupal.org/node/3183730'
      });
      if (element.tagName === 'SUMMARY' || element.tagName === 'DETAILS') {
        var tabIndex = element.getAttribute('tabIndex');
        if (tabIndex === null || tabIndex < 0) {
          return false;
        }
      }
      return isTabbable(element);
    }
  });
})(jQuery, Drupal, window.tabbable);;
/**
* DO NOT EDIT THIS FILE.
* See the following change record for more information,
* https://www.drupal.org/node/2815083
* @preserve
**/
(function ($) {
  var cachedScrollbarWidth = null;
  var max = Math.max,
    abs = Math.abs;
  var regexHorizontal = /left|center|right/;
  var regexVertical = /top|center|bottom/;
  var regexOffset = /[+-]\d+(\.[\d]+)?%?/;
  var regexPosition = /^\w+/;
  var regexPercent = /%$/;
  var _position = $.fn.position;
  function getOffsets(offsets, width, height) {
    return [parseFloat(offsets[0]) * (regexPercent.test(offsets[0]) ? width / 100 : 1), parseFloat(offsets[1]) * (regexPercent.test(offsets[1]) ? height / 100 : 1)];
  }
  function parseCss(element, property) {
    return parseInt($.css(element, property), 10) || 0;
  }
  function getDimensions(elem) {
    var raw = elem[0];
    if (raw.nodeType === 9) {
      return {
        width: elem.width(),
        height: elem.height(),
        offset: {
          top: 0,
          left: 0
        }
      };
    }
    if ($.isWindow(raw)) {
      return {
        width: elem.width(),
        height: elem.height(),
        offset: {
          top: elem.scrollTop(),
          left: elem.scrollLeft()
        }
      };
    }
    if (raw.preventDefault) {
      return {
        width: 0,
        height: 0,
        offset: {
          top: raw.pageY,
          left: raw.pageX
        }
      };
    }
    return {
      width: elem.outerWidth(),
      height: elem.outerHeight(),
      offset: elem.offset()
    };
  }
  var collisions = {
    fit: {
      left: function left(position, data) {
        var within = data.within;
        var withinOffset = within.isWindow ? within.scrollLeft : within.offset.left;
        var outerWidth = within.width;
        var collisionPosLeft = position.left - data.collisionPosition.marginLeft;
        var overLeft = withinOffset - collisionPosLeft;
        var overRight = collisionPosLeft + data.collisionWidth - outerWidth - withinOffset;
        var newOverRight;
        if (data.collisionWidth > outerWidth) {
          if (overLeft > 0 && overRight <= 0) {
            newOverRight = position.left + overLeft + data.collisionWidth - outerWidth - withinOffset;
            position.left += overLeft - newOverRight;
          } else if (overRight > 0 && overLeft <= 0) {
            position.left = withinOffset;
          } else if (overLeft > overRight) {
            position.left = withinOffset + outerWidth - data.collisionWidth;
          } else {
            position.left = withinOffset;
          }
        } else if (overLeft > 0) {
          position.left += overLeft;
        } else if (overRight > 0) {
          position.left -= overRight;
        } else {
          position.left = max(position.left - collisionPosLeft, position.left);
        }
      },
      top: function top(position, data) {
        var within = data.within;
        var withinOffset = within.isWindow ? within.scrollTop : within.offset.top;
        var outerHeight = data.within.height;
        var collisionPosTop = position.top - data.collisionPosition.marginTop;
        var overTop = withinOffset - collisionPosTop;
        var overBottom = collisionPosTop + data.collisionHeight - outerHeight - withinOffset;
        var newOverBottom;
        if (data.collisionHeight > outerHeight) {
          if (overTop > 0 && overBottom <= 0) {
            newOverBottom = position.top + overTop + data.collisionHeight - outerHeight - withinOffset;
            position.top += overTop - newOverBottom;
          } else if (overBottom > 0 && overTop <= 0) {
            position.top = withinOffset;
          } else if (overTop > overBottom) {
            position.top = withinOffset + outerHeight - data.collisionHeight;
          } else {
            position.top = withinOffset;
          }
        } else if (overTop > 0) {
          position.top += overTop;
        } else if (overBottom > 0) {
          position.top -= overBottom;
        } else {
          position.top = max(position.top - collisionPosTop, position.top);
        }
      }
    },
    flip: {
      left: function left(position, data) {
        var within = data.within;
        var withinOffset = within.offset.left + within.scrollLeft;
        var outerWidth = within.width;
        var offsetLeft = within.isWindow ? within.scrollLeft : within.offset.left;
        var collisionPosLeft = position.left - data.collisionPosition.marginLeft;
        var overLeft = collisionPosLeft - offsetLeft;
        var overRight = collisionPosLeft + data.collisionWidth - outerWidth - offsetLeft;
        var myOffset = data.my[0] === 'left' ? -data.elemWidth : data.my[0] === 'right' ? data.elemWidth : 0;
        var atOffset = data.at[0] === 'left' ? data.targetWidth : data.at[0] === 'right' ? -data.targetWidth : 0;
        var offset = -2 * data.offset[0];
        var newOverRight;
        var newOverLeft;
        if (overLeft < 0) {
          newOverRight = position.left + myOffset + atOffset + offset + data.collisionWidth - outerWidth - withinOffset;
          if (newOverRight < 0 || newOverRight < abs(overLeft)) {
            position.left += myOffset + atOffset + offset;
          }
        } else if (overRight > 0) {
          newOverLeft = position.left - data.collisionPosition.marginLeft + myOffset + atOffset + offset - offsetLeft;
          if (newOverLeft > 0 || abs(newOverLeft) < overRight) {
            position.left += myOffset + atOffset + offset;
          }
        }
      },
      top: function top(position, data) {
        var within = data.within;
        var withinOffset = within.offset.top + within.scrollTop;
        var outerHeight = within.height;
        var offsetTop = within.isWindow ? within.scrollTop : within.offset.top;
        var collisionPosTop = position.top - data.collisionPosition.marginTop;
        var overTop = collisionPosTop - offsetTop;
        var overBottom = collisionPosTop + data.collisionHeight - outerHeight - offsetTop;
        var top = data.my[1] === 'top';
        var myOffset = top ? -data.elemHeight : data.my[1] === 'bottom' ? data.elemHeight : 0;
        var atOffset = data.at[1] === 'top' ? data.targetHeight : data.at[1] === 'bottom' ? -data.targetHeight : 0;
        var offset = -2 * data.offset[1];
        var newOverTop;
        var newOverBottom;
        if (overTop < 0) {
          newOverBottom = position.top + myOffset + atOffset + offset + data.collisionHeight - outerHeight - withinOffset;
          if (newOverBottom < 0 || newOverBottom < abs(overTop)) {
            position.top += myOffset + atOffset + offset;
          }
        } else if (overBottom > 0) {
          newOverTop = position.top - data.collisionPosition.marginTop + myOffset + atOffset + offset - offsetTop;
          if (newOverTop > 0 || abs(newOverTop) < overBottom) {
            position.top += myOffset + atOffset + offset;
          }
        }
      }
    },
    flipfit: {
      left: function left() {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        collisions.flip.left.apply(this, args);
        collisions.fit.left.apply(this, args);
      },
      top: function top() {
        for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          args[_key2] = arguments[_key2];
        }
        collisions.flip.top.apply(this, args);
        collisions.fit.top.apply(this, args);
      }
    }
  };
  $.position = {
    scrollbarWidth: function scrollbarWidth() {
      if (cachedScrollbarWidth !== undefined) {
        return cachedScrollbarWidth;
      }
      var div = $('<div ' + "style='display:block;position:absolute;width:50px;height:50px;overflow:hidden;'>" + "<div style='height:100px;width:auto;'></div></div>");
      var innerDiv = div.children()[0];
      $('body').append(div);
      var w1 = innerDiv.offsetWidth;
      div.css('overflow', 'scroll');
      var w2 = innerDiv.offsetWidth;
      if (w1 === w2) {
        w2 = div[0].clientWidth;
      }
      div.remove();
      cachedScrollbarWidth = w1 - w2;
      return cachedScrollbarWidth;
    },
    getScrollInfo: function getScrollInfo(within) {
      var overflowX = within.isWindow || within.isDocument ? '' : within.element.css('overflow-x');
      var overflowY = within.isWindow || within.isDocument ? '' : within.element.css('overflow-y');
      var hasOverflowX = overflowX === 'scroll' || overflowX === 'auto' && within.width < within.element[0].scrollWidth;
      var hasOverflowY = overflowY === 'scroll' || overflowY === 'auto' && within.height < within.element[0].scrollHeight;
      return {
        width: hasOverflowY ? $.position.scrollbarWidth() : 0,
        height: hasOverflowX ? $.position.scrollbarWidth() : 0
      };
    },
    getWithinInfo: function getWithinInfo(element) {
      var withinElement = $(element || window);
      var isWindow = $.isWindow(withinElement[0]);
      var isDocument = !!withinElement[0] && withinElement[0].nodeType === 9;
      var hasOffset = !isWindow && !isDocument;
      return {
        element: withinElement,
        isWindow: isWindow,
        isDocument: isDocument,
        offset: hasOffset ? $(element).offset() : {
          left: 0,
          top: 0
        },
        scrollLeft: withinElement.scrollLeft(),
        scrollTop: withinElement.scrollTop(),
        width: withinElement.outerWidth(),
        height: withinElement.outerHeight()
      };
    }
  };
  $.fn.position = function (options) {
    if (!options || !options.of) {
      return _position.apply(this, arguments);
    }
    options = $.extend({}, options);
    var within = $.position.getWithinInfo(options.within);
    var scrollInfo = $.position.getScrollInfo(within);
    var collision = (options.collision || 'flip').split(' ');
    var offsets = {};
    var target = typeof options.of === 'string' ? $(document).find(options.of) : $(options.of);
    var dimensions = getDimensions(target);
    var targetWidth = dimensions.width;
    var targetHeight = dimensions.height;
    var targetOffset = dimensions.offset;
    if (target[0].preventDefault) {
      options.at = 'left top';
    }
    var basePosition = $.extend({}, targetOffset);
    $.each(['my', 'at'], function () {
      var pos = (options[this] || '').split(' ');
      if (pos.length === 1) {
        pos = regexHorizontal.test(pos[0]) ? pos.concat(['center']) : regexVertical.test(pos[0]) ? ['center'].concat(pos) : ['center', 'center'];
      }
      pos[0] = regexHorizontal.test(pos[0]) ? pos[0] : 'center';
      pos[1] = regexVertical.test(pos[1]) ? pos[1] : 'center';
      var horizontalOffset = regexOffset.exec(pos[0]);
      var verticalOffset = regexOffset.exec(pos[1]);
      offsets[this] = [horizontalOffset ? horizontalOffset[0] : 0, verticalOffset ? verticalOffset[0] : 0];
      options[this] = [regexPosition.exec(pos[0])[0], regexPosition.exec(pos[1])[0]];
    });
    if (collision.length === 1) {
      collision[1] = collision[0];
    }
    if (options.at[0] === 'right') {
      basePosition.left += targetWidth;
    } else if (options.at[0] === 'center') {
      basePosition.left += targetWidth / 2;
    }
    if (options.at[1] === 'bottom') {
      basePosition.top += targetHeight;
    } else if (options.at[1] === 'center') {
      basePosition.top += targetHeight / 2;
    }
    var atOffset = getOffsets(offsets.at, targetWidth, targetHeight);
    basePosition.left += atOffset[0];
    basePosition.top += atOffset[1];
    return this.each(function () {
      var using;
      var elem = $(this);
      var elemWidth = elem.outerWidth();
      var elemHeight = elem.outerHeight();
      var marginLeft = parseCss(this, 'marginLeft');
      var marginTop = parseCss(this, 'marginTop');
      var collisionWidth = elemWidth + marginLeft + parseCss(this, 'marginRight') + scrollInfo.width;
      var collisionHeight = elemHeight + marginTop + parseCss(this, 'marginBottom') + scrollInfo.height;
      var position = $.extend({}, basePosition);
      var myOffset = getOffsets(offsets.my, elem.outerWidth(), elem.outerHeight());
      if (options.my[0] === 'right') {
        position.left -= elemWidth;
      } else if (options.my[0] === 'center') {
        position.left -= elemWidth / 2;
      }
      if (options.my[1] === 'bottom') {
        position.top -= elemHeight;
      } else if (options.my[1] === 'center') {
        position.top -= elemHeight / 2;
      }
      position.left += myOffset[0];
      position.top += myOffset[1];
      var collisionPosition = {
        marginLeft: marginLeft,
        marginTop: marginTop
      };
      $.each(['left', 'top'], function (i, dir) {
        if (collisions[collision[i]]) {
          collisions[collision[i]][dir](position, {
            targetWidth: targetWidth,
            targetHeight: targetHeight,
            elemWidth: elemWidth,
            elemHeight: elemHeight,
            collisionPosition: collisionPosition,
            collisionWidth: collisionWidth,
            collisionHeight: collisionHeight,
            offset: [atOffset[0] + myOffset[0], atOffset[1] + myOffset[1]],
            my: options.my,
            at: options.at,
            within: within,
            elem: elem
          });
        }
      });
      if (options.using) {
        using = function using(props) {
          var left = targetOffset.left - position.left;
          var right = left + targetWidth - elemWidth;
          var top = targetOffset.top - position.top;
          var bottom = top + targetHeight - elemHeight;
          var feedback = {
            target: {
              element: target,
              left: targetOffset.left,
              top: targetOffset.top,
              width: targetWidth,
              height: targetHeight
            },
            element: {
              element: elem,
              left: position.left,
              top: position.top,
              width: elemWidth,
              height: elemHeight
            },
            horizontal: right < 0 ? 'left' : left > 0 ? 'right' : 'center',
            vertical: bottom < 0 ? 'top' : top > 0 ? 'bottom' : 'middle'
          };
          if (targetWidth < elemWidth && abs(left + right) < targetWidth) {
            feedback.horizontal = 'center';
          }
          if (targetHeight < elemHeight && abs(top + bottom) < targetHeight) {
            feedback.vertical = 'middle';
          }
          if (max(abs(left), abs(right)) > max(abs(top), abs(bottom))) {
            feedback.important = 'horizontal';
          } else {
            feedback.important = 'vertical';
          }
          options.using.call(this, props, feedback);
        };
      }
      elem.offset($.extend(position, {
        using: using
      }));
    });
  };
  if (!$.hasOwnProperty('ui')) {
    $.ui = {};
  }
  $.ui.position = collisions;
})(jQuery);;
/**
 * @file
 * Extends autocomplete based on jQuery UI.
 *
 * @todo Remove once jQuery UI is no longer used?
 */

(function ($, Drupal) {
  'use strict';

  // Ensure the input element has a "change" event triggered. This is important
  // so that summaries in vertical tabs can be updated properly.
  // @see Drupal.behaviors.formUpdated
  $(document).on('autocompleteselect', '.form-autocomplete', function (e) {
    $(e.target).trigger('change.formUpdated');
  });

  // Extend ui.autocomplete widget so it triggers the glyphicon throbber.
  $.widget('ui.autocomplete', $.ui.autocomplete, {
    _search: function (value) {
      this.pending++;
      Drupal.Ajax.prototype.glyphiconStart(this.element);
      this.cancelSearch = false;
      this.source({term: value}, this._response());
    },
    _response: function () {
      var index = ++this.requestIndex;
      return $.proxy(function (content) {
        if (index === this.requestIndex) this.__response(content);
        this.pending--;
        if (!this.pending) Drupal.Ajax.prototype.glyphiconStop(this.element);
      }, this);
    }
  });

})(jQuery, Drupal);
;
/**
 * @file
 * Expands the behaviour of the default autocompletion.
 */

(function ($, Drupal, drupalSettings, once) {

  'use strict';

  // As a safety precaution, bail if the Drupal Core autocomplete framework is
  // not present.
  if (!Drupal.autocomplete) {
    return;
  }

  var autocomplete = {};

  /**
   * Retrieves the custom settings for an autocomplete-enabled input field.
   *
   * @param {HTMLElement} input
   *   The input field.
   * @param {object} globalSettings
   *   The object containing global settings. If none is passed, drupalSettings
   *   is used instead.
   *
   * @return {object}
   *   The effective settings for the given input fields, with defaults set if
   *   applicable.
   */
  autocomplete.getSettings = function (input, globalSettings) {
    globalSettings = globalSettings || drupalSettings || {};
    // Set defaults for all known settings.
    var settings = {
      auto_submit: false,
      delay: 0,
      min_length: 1,
      selector: ':submit',
    };
    var search = $(input).data('search-api-autocomplete-search');
    if (search
        && globalSettings.search_api_autocomplete
        && globalSettings.search_api_autocomplete[search]) {
      $.extend(settings, globalSettings.search_api_autocomplete[search]);
    }
    return settings;
  };

  /**
   * Attaches our custom autocomplete settings to all affected fields.
   *
   * @type {Drupal~behavior}
   *
   * @prop {Drupal~behaviorAttach} attach
   *   Attaches the autocomplete behaviors.
   */
  Drupal.behaviors.searchApiAutocomplete = {
    attach: function (context, settings) {
      // Find all our fields with autocomplete settings.
      $(once('search-api-autocomplete',
        '.ui-autocomplete-input[data-search-api-autocomplete-search]',
        context)).each(function () {
          var uiAutocomplete = $(this).data('ui-autocomplete');
          if (!uiAutocomplete) {
            return;
          }
          var $element = uiAutocomplete.menu.element;
          $element.data('search-api-autocomplete-input-id', this.id);
          $element.addClass('search-api-autocomplete-search');
          var elementSettings = autocomplete.getSettings(this, settings);
          if (elementSettings['delay']) {
            uiAutocomplete.options['delay'] = elementSettings['delay'];
          }
          if (elementSettings['min_length']) {
            uiAutocomplete.options['minLength'] = elementSettings['min_length'];
          }
          // Override the "select" callback of the jQuery UI autocomplete.
          var oldSelect = uiAutocomplete.options.select;
          uiAutocomplete.options.select = function (event, ui) {
            // If this is a URL suggestion, instead of autocompleting we
            // redirect the user to that URL.
            if (ui.item.url) {
              location.href = ui.item.url;
              return false;
            }

            var ret = oldSelect.apply(this, arguments);

            // If auto-submit is enabled, submit the form.
            if (elementSettings['auto_submit'] && elementSettings['selector']) {
              $(elementSettings['selector'], this.form).trigger('click');
            }

            return ret;
          };
        });
    }
  };

  Drupal.SearchApiAutocomplete = autocomplete;

})(jQuery, Drupal, drupalSettings, once);
;
