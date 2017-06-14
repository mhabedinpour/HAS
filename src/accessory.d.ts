import Service from './service';
import HAS from './HAS';
export default class Accessory {
    private ID;
    private services;
    private primaryService;
    private IIDMap;
    private server?;
    constructor(ID: number);
    getID(): number;
    getServices(): {
        [index: number]: Service;
    };
    setServer(server: HAS): void;
    addService(service: Service): void;
    addServices(...services: Service[]): void;
    toJSON(): {};
}
