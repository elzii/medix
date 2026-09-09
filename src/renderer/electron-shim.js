'use strict';

const electron = window.require ? window.require('electron') : require('electron');
let remote;
try {
  remote = require('@electron/remote');
} catch (e) {
  remote = electron.remote;
}

module.exports = {
  ...electron,
  remote,
  default: {
    ...electron,
    remote
  }
};
