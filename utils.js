const Store = require('electron-store');
const { ipcRenderer, dialog, shell } = require('electron');
const config = require('./config.js');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const timers = require('timers');
const i18next = require('i18next');
const fsBackend = require('i18next-fs-backend');
const { google } = require('googleapis');
const Chart = require('chart.js/auto');
const WebSocket = require('ws');
const flatpickr = require("flatpickr");

module.exports = {
    Store,
    fs,
    path,
    config,
    ipcRenderer,
    dialog,
    shell,
    nodemailer,
    timers,
    i18next,
    fsBackend,
    google,
    Chart,
    WebSocket,
    flatpickr,
}