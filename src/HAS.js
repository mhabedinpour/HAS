"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var HTTP = require("http");
var express_1 = require("./express");
var TCP_1 = require("./TCP");
var HAS = (function () {
    function HAS(config) {
        this.accessories = {};
        this.isRunning = false;
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
        if (Object.keys(this.accessories).length <= 0)
            throw new Error('Server must have at least one accessory.');
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
        this.isRunning = true;
        this.config.increaseCCN();
    };
    HAS.prototype.stopServer = function () {
        if (this.bonjourService)
            this.bonjourService.stop();
        if (this.HTTPServer)
            this.HTTPServer.close();
        if (this.TCPServer)
            this.TCPServer.close();
        this.isRunning = false;
    };
    HAS.prototype.addAccessory = function (accessory) {
        var accessoryID = accessory.getID();
        if (accessoryID < 1 || accessoryID > 999)
            throw new Error('Accessory ID can not be less than 1 or more than 999: ' + accessoryID);
        if (Object.keys(this.accessories).length >= 100)
            throw new Error('Server can not have more than 100 accessories: ' + accessoryID);
        if (Object.keys(accessory.getServices()).length <= 0)
            throw new Error('Accessory must contain at least one service: ' + accessoryID);
        if (!accessory.getServices()[1])
            throw new Error('Accessory must contain information service: ' + accessoryID);
        if (this.accessories[accessoryID])
            throw new Error('Accessory ID already exists: ' + accessoryID);
        this.accessories[accessoryID] = accessory;
        accessory.setServer(this);
        if (this.isRunning)
            this.config.increaseCCN();
    };
    HAS.prototype.getAccessories = function () {
        return this.accessories;
    };
    return HAS;
}());
exports.default = HAS;
