import Config from './config';
import TCP from './TCP';
import Accessory from './accessory';
export default class HAS {
    config: Config;
    bonjour: any;
    private bonjourService;
    private expressApp;
    TCPServer: TCP;
    private HTTPServer;
    private accessories;
    private isRunning;
    constructor(config: Config);
    startServer(): void;
    stopServer(): void;
    addAccessory(accessory: Accessory): void;
    getAccessories(): {
        [index: number]: Accessory;
    };
}
