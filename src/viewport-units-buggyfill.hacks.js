/*!
 * viewport-units-buggyfill v0.3.1
 * @web: https://github.com/rodneyrehm/viewport-units-buggyfill/
 * @author: Zoltan Hawryluk - http://www.useragentman.com/
 */

(function (root, factory) {
  'use strict';
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define([], factory);
  } else if (typeof exports === 'object') {
    // Node. Does not work with strict CommonJS, but
    // only CommonJS-like enviroments that support module.exports,
    // like Node.
    module.exports = factory();
  } else {
    // Browser globals (root is window)
    root.viewportUnitsBuggyfillHacks = factory();
  }
}(this, function () {
  'use strict';
  
  var calcExpression = /calc\(/g;
  var quoteExpression = /[\"\']/g;
  var urlExpression = /url\([^\)]*\)/g;
  var isOldInternetExplorer = false;
  var supportsVminmax = true;
  var supportsVminmaxCalc = true;

  // WARNING!
  // Do not remove the following conditional comment.
  // It is required to identify the current version of IE

  /*@cc_on

  @if (@_jscript_version <= 10)
    isOldInternetExplorer = true;
    supportsVminmaxCalc = false;
    supportsVminmax = false;
  @end

  @*/

  // from http://stackoverflow.com/questions/326069/how-to-identify-if-a-webpage-is-being-loaded-inside-an-iframe-or-directly-into-t
  function inIframe() {
    try {
      return window.self !== window.top;
    } catch (e) {
      return true;
    }
  }

  
  // iOS SAFARI, IE9: abuse "content" if "use_css_content_hack" specified
  // IE9: abuse "behavior" if "use_css_behavior_hack" specified
  function checkHacks(declarations, rule, name, value) {
    if (!options.contentHack && !options.behaviorHack) {
      return;
    }

    if (name !== 'content' && name !== 'behavior') {
      return;
    }

    var needsCalcFix = (options.contentHack && !supportsVminmaxCalc && name === 'content' && value.indexOf('use_css_content_hack') > -1);
    var needsVminVmaxFix = (options.behaviorHack && !supportsVminmax && name === 'behavior' && value.indexOf('use_css_behavior_hack') > -1);
    if (!needsCalcFix && !needsVminVmaxFix) {
      return;
    }

    var fakeRules = value.replace(quoteExpression, '');
    if (needsVminVmaxFix) {
      fakeRules = fakeRules.replace(urlExpression, '');
    }

    fakeRules.split(';').forEach(function(fakeRuleElement) {
      var fakeRule = fakeRuleElement.split(':');
      if (fakeRule.length !== 2) {
        return;
      }

      var name = fakeRule[0].trim();
      var value = fakeRule[1].trim();
      if (name === 'use_css_content_hack' || name === 'use_css_behavior_hack') {
        return;
      }

      declarations.push([rule, name, value]);
      if (calcExpression.test(value)) {
        var webkitValue = value.replace(calcExpression, '-webkit-calc(');
        declarations.push([rule, name, webkitValue]);
      }
    });
  }

  return {
    initialize: function(options) {
      // Test viewport units support in calc() expressions
      var div = document.createElement('div');
      div.style.width = '1vmax';
      supportsVminmax = div.style.width !== '';

      // there is no accurate way to detect this programmatically.
      if (isMobileSafari) {
        supportsVminmaxCalc = false;
      }
    },

    initializeEvents: function(options, refresh, _refresh) {
      if (options.force) {
        return;
      }

      if (isOldInternetExplorer || inIframe()) {
        window.addEventListener('resize', _refresh, true);
      }
    },

    findDeclarations: function(declarations, rule, name, value) {
      if (name === null) {
        // KeyframesRule does not have a CSS-PropertyName
        return;
      }

      checkHacks(declarations, rule, name, value);
    },

    overwriteDeclarations: function(rule, name, _value) {
      if (isOldInternetExplorer && name === 'filter') {
        // remove unit "px"
        return _value = parseInt(_value, 10);
      }

      return value;
    }
  };

}));