"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var configurationHelper_1 = require("./configurationHelper");
var HTTP = require("http");
var express_1 = require("./express");
var TCP_1 = require("./TCP");
var HAS = (function () {
    function HAS(config) {
        this.bonjour = require('bonjour')();
        if (config)
            this.config = config;
        else
            throw new Error('Invalid HAS Config');
        this.expressApp = express_1.default(this);
        this.HTTPServer = HTTP.createServer(this.expressApp);
        this.TCPServer = new TCP_1.default(this);
    }
    HAS.prototype.startServer = function () {
        var _this = this;
        this.bonjourService = this.bonjour.publish({
            name: this.config.deviceName,
            type: 'hap',
            port: this.config.TCPPort,
            txt: this.config.getTXTRecords(),
        });
        this.bonjourService.on('up', function () {
            console.log('Bonjour is up');
        });
        this.HTTPServer.timeout = 0;
        this.HTTPServer.listen(0);
        this.HTTPServer.on('listening', function () {
            console.log("HTTP Server Listening on " + _this.HTTPServer.address().port);
        });
        this.TCPServer.listen(this.config.TCPPort, this.HTTPServer.address().port);
        this.TCPServer.on('listening', function () {
            console.log("TCP Server Listening on " + _this.config.TCPPort);
        });
    };
    HAS.prototype.stopServer = function () {
        if (this.bonjourService)
            this.bonjourService.stop();
        if (this.HTTPServer)
            this.HTTPServer.close();
        if (this.TCPServer)
            this.TCPServer.close();
    };
    return HAS;
}());
exports.HAS = HAS;
exports.HASConfigHelper = configurationHelper_1.HASConfig;
