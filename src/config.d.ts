/// <reference types="node" />
import SRP from './encryption/SRP';
export interface Pairing {
    publicKey: string;
    isAdmin: boolean;
}
export interface Pairings {
    [ID: string]: Pairing;
}
export default class Config {
    deviceName: string;
    deviceID: string;
    private CCN;
    private readonly featureFlag;
    private readonly protocolVersion;
    private readonly CSN;
    statusFlag: number;
    category: number;
    configDir: string;
    failedAuthCounter: number;
    lastPairStepTime?: Date;
    TCPPort: number;
    SRP?: SRP;
    setupCode: string;
    private pairings;
    publicKey: Buffer;
    privateKey: Buffer;
    constructor(deviceName: string, deviceID: string, category: number, configDir: string, TCPPort: number, setupCode: string);
    private readConfig();
    private writeConfig();
    increaseCCN(): void;
    getTXTRecords(): object;
    addPairing(ID: Buffer, publicKey: Buffer, isAdmin: boolean): void;
    removePairing(ID: Buffer): void;
    updatePairing(ID: Buffer, isAdmin: boolean): void;
    getPairings(ID?: Buffer): Pairing | Pairings | boolean;
}
