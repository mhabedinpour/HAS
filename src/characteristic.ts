/**
 * @file Homekit Service Characteristic
 * @author MohammadHossein Abedinpour <abedinpourmh@gmail.com>
 * @licence Apache2
 */

import Service from './service';

export type ValueFormat = 'bool' | 'uint8' | 'uint16' | 'uint32' | 'int' | 'float' | 'string' | 'tlv8' | 'data';
export type ValueUnit = 'celsius' | 'percantage' | 'arcdegrees' | 'lux' | 'seconds';

export default class Characteristic {
    /**
     * @property ID of this characteristic / must be unique at service level
     * @private
     */
    private ID: number;

    /**
     * @property Characteristic Type
     * @private
     */
    private type: string;

    /**
     * @property Characteristic Value
     * @private
     */
    private value?: any;

    /**
     * @property Characteristic Value Format
     * @private
     */
    private valueFormat: ValueFormat;

    /**
     * @property Characteristic Value Unit
     * @private
     */
    private valueUnit?: ValueUnit;

    /**
     * @property Characteristic Min. Value
     * @private
     */
    private minValue?: number;

    /**
     * @property Characteristic Max. Value
     * @private
     */
    private maxValue?: number;

    /**
     * @property Characteristic Step Value
     * @private
     */
    private stepValue?: number;

    /**
     * @property Characteristic Value Max. Length
     * @private
     */
    private maxLength?: number;

    /**
     * @property Characteristic Valid Values
     * @private
     */
    private validValues?: number[];

    /**
     * @property Characteristic Valid Range Values
     * @private
     */
    private validRangeValues?: number[];

    /**
     * @property Whether or not this is a hidden characteristic
     * @private
     */
    private isHidden?: boolean;

    /**
     * @property Whether or not this characteristic supports notifications
     * @private
     */
    private hasNotifications?: boolean;

    /**
     * @property Whether or not this characteristic has a value
     * @private
     */
    private hasValue?: boolean;

    /**
     * @property Whether or not this characteristic is readonly
     * @private
     */
    private isReadonly?: boolean;

    /**
     * @property Whether or not this characteristic needs additional authorization
     * @private
     */
    private additionalAuthorization?: boolean;

    /**
     * @property An instance to this characteristic's service
     * @private
     */
    private service?: Service;

    /**
     * @property Characteristic Description
     * @private
     */
    private description?: string;

    constructor(ID: number, type: string, valueFormat: ValueFormat, isHidden?: boolean, hasNotifications?: boolean, hasValue?: boolean, isReadonly?: boolean, additionalAuthorization?: boolean, valueUnit?: ValueUnit, description?: string, minValue?: number, maxValue?: number, stepValue?: number, maxLength?: number, validValues?: number[], validRangeValues?: number[]) {
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

    /**
     * @method Returns ID of this characteristic
     * @returns {number}
     */
    public getID(): number {
        return this.ID;
    }

    /**
     * @method Returns type of this characteristic
     * @returns {string}
     */
    public getType(): string {
        return this.type;
    }

    /**
     * @method Whether or not this is a numeric characteristic
     * @returns {boolean}
     */
    private isNumeric(): boolean {
        if (!this.valueFormat)
            return false;
        return ['uint8', 'uint16', 'uint32', 'int', 'float'].indexOf(this.valueFormat as string) > -1;
    }

    /**
     * @method Whether or not this characteristic's value has a length
     * @returns {boolean}
     */
    private hasLength(): boolean {
        if (!this.valueFormat)
            return false;
        return ['string', 'tlv8', 'data'].indexOf(this.valueFormat as string) > -1;
    }

    /**
     * @method Whether or not this characteristic's value is a buffer
     * @returns {boolean}
     */
    private isBuffer(): boolean {
        if (!this.valueFormat)
            return false;
        return ['tlv8', 'data'].indexOf(this.valueFormat as string) > -1;
    }


    /**
     * @method Sets the value of this characteristic
     * @param value
     */
    public setValue(value: any) {
        if (this.isValid(value))
            this.value = value;
    }

    /**
     * @method Returns the value of this characteristic
     * @returns {any}
     */
    public getValue(): any {
        return this.value;
    }

    /**
     * @method Sets the service which is related to this characteristic
     * @param service
     */
    public setService(service: Service) {
        if (this.service)
            throw new Error('Service is already set.');

        this.service = service;
    }

    /**
     * @method Checks whether the provided value is valid or not
     * @param value
     * @returns {boolean}
     */
    private isValid(value: any): boolean {
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
    }

    /**
     * @method Returns an object which represents this characteristic
     * @returns {{[p: string]: any}}
     */
    public toJSON(): {} {
        let value;
        if (this.hasValue && this.value != undefined) {
            if (this.isNumeric())
                value = parseFloat(this.value);
            else if (this.valueFormat == 'bool')
                value = this.value == 1;
            else if (this.isBuffer())
                value = this.value.toString('base64');
            else
                value = this.value;
        } else
            value = null;

        let permissions: string[] = [];
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

        var object: { [index: string]: any } = {
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
    }
}