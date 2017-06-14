"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var express = require("express");
var bodyParser = require("body-parser");
var TLVEnums = require("./TLV/values");
var parse_1 = require("./TLV/parse");
var encode_1 = require("./TLV/encode");
var SRP_1 = require("./encryption/SRP");
var HKDF_1 = require("./encryption/HKDF");
var ChaCha = require("./encryption/ChaCha20Poly1305AEAD");
var Ed25519 = require('ed25519');
var Curve25519 = require('curve25519-n2');
function default_1(server) {
    var app = express();
    app.use(function (req, res, next) {
        if (!req.headers['x-real-socket-id']) {
            res.end();
            return;
        }
        req.realSocket = server.TCPServer.connections[req.headers['x-real-socket-id']];
        if (!req.realSocket) {
            res.end();
            return;
        }
        res.removeHeader('x-powered-by');
        res.header('X-Real-Socket-ID', req.realSocket.ID);
        if (req.headers['content-type'] && req.headers['content-type'].indexOf('tlv') > -1) {
            var data_1 = Buffer.alloc(0);
            req.on('data', function (chunk) {
                data_1 = Buffer.concat([data_1, chunk]);
            });
            req.on('end', function () {
                req.body = req.body || {};
                req.body.TLV = parse_1.default(data_1);
                next();
            });
        }
        else
            next();
    });
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: false }));
    app.post('/pair-setup', function (req, res) {
        res.header('Content-Type', 'application/pairing+tlv8');
        var currentState = (req.body.TLV[TLVEnums.TLVValues.state]) ? parseInt(req.body.TLV[TLVEnums.TLVValues.state].toString('hex')) : 0x00;
        try {
            if (server.config.statusFlag != 0x01) {
                res.end(encode_1.encodeTLVError(TLVEnums.TLVErrors.unavailable, currentState));
                return;
            }
            if (server.config.failedAuthCounter > 100) {
                res.end(encode_1.encodeTLVError(TLVEnums.TLVErrors.maxTries, currentState));
                return;
            }
            if (currentState === 0x01) {
                if (server.config.lastPairStepTime && new Date().getTime() - server.config.lastPairStepTime.getTime() < 30000 && server.config.SRP && server.config.SRP.socketID !== req.realSocket.ID) {
                    res.end(encode_1.encodeTLVError(TLVEnums.TLVErrors.busy, currentState));
                    return;
                }
                server.config.lastPairStepTime = new Date();
                server.config.SRP = new SRP_1.default(server.config.setupCode);
                server.config.SRP.socketID = req.realSocket.ID;
                res.end(encode_1.encodeTLV([
                    {
                        key: TLVEnums.TLVValues.state,
                        value: currentState + 1
                    }, {
                        key: TLVEnums.TLVValues.publicKey,
                        value: server.config.SRP.getPublicKey()
                    }, {
                        key: TLVEnums.TLVValues.salt,
                        value: server.config.SRP.salt
                    }
                ]));
                return;
            }
            server.config.lastPairStepTime = new Date();
            if (!server.config.SRP) {
                res.end(encode_1.encodeTLVError(TLVEnums.TLVErrors.unknown, currentState));
                return;
            }
            if (currentState === 0x03) {
                server.config.SRP.setClientPublicKey(req.body.TLV[TLVEnums.TLVValues.publicKey]);
                if (server.config.SRP.checkClientProof(req.body.TLV[TLVEnums.TLVValues.proof])) {
                    res.end(encode_1.encodeTLV([
                        {
                            key: TLVEnums.TLVValues.state,
                            value: currentState + 1
                        }, {
                            key: TLVEnums.TLVValues.proof,
                            value: server.config.SRP.getM2Proof()
                        }
                    ]));
                    return;
                }
                else {
                    server.config.lastPairStepTime = undefined;
                    res.end(encode_1.encodeTLVError(TLVEnums.TLVErrors.authentication, currentState));
                }
                return;
            }
            if (currentState === 0x05) {
                var body = req.body.TLV[TLVEnums.TLVValues.encryptedData], encryptedData = body.slice(0, body.length - 16), tag = body.slice(body.length - 16), key = HKDF_1.default(server.config.SRP.getSessionKey());
                var data = ChaCha.decrypt(key, 'PS-Msg05', tag, encryptedData);
                if (data === false)
                    res.end(encode_1.encodeTLVError(TLVEnums.TLVErrors.authentication, currentState));
                else {
                    var info = parse_1.default(data);
                    var iOSDeviceInfo = Buffer.concat([HKDF_1.default(server.config.SRP.getSessionKey(), 'Pair-Setup-Controller-Sign-Salt', 'Pair-Setup-Controller-Sign-Info'), info[TLVEnums.TLVValues.identifier], info[TLVEnums.TLVValues.publicKey]]);
                    if (Ed25519.Verify(iOSDeviceInfo, info[TLVEnums.TLVValues.signature], info[TLVEnums.TLVValues.publicKey])) {
                        server.config.addPairing(info[TLVEnums.TLVValues.identifier], info[TLVEnums.TLVValues.publicKey], true);
                        var accessoryInfo = Buffer.concat([HKDF_1.default(server.config.SRP.getSessionKey(), 'Pair-Setup-Accessory-Sign-Salt', 'Pair-Setup-Accessory-Sign-Info'), Buffer.from(server.config.deviceID), server.config.publicKey]);
                        var accessorySignature = Ed25519.Sign(accessoryInfo, server.config.privateKey);
                        var plainTLV = encode_1.encodeTLV([
                            {
                                key: TLVEnums.TLVValues.identifier,
                                value: server.config.deviceID
                            },
                            {
                                key: TLVEnums.TLVValues.publicKey,
                                value: server.config.publicKey
                            },
                            {
                                key: TLVEnums.TLVValues.signature,
                                value: accessorySignature
                            }
                        ]);
                        res.end(encode_1.encodeTLV([
                            {
                                key: TLVEnums.TLVValues.state,
                                value: currentState + 1
                            }, {
                                key: TLVEnums.TLVValues.encryptedData,
                                value: ChaCha.encrypt(key, 'PS-Msg06', plainTLV)
                            }
                        ]));
                    }
                    else
                        res.end(encode_1.encodeTLVError(TLVEnums.TLVErrors.authentication, currentState));
                }
                return;
            }
        }
        catch (e) {
            console.error(e);
            server.config.lastPairStepTime = undefined;
            res.end(encode_1.encodeTLVError(TLVEnums.TLVErrors.unknown, currentState));
        }
    });
    app.post('/pair-verify', function (req, res) {
        res.header('Content-Type', 'application/pairing+tlv8');
        var currentState = (req.body.TLV[TLVEnums.TLVValues.state]) ? parseInt(req.body.TLV[TLVEnums.TLVValues.state].toString('hex')) : 0x00;
        try {
            if (currentState === 0x01) {
                var secretKey = Buffer.alloc(32);
                secretKey = Curve25519.makeSecretKey(secretKey);
                var publicKey = Curve25519.derivePublicKey(secretKey), sharedKey = Curve25519.deriveSharedSecret(secretKey, req.body.TLV[TLVEnums.TLVValues.publicKey]);
                var accessoryInfo = Buffer.concat([publicKey, Buffer.from(server.config.deviceID), req.body.TLV[TLVEnums.TLVValues.publicKey]]);
                var accessorySignature = Ed25519.Sign(accessoryInfo, server.config.privateKey);
                var plainTLV = encode_1.encodeTLV([
                    {
                        key: TLVEnums.TLVValues.identifier,
                        value: server.config.deviceID
                    },
                    {
                        key: TLVEnums.TLVValues.signature,
                        value: accessorySignature
                    }
                ]);
                var sessionKey = HKDF_1.default(sharedKey, 'Pair-Verify-Encrypt-Salt', 'Pair-Verify-Encrypt-Info');
                req.realSocket.HAPEncryption = {
                    serverSecretKey: secretKey,
                    serverPublicKey: publicKey,
                    sharedKey: sharedKey,
                    clientPublicKey: req.body.TLV[TLVEnums.TLVValues.publicKey],
                    sessionKey: sessionKey,
                    incomingFramesCounter: 0,
                    outgoingFramesCounter: 0,
                    isAdmin: false,
                };
                res.end(encode_1.encodeTLV([
                    {
                        key: TLVEnums.TLVValues.state,
                        value: currentState + 1
                    }, {
                        key: TLVEnums.TLVValues.encryptedData,
                        value: ChaCha.encrypt(sessionKey, 'PV-Msg02', plainTLV)
                    }, {
                        key: TLVEnums.TLVValues.publicKey,
                        value: publicKey
                    }
                ]));
                return;
            }
            if (!req.realSocket.HAPEncryption) {
                res.end(encode_1.encodeTLVError(TLVEnums.TLVErrors.unknown, currentState));
                return;
            }
            if (currentState === 0x03) {
                var body = req.body.TLV[TLVEnums.TLVValues.encryptedData], encryptedData = body.slice(0, body.length - 16), tag = body.slice(body.length - 16);
                var data = ChaCha.decrypt(req.realSocket.HAPEncryption.sessionKey, 'PV-Msg03', tag, encryptedData);
                if (data === false)
                    res.end(encode_1.encodeTLVError(TLVEnums.TLVErrors.authentication, currentState));
                else {
                    var info = parse_1.default(data);
                    var pairing = server.config.getPairings(info[TLVEnums.TLVValues.identifier]);
                    if (pairing === false)
                        res.end(encode_1.encodeTLVError(TLVEnums.TLVErrors.authentication, currentState));
                    else {
                        pairing = pairing;
                        var iOSDeviceInfo = Buffer.concat([req.realSocket.HAPEncryption.clientPublicKey, info[TLVEnums.TLVValues.identifier], req.realSocket.HAPEncryption.serverPublicKey]);
                        if (Ed25519.Verify(iOSDeviceInfo, info[TLVEnums.TLVValues.signature], Buffer.from(pairing.publicKey, 'hex'))) {
                            req.realSocket.HAPEncryption.accessoryToControllerKey = HKDF_1.default(req.realSocket.HAPEncryption.sharedKey, 'Control-Salt', 'Control-Read-Encryption-Key');
                            req.realSocket.HAPEncryption.controllerToAccessoryKey = HKDF_1.default(req.realSocket.HAPEncryption.sharedKey, 'Control-Salt', 'Control-Write-Encryption-Key');
                            req.realSocket.HAPEncryption.isAdmin = pairing.isAdmin;
                            req.realSocket.isEncrypted = true;
                            req.realSocket.isAuthenticated = true;
                            req.realSocket.clientID = info[TLVEnums.TLVValues.identifier].toString('utf8');
                            req.realSocket.keepAliveForEver();
                            res.end(encode_1.encodeTLV([
                                {
                                    key: TLVEnums.TLVValues.state,
                                    value: currentState + 1
                                }
                            ]));
                        }
                        else
                            res.end(encode_1.encodeTLVError(TLVEnums.TLVErrors.authentication, currentState));
                    }
                }
                return;
            }
        }
        catch (e) {
            console.error(e);
            res.end(encode_1.encodeTLVError(TLVEnums.TLVErrors.unknown, currentState));
        }
    });
    app.get('/accessories', function (req, res) {
        res.header('Content-Type', 'application/hap+json');
        if (!req.realSocket.isAuthenticated) {
            res.status(400).end();
            return;
        }
        var accessoriesObject = server.getAccessories(), accessories = [];
        for (var index in accessoriesObject)
            accessories.push(accessoriesObject[index].toJSON());
        res.end(JSON.stringify({
            accessories: accessories
        }));
    });
    app.post('/pairings', function (req, res) {
        res.header('Content-Type', 'application/pairing+tlv8');
        var currentState = (req.body.TLV[TLVEnums.TLVValues.state]) ? parseInt(req.body.TLV[TLVEnums.TLVValues.state].toString('hex')) : 0x00;
        if (!req.realSocket.isAuthenticated || !req.realSocket.HAPEncryption.isAdmin) {
            res.end(encode_1.encodeTLVError(TLVEnums.TLVErrors.authentication, currentState));
            return;
        }
        if (req.body.TLV[TLVEnums.TLVValues.method].toString('hex') == TLVEnums.TLVMethods.addPairing) {
            var pairing = server.config.getPairings(req.body.TLV[TLVEnums.TLVValues.identifier]);
            if (pairing === false) {
                server.config.addPairing(req.body.TLV[TLVEnums.TLVValues.identifier], req.body.TLV[TLVEnums.TLVValues.publicKey], req.body.TLV[TLVEnums.TLVValues.permissions].toString('hex') == '01');
                res.end(encode_1.encodeTLV([
                    {
                        key: TLVEnums.TLVValues.state,
                        value: currentState + 1
                    }
                ]));
            }
            else {
                pairing = pairing;
                if (pairing.publicKey == req.body.TLV[TLVEnums.TLVValues.publicKey].toString('hex')) {
                    server.config.updatePairing(req.body.TLV[TLVEnums.TLVValues.identifier], req.body.TLV[TLVEnums.TLVValues.permissions].toString('hex') == '01');
                    res.end(encode_1.encodeTLV([
                        {
                            key: TLVEnums.TLVValues.state,
                            value: currentState + 1
                        }
                    ]));
                }
                else
                    res.end(encode_1.encodeTLVError(TLVEnums.TLVErrors.unknown, currentState));
            }
        }
        else if (req.body.TLV[TLVEnums.TLVValues.method].toString('hex') == TLVEnums.TLVMethods.removePairing) {
            var pairing = server.config.getPairings(req.body.TLV[TLVEnums.TLVValues.identifier]);
            if (pairing === false)
                res.end(encode_1.encodeTLVError(TLVEnums.TLVErrors.unknown, currentState));
            else {
                server.config.removePairing(req.body.TLV[TLVEnums.TLVValues.identifier]);
                res.end(encode_1.encodeTLV([
                    {
                        key: TLVEnums.TLVValues.state,
                        value: currentState + 1
                    }
                ]));
                server.TCPServer.revokeConnections(req.body.TLV[TLVEnums.TLVValues.identifier].toString('utf8'));
            }
        }
        else
            res.end();
    });
    app.get('/pairings', function (req, res) {
        res.header('Content-Type', 'application/pairing+tlv8');
        var currentState = 1;
        if (!req.realSocket.isAuthenticated || !req.realSocket.HAPEncryption.isAdmin) {
            res.end(encode_1.encodeTLVError(TLVEnums.TLVErrors.authentication, currentState));
            return;
        }
        var pairings = server.config.getPairings(), response = [{
                key: TLVEnums.TLVValues.state,
                value: currentState + 1
            }], offset = 0, total = Object.keys(pairings).length;
        for (var index in pairings) {
            var pairing = pairings[index];
            response.push({
                key: TLVEnums.TLVValues.identifier,
                value: Buffer.from(index, 'utf8')
            });
            response.push({
                key: TLVEnums.TLVValues.publicKey,
                value: Buffer.from(pairing.publicKey, 'hex')
            });
            response.push({
                key: TLVEnums.TLVValues.permissions,
                value: Buffer.from([pairing.isAdmin])
            });
            offset++;
            if (offset < total)
                response.push({
                    key: TLVEnums.TLVValues.separator,
                    value: Buffer.alloc(0)
                });
        }
        res.end(response);
    });
    return app;
}
exports.default = default_1;
;
