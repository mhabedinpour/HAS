"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Characteristic = (function () {
    function Characteristic(ID, type, valueFormat, isHidden, hasNotifications, hasValue, isReadonly, additionalAuthorization, valueUnit, description, minValue, maxValue, stepValue, maxLength, validValues, validRangeValues) {
        this.ID = ID;
        this.type = type;
        this.valueFormat = valueFormat;
        this.valueUnit = valueUnit;
        this.description = description;
        if (this.isNumeric()) {
            this.minValue = minValue;
            this.maxLength = maxValue;
            this.stepValue = stepValue;
            this.validValues = validValues;
            this.validRangeValues = validRangeValues;
        }
        if (this.hasLength())
            this.maxLength = maxLength;
        if (this.maxLength && this.maxLength > 256 && !this.isBuffer())
            this.maxLength = 256;
        this.isHidden = isHidden;
        this.hasNotifications = hasNotifications;
        this.hasValue = hasValue;
        this.isReadonly = isReadonly;
        this.additionalAuthorization = additionalAuthorization;
    }
    Characteristic.prototype.getID = function () {
        return this.ID;
    };
    Characteristic.prototype.getType = function () {
        return this.type;
    };
    Characteristic.prototype.isNumeric = function () {
        if (!this.valueFormat)
            return false;
        return ['uint8', 'uint16', 'uint32', 'int', 'float'].indexOf(this.valueFormat) > -1;
    };
    Characteristic.prototype.hasLength = function () {
        if (!this.valueFormat)
            return false;
        return ['string', 'tlv8', 'data'].indexOf(this.valueFormat) > -1;
    };
    Characteristic.prototype.isBuffer = function () {
        if (!this.valueFormat)
            return false;
        return ['tlv8', 'data'].indexOf(this.valueFormat) > -1;
    };
    Characteristic.prototype.setValue = function (value) {
        if (this.isValid(value))
            this.value = value;
    };
    Characteristic.prototype.getValue = function () {
        return this.value;
    };
    Characteristic.prototype.setService = function (service) {
        if (this.service)
            throw new Error('Service is already set.');
        this.service = service;
    };
    Characteristic.prototype.isValid = function (value) {
        if (this.isNumeric()) {
            if (this.minValue && value < this.minValue)
                return false;
            if (this.maxValue && value > this.maxValue)
                return false;
            if (this.stepValue && value % this.stepValue != 0)
                return false;
            if (this.validValues && this.validValues.indexOf(value) <= -1)
                return false;
            if (this.validRangeValues && (this.value < this.validRangeValues[0] || this.value > this.validRangeValues[1]))
                return false;
        }
        if (this.maxLength && value.length > this.maxLength)
            return false;
        return true;
    };
    Characteristic.prototype.toJSON = function () {
        var value;
        if (this.hasValue && this.value != undefined) {
            if (this.isNumeric())
                value = parseFloat(this.value);
            else if (this.valueFormat == 'bool')
                value = this.value == 1;
            else if (this.isBuffer())
                value = this.value.toString('base64');
            else
                value = this.value;
        }
        else
            value = null;
        var permissions = [];
        if (this.hasValue)
            permissions.push('pr');
        if (!this.isReadonly)
            permissions.push('pw');
        if (this.hasNotifications)
            permissions.push('ev');
        if (this.additionalAuthorization)
            permissions.push('aa');
        if (this.isHidden)
            permissions.push('hd');
        var object = {
            type: this.type,
            iid: this.ID,
            perms: permissions,
            format: this.valueFormat,
        };
        if (value != null && value != undefined)
            object['value'] = value;
        if (this.hasNotifications)
            object['ev'] = true;
        if (this.description)
            object['description'] = this.description;
        if (this.valueUnit)
            object['unit'] = this.valueUnit;
        if (this.minValue)
            object['minValue'] = this.minValue;
        if (this.maxValue)
            object['maxValue'] = this.maxValue;
        if (this.stepValue)
            object['minStep'] = this.stepValue;
        if (this.maxLength)
            object[this.isBuffer() ? 'maxDataLen' : 'maxLen'] = this.maxLength;
        if (this.validValues)
            object['valid-values'] = this.validValues;
        if (this.validRangeValues)
            object['valid-values-range'] = this.validRangeValues;
        return object;
    };
    return Characteristic;
}());
exports.default = Characteristic;
