import {HASConfig} from './configurationHelper';
import TCP from './TCP';
export declare class HAS {
    config: HASConfig;
    bonjour: any;
    private bonjourService;
    private expressApp;
    TCPServer: TCP;
    private HTTPServer;

    constructor(config: HASConfig);

    startServer(): void;

    stopServer(): void;
}
export declare const HASConfigHelper: typeof HASConfig;
