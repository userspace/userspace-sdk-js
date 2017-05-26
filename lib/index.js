'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.topapps = exports.size = exports.localToken = exports.signout = exports.signin = exports.watchLogin = exports.parse = exports.urls = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; /* eslint no-param-reassign: ["error", { "props": false }] */


var _jwtDecode = require('jwt-decode');

var _jwtDecode2 = _interopRequireDefault(_jwtDecode);

var _axios = require('axios');

var _axios2 = _interopRequireDefault(_axios);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var isNode = (typeof process === 'undefined' ? 'undefined' : _typeof(process)) === 'object' && '' + process === '[object process]';

var Parse = isNode ? require('parse/node') : require('parse');

var base = process.env.USERSPACE_GATEWAY || 'https://gateway.user.space';

var urls = {
  dashboard: function dashboard(session) {
    return base + '/login/?token=' + session.id_token;
  },
  login: function login() {
    return 'https://gateway.user.space/sign/' + btoa(window.location.origin + window.location.pathname);
  },
  myuserspace: function myuserspace() {
    return 'https://my.user.space/app.html';
  }
};

function parse() {
  var namespace = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'main';

  Parse.initialize(namespace);
  Parse.serverURL = base + '/' + namespace;
  Parse.login = function (creds) {
    Parse.serverAuthToken = creds;
    if (!Parse.serverAuthToken) return;
    Parse.session = {};
    try {
      Parse.session.client = (0, _jwtDecode2.default)(creds).aud;
    } catch (e) {
      // do nothing
    }

    _axios2.default.get(base + '/apps?id=' + Parse.session.client).then(function (res) {
      Parse.session.owner = res.data.owner;
    });
  };
  Parse.logout = function () {
    Parse.serverAuthToken = null;
  };

  var Notify = Parse.Object.extend('Notify');
  Parse.share = function (_ref) {
    var object = _ref.object,
        app = _ref.app,
        user = _ref.user;
    return new Notify({
      ref: object.id,
      clazz: object.className,
      app: app || Parse.session.client,
      user: user || Parse.session.owner
    }).save();
  };

  return Parse;
}

var offsetSeconds = 5;

var Token = function () {
  function Token(token) {
    _classCallCheck(this, Token);

    this.token = token;
  }

  _createClass(Token, [{
    key: 'isLoggedIn',
    value: function isLoggedIn() {
      return !this.isTokenExpired();
    }
  }, {
    key: 'isTokenExpired',
    value: function isTokenExpired() {
      var date = this.getTokenExpirationDate();
      return date === null || !(date.valueOf() > new Date().valueOf() + offsetSeconds * 1000);
    }
  }, {
    key: 'getTokenExpirationDate',
    value: function getTokenExpirationDate() {
      if (!this.token) return null;
      var decoded = (0, _jwtDecode2.default)(this.token);
      if (!decoded.exp) return null;
      var date = new Date(0); // The 0 here is the key, which sets the date to the epoch
      date.setUTCSeconds(decoded.exp);
      return date;
    }
  }], [{
    key: 'clear',
    value: function clear() {
      return new Token();
    }
  }]);

  return Token;
}();

function isTokenStillValid(token) {
  if (!token || token === null || token === '' || token === undefined) return false;
  var decoded = (0, _jwtDecode2.default)(token);
  if (!decoded || !decoded.exp) return false;
  var date = new Date(0);
  date.setUTCSeconds(decoded.exp);
  return date.valueOf() > new Date().valueOf() + offsetSeconds * 1000;
}

function watchLogin(session) {
  var token = (window.location.search.match(/[?&]token=(.*)[#&]?/) || []).pop() || session.id_token;
  if (!token || !isTokenStillValid(token)) window.location = urls.login();
  session.id_token = token;

  var hasToken = window.location.search.match(/[?&]token=(.*)[#&]?/);
  if (hasToken && hasToken.length === 2) {
    session.id_token = hasToken[1];
    window.location = window.location.origin + window.location.pathname;
  }
}

function signin(app) {
  var appCode = new Buffer(app || window.location.origin + window.location.pathname).toString('base64');
  window.location = base + '/sign/' + appCode;
}

function signout(session) {
  session.id_token = '';
}

function localToken(session) {
  return new Token(session.id_token);
}

var withAuth = function withAuth(session) {
  return {
    headers: {
      Authorization: 'Bearer ' + session.id_token
    }
  };
};

function topapps(session) {
  return _axios2.default.get(base + '/topapps', withAuth(session)).then(function (res) {
    return res.data;
  });
}

function size(session) {
  return _axios2.default.get(base + '/size', withAuth(session)).then(function (res) {
    return res.data;
  });
}

exports.urls = urls;
exports.parse = parse;
exports.watchLogin = watchLogin;
exports.signin = signin;
exports.signout = signout;
exports.localToken = localToken;
exports.size = size;
exports.topapps = topapps;