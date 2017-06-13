"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var HAS_1 = require("../src/HAS");
var config = new HAS_1.HASConfigHelper('salam20', '77:E6:B6:63:FC:2C', 2, __dirname + '/lights.json', 8090, '130-13-333');
var iHAS = new HAS_1.HAS(config);
iHAS.startServer();
