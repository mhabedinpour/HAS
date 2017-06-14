import Config from './config';
import TCP from './TCP';
import Accessory from './accessory';
import { statusCodes } from './TLV/values';
export default class HAS {
    config: Config;
    bonjour: any;
    private bonjourService;
    private expressApp;
    TCPServer: TCP;
    private HTTPServer;
    private accessories;
    private isRunning;
    onIdentify: (value: any, callback: (status: statusCodes) => void) => void;
    constructor(config: Config);
    startServer(): void;
    stopServer(): void;
    addAccessory(accessory: Accessory): void;
    getAccessories(): {
        [index: number]: Accessory;
    };
}
