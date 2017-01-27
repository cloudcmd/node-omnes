'use strict';

/* global io */

import Emitify from 'emitify';
import {js as loadJs} from 'load.js';

export default (prefix, socketPath, callback) => {
    if (!callback) {
        if (!socketPath) {
            callback    = prefix;
            prefix      = '/omnes';
        } else {
            callback    = socketPath;
            socketPath  = '';
        }
    }
    
    socketPath += '/socket.io';
    
    loadSocket(prefix, () => {
        init();
        
        if (typeof callback === 'function')
            callback(Salam(prefix, socketPath));
    });
}

function loadSocket(prefix, fn) {
    if (window.io)
        return fn();
    
    loadJs(`${prefix}/dist/socket.io.js`, fn);
}

function Salam(prefix, socketPath) {
    if (!(this instanceof Salam))
        return new Salam(prefix, socketPath);
    
    Emitify.call(this);
    this._progress = ProgressProto(prefix, socketPath, this);
}

function init() {
    Salam.prototype = Object.create(Emitify.prototype);
    
    Salam.prototype.pack = function(from, to, files) {
        this._progress.pack(from, to, files);
    };
    
    Salam.prototype.extract = function(from, to, files) {
        this._progress.extract(from, to, files);
    };
    
    Salam.prototype.abort = function() {
        this._progress.abort();
    };
    
    Salam.prototype.pause = function() {
        this._progress.pause();
    };
    
    Salam.prototype.continue   = function() {
        this._progress.continue();
    };
}

function ProgressProto(room, socketPath, omnes) {
    const href = getHost();
    const FIVE_SECONDS = 5000;
    
    if (!(this instanceof ProgressProto))
        return new ProgressProto(room, socketPath, omnes);
    
    const socket = io.connect(href + room, {
        'max reconnection attempts' : Math.pow(2, 32),
        'reconnection limit'        : FIVE_SECONDS,
        path                        : socketPath
    });
    
    omnes.on('auth', (username, password) => {
        socket.emit('auth', username, password);
    });
    
    socket.on('accept', () => {
        omnes.emit('accept');
    });
    
    socket.on('reject', () => {
        omnes.emit('reject');
    });
    
    socket.on('err', (error) => {
        omnes.emit('error', error);
    });
    
    socket.on('file', (name) => {
        omnes.emit('file', name);
    });
    
    socket.on('progress', (percent) => {
        omnes.emit('progress', percent);
    });
    
    socket.on('end', () => {
        omnes.emit('end');
    });
    
    socket.on('connect', () => {
        omnes.emit('connect');
    });
    
    socket.on('disconnect', () => {
        omnes.emit('disconnect');
    });
    
    this.pause = () => {
        socket.emit('pause');
    };
    
    this.continue = () => {
        socket.emit('continue');
    };
    
    this.abort = () => {
        socket.emit('abort');
    };
    
    this.extract = (from, to) => {
        socket.emit('extract', from, to);
    };
    
    function getHost() {
        const l = location;
        const href = l.origin || l.protocol + '//' + l.host;
        
        return href;
    }
}

