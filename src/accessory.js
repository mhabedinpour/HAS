"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Accessory = (function () {
    function Accessory(ID) {
        this.services = {};
        this.IIDMap = {};
        this.ID = ID;
    }
    Accessory.prototype.getID = function () {
        return this.ID;
    };
    Accessory.prototype.getServices = function () {
        return this.services;
    };
    Accessory.prototype.setServer = function (server) {
        if (this.server)
            throw new Error('Server is already set.');
        this.server = server;
    };
    Accessory.prototype.addService = function (service) {
        if (this.server)
            throw new Error('Server is already set.');
        if (Object.keys(this.services).length >= 100)
            throw new Error('Accessory can not have more than 100 services.');
        var serviceID = service.getID();
        if (serviceID < 1 || serviceID > 999)
            throw new Error('Service ID can not be less than 1 or more than 999.');
        if (Object.keys(service.getCharacteristics()).length <= 0)
            throw new Error('Service must contain at least one characteristic.');
        if (this.services[serviceID])
            throw new Error('Service ID already exists.');
        if (service.getIsPrimary() && this.primaryService)
            throw new Error('Primary service already exists.');
        if (service.getLinkedServices().length) {
            for (var _i = 0, _a = service.getLinkedServices(); _i < _a.length; _i++) {
                var serviceID_1 = _a[_i];
                if (!this.services[serviceID_1])
                    throw new Error('Linked service does not exists on this accessory.');
            }
        }
        this.services[serviceID] = service;
        service.setAccessory(this);
        if (service.getIsPrimary())
            this.primaryService = service;
    };
    Accessory.prototype.addServices = function () {
        var services = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            services[_i] = arguments[_i];
        }
        for (var _a = 0, services_1 = services; _a < services_1.length; _a++) {
            var service = services_1[_a];
            this.addService(service);
        }
    };
    Accessory.prototype.toJSON = function () {
        var services = [];
        for (var index in this.services) {
            var JSON_1 = this.services[index].toJSON();
            for (var _i = 0, _a = JSON_1.characteristics; _i < _a.length; _i++) {
                var characteristic = _a[_i];
                var IID = (JSON_1.iid + characteristic.iid) * (JSON_1.iid + characteristic.iid + 1) * 0.5 + characteristic.iid;
                this.IIDMap[IID] = {
                    serviceID: JSON_1.iid,
                    characteristicID: characteristic.iid
                };
                characteristic.iid = IID;
            }
            JSON_1.iid = JSON_1.iid == 1 ? 1 : 2000000 + JSON_1.iid;
            for (var index2 in JSON_1.linked)
                JSON_1.linked[index2] = JSON_1.linked[index2] == 1 ? 1 : 2000000 + JSON_1.linked[index2];
            services.push(JSON_1);
        }
        return {
            aid: this.ID,
            services: services,
        };
    };
    return Accessory;
}());
exports.default = Accessory;
