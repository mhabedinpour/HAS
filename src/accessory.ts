/**
 * @file Homekit Accessory Wrapper
 * @author MohammadHossein Abedinpour <abedinpourmh@gmail.com>
 * @licence Apache2
 */

import Service from './service';
import HAS from './HAS';

export default class Accessory {

    /**
     * @property ID of this accessory / must be unique
     * @private
     */
    private ID: number;

    /**
     * @property List of the services of this accessory
     * @private
     */
    private services: { [index: number]: Service } = {};

    /**
     * @property Accessory Primary Service
     * @private
     */
    private primaryService: Service;

    /**
     * @property Map for IIDs which are generating by pairing function to invert them
     * @private
     */
    private IIDMap: { [index: number]: { serviceID: number, characteristicID: number } } = {};

    /**
     * @property An instance to this accessory's server
     * @private
     */
    private server?: HAS;

    constructor(ID: number) {
        this.ID = ID;
    }

    /**
     * @method Returns the ID of this accessory
     * @returns {number}
     */
    public getID(): number {
        return this.ID;
    }

    /**
     * @method Returns services of this accessory
     */
    public getServices(): { [index: number]: Service } {
        return this.services;
    }

    /**
     * @method Sets the HAS object which is related to this accessory
     * @param server
     */
    public setServer(server: HAS) {
        if (this.server)
            throw new Error('Server is already set.');

        this.server = server;
    }

    /**
     * @method Adds a service to this accessory
     * @param service
     */
    public addService(service: Service) {
        if (this.server)
            throw new Error('Server is already set.');

        if (Object.keys(this.services).length >= 100)
            throw new Error('Accessory can not have more than 100 services.');

        let serviceID = service.getID();

        if (serviceID < 1 || serviceID > 999)
            throw new Error('Service ID can not be less than 1 or more than 999.');

        if (Object.keys(service.getCharacteristics()).length <= 0)
            throw new Error('Service must contain at least one characteristic.');

        if (this.services[serviceID])
            throw new Error('Service ID already exists.');

        if (service.getIsPrimary() && this.primaryService)
            throw  new Error('Primary service already exists.');

        if (service.getLinkedServices().length) {
            for (let serviceID of service.getLinkedServices()) {
                if (!this.services[serviceID])
                    throw new Error('Linked service does not exists on this accessory.');
            }
        }

        this.services[serviceID] = service;
        service.setAccessory(this);

        if (service.getIsPrimary())
            this.primaryService = service;
    }

    /**
     * @method Adds a group of services to this accessory
     * @param services
     */
    public addServices(...services: Service[]) {
        for (let service of services)
            this.addService(service);
    }

    /**
     * @method Returns an object which represents this accessory
     * @returns {{[p: string]: any}}
     */
    public toJSON(): {} {
        let services: {}[] = [];
        for (let index in this.services) {
            let JSON = this.services[index].toJSON();

            //To have a better API we are forcing unique IDs at just one level, But HAP needs IDs to be unique at both levels.
            //We will use pairing function to generate unique numbers from serviceID and characteristicID to make IDs unique at both levels.
            for (let characteristic of JSON.characteristics) {
                let IID = (JSON.iid + characteristic.iid) * (JSON.iid + characteristic.iid + 1) * 0.5 + characteristic.iid; //Pairing Function https://en.wikipedia.org/wiki/Pairing_function
                this.IIDMap[IID] = {
                    serviceID: JSON.iid,
                    characteristicID: characteristic.iid
                };
                characteristic.iid = IID;
            }

            //Both serviceID and characteristicID is in the range [1, 999]. Max(Pairing(serviceID, characteristicID)) would be 1,998,000
            //To avoid having duplicated IDs in serviceIDs and characteristicIDs, we will add 2000000 to every service ID.
            //1 is the ID of the information service and can not be changed / It is also less than Min(Pairing(serviceID, characteristicID)), Which would not be a problem
            JSON.iid = JSON.iid == 1 ? 1 : 2000000 + JSON.iid;
            for (let index2 in JSON.linked)
                JSON.linked[index2] = JSON.linked[index2] == 1 ? 1 : 2000000 + JSON.linked[index2];

            services.push(JSON);
        }

        return {
            aid: this.ID,
            services: services,
        };
    }
}