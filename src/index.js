/* eslint no-param-reassign: ["error", { "props": false }] */
import decode from 'jwt-decode';
import axios from 'axios';

const isNode = typeof process === 'object' && `${process}` === '[object process]';

const Parse = isNode ? require('parse/node') : require('parse');

const base = process.env.USERSPACE_GATEWAY || 'https://gateway.user.space';

const urls = {
  dashboard: session => `${base}/login/?token=${session.id_token}`,
  login: () => `https://gateway.user.space/sign/${btoa(window.location.origin + window.location.pathname)}`,
  myuserspace: () => 'https://my.user.space/app.html',
};

function parse(namespace = 'main') {
  Parse.initialize(namespace);
  Parse.serverURL = `${base}/${namespace}`;
  Parse.login = (creds) => {
    Parse.serverAuthToken = creds;
    if (!Parse.serverAuthToken) return;
    Parse.session = {};
    try {
      Parse.session.client = decode(creds).aud;
    } catch (e) {
        // do nothing
    }

    axios.get(`${base}/apps?id=${Parse.session.client}`)
      .then((res) => {
        Parse.session.owner = res.data.owner;
      });
  };
  Parse.logout = () => {
    Parse.serverAuthToken = null;
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
  if (!token || token === null || token === '' || token === undefined) return false;
  const decoded = decode(token);
  if (!decoded || !decoded.exp) return false;
  const date = new Date(0);
  date.setUTCSeconds(decoded.exp);
  return date.valueOf() > (new Date().valueOf() + (offsetSeconds * 1000));
}

function watchLogin(session) {
  const token = (window.location.search.match(/[?&]token=(.*)[#&]?/) || []).pop() || session.id_token;
  if (!token || !isTokenStillValid(token)) window.location = urls.login();
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
  return axios.get(`${base}/topapps`, withAuth(session)).then(res => res.data);
}

function size(session) {
  return axios.get(`${base}/size`, withAuth(session)).then(res => res.data);
}

export {
  urls, parse, watchLogin, signin, signout, localToken, size, topapps,
};
