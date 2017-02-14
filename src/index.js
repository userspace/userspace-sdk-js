/* eslint no-param-reassign: ["error", { "props": false }] */
import decode from 'jwt-decode';

const isNode = typeof process === 'object' && `${process}` === '[object process]';

const Parse = isNode ? require('parse/node') : require('parse');
const fetcher = isNode ? require('node-fetch') : fetch;

const base = process.env.USERSPACE_GATEWAY || 'https://gateway.user.space';

const urls = {
  dashboard: token => `${base}/login/?token=${token}`,
};

function parse(namespace = 'main') {
  Parse.initialize(namespace);
  Parse.serverURL = `${base}/${namespace}`;
  Parse.login = (creds) => {
    Parse.credentials = creds;
    if (!Parse.credentials) return;
    Parse.session = {};
    try {
      Parse.session.client = decode(creds).aud;
    } catch (e) {
        // do nothing
    }

    fetcher(`${base}/apps?id=${Parse.session.client}`)
      .then((res) => {
        Parse.session.owner = res.body.owner;
      });
  };
  Parse.logout = () => {
    Parse.credentials = null;
  };

  const Notify = Parse.Object.extend('Notify');
  Parse.share = ({ object, app, user }) => new Notify({
    ref: object.id,
    clazz: object.className,
    app: app || Parse.session.client,
    user: user || Parse.session.owner,
  }).save();

  return Parse;
}

const offsetSeconds = 5;

class Token {
  constructor(token) {
    this.token = token;
  }
  isLoggedIn() {
    return !this.isTokenExpired();
  }
  isTokenExpired() {
    const date = this.getTokenExpirationDate();
    return date === null || !(date.valueOf() > (new Date().valueOf() + (offsetSeconds * 1000)));
  }
  getTokenExpirationDate() {
    if (!this.token) return null;
    const decoded = decode(this.token);
    if (!decoded.exp) return null;
    const date = new Date(0); // The 0 here is the key, which sets the date to the epoch
    date.setUTCSeconds(decoded.exp);
    return date;
  }
  static clear() {
    return new Token();
  }
}

function isTokenStillValid(token) {
  const decoded = decode(token);
  if (!decoded.exp) return false;
  const date = new Date(0);
  date.setUTCSeconds(decoded.exp);
  return !(date.valueOf() > (new Date().valueOf() + (offsetSeconds * 1000)));
}

function watchLogin(session) {
  const token = (window.location.search.match(/[?&]token=(.*)[#&]?/) || []).pop() || session.id_token;
  if (!token || !isTokenStillValid(token)) window.location = `https://gateway.user.space/sign/${btoa(window.location.origin + window.location.pathname)}`;
  session.id_token = token;

  const hasToken = window.location.search.match(/[?&]token=(.*)[#&]?/);
  if (hasToken && hasToken.length === 2) {
    session.id_token = hasToken[1];
    window.location = window.location.origin + window.location.pathname;
  }
}

function signin(app) {
  const appCode = new Buffer(app || window.location.origin + window.location.pathname).toString('base64');
  window.location = `${base}/sign/${appCode}`;
}

function signout(session) {
  session.id_token = '';
}

function localToken(session) {
  return new Token(session.id_token);
}

const withAuth = session => ({
  headers: {
    Authorization: `Bearer ${session.id_token}`,
  },
});

function topapps(session) {
  return fetcher(`${base}/topapps`, withAuth(session)).then(res => res.json());
}

function size(session) {
  return fetcher(`${base}/size`, withAuth(session)).then(res => res.json());
}

export {
  urls, parse, watchLogin, signin, signout, localToken, size, topapps,
};
