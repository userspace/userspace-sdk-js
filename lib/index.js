'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.topapps = exports.size = exports.localToken = exports.signout = exports.signin = exports.watchLogin = exports.userspace = exports.urls = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _jwtDecode = require('jwt-decode');

var _jwtDecode2 = _interopRequireDefault(_jwtDecode);

var _parse = require('parse');

var _parse2 = _interopRequireDefault(_parse);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var base = 'https://user.space';

var urls = {
  dashboard: function dashboard() {
    return base + '/login/?token=' + localStorage.id_token;
  }
};

function userspace() {
  var namespace = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'main';

  _parse2.default.initialize('userspace');
  _parse2.default.serverURL = base + '/' + namespace;
  _parse2.default.login = function (creds) {
    _parse2.default.credentials = creds;
    if (!_parse2.default.credentials) return;
    _parse2.default.session = {};
    try {
      _parse2.default.session.client = (0, _jwtDecode2.default)(creds).aud;
    } catch (e) {
      // do nothing
    }

    fetch(base + '/apps?id=' + _parse2.default.session.client).then(function (res) {
      _parse2.default.session.owner = res.body.owner;
    });
  };
  _parse2.default.logout = function () {
    _parse2.default.credentials = null;
  };

  var Notify = _parse2.default.Object.extend('Notify');
  _parse2.default.share = function (_ref) {
    var object = _ref.object,
        app = _ref.app,
        user = _ref.user;
    return new Notify({
      ref: object.id,
      clazz: object.className,
      app: app || _parse2.default.session.client,
      user: user || _parse2.default.session.owner
    }).save();
  };

  _parse2.default.login(localStorage.id_token);
  return _parse2.default;
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

function watchLogin() {
  var hasToken = window.location.search.match(/[?&]token=(.*)[#&]?/);
  if (hasToken && hasToken.length === 2) {
    localStorage.id_token = hasToken[1];
    window.location = window.location.origin + window.location.pathname;
  }
}

function signin(app) {
  var appCode = new Buffer(app || window.location.origin + window.location.pathname).toString('base64');
  window.location = base + '/sign/' + appCode;
}

function signout() {
  localStorage.id_token = '';
}

function localToken() {
  return new Token(localStorage.id_token);
}

var withAuth = function withAuth() {
  return {
    headers: {
      Authorization: 'Bearer ' + localStorage.id_token
    }
  };
};

function topapps() {
  return fetch(base + '/topapps', withAuth()).then(function (res) {
    return res.json();
  });
}

function size() {
  return fetch(base + '/size', withAuth()).then(function (res) {
    return res.json();
  });
}

exports.urls = urls;
exports.userspace = userspace;
exports.watchLogin = watchLogin;
exports.signin = signin;
exports.signout = signout;
exports.localToken = localToken;
exports.size = size;
exports.topapps = topapps;