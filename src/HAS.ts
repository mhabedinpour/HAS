/**
 * @file Homekit Accessory Server Core Class
 * @author MohammadHossein Abedinpour <abedinpourmh@gmail.com>
 * @licence Apache2
 */

import {HASConfig} from './configurationHelper';
import * as HTTP from 'http';
import expressApp from './express';
import * as express from 'express';
import TCP from './TCP';

//HAP is using HTTP in it's own way. To meet its requirements and also not rewriting the whole HTTP module, We will create a TCP server which iOS will connect to it and we will do HAP stuffs in this layer.
//We also will create an HTTP server which will process the iOS requests and generate response for them.
//We also will use an internal TCP socket pool to proxy iOS requests to HTTP and also HTTP responses to iOS.

export class HAS {

    /**
     * @property HAS Config Helper
     * @public
     * @requires
     */
    public config: HASConfig;

    /**
     * @property Bonjour Helper
     * @public
     * @requires
     */
    public bonjour: any;

    /**
     * @property Bonjour Service
     * @private
     */
    private bonjourService: any;

    /**
     * @property Express App
     * @private
     */
    private expressApp: express.Express;

    /**
     * @property TCP Server
     * @public
     */
    public TCPServer: TCP;

    /**
     * @property HTTP Server
     * @private
     */
    private HTTPServer: HTTP.Server;


    /**
     * @method Creates new instance of class
     * @param config - Instance of configuration helper
     */
    constructor(config: HASConfig) {
        this.bonjour = require('bonjour')();

        if (config)
            this.config = config;
        else
            throw  new Error('Invalid HAS Config');

        this.expressApp = expressApp(this);
        this.HTTPServer = HTTP.createServer(this.expressApp);

        this.TCPServer = new TCP(this);
    }

    /**
     * @method Starts HTTP and Bonjour
     */
    public startServer() {
        this.bonjourService = this.bonjour.publish({
            name: this.config.deviceName,
            type: 'hap',
            port: this.config.TCPPort,
            txt: this.config.getTXTRecords(),
        });
        this.bonjourService.on('up', () => {
            console.log('Bonjour is up');
        });

        this.HTTPServer.timeout = 0; //TCP connection should stay open as lang as it wants to
        this.HTTPServer.listen(0);
        this.HTTPServer.on('listening', () => {
            console.log(`HTTP Server Listening on ${this.HTTPServer.address().port}`);
        });

        this.TCPServer.listen(this.config.TCPPort, this.HTTPServer.address().port);
        this.TCPServer.on('listening', () => {
            console.log(`TCP Server Listening on ${this.config.TCPPort}`);
        });

    }

    /**
     * @method Stops HTTP, TCP and Bonjour
     */
    public stopServer() {
        if (this.bonjourService)
            this.bonjourService.stop();
        if (this.HTTPServer)
            this.HTTPServer.close();
        if (this.TCPServer)
            this.TCPServer.close();
    }
}

export const HASConfigHelper = HASConfig;