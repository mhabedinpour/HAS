/**
 * @file A simple light bulb sample
 * @author MohammadHossein Abedinpour <abedinpourmh@gmail.com>
 * @licence Apache2
 */

import {HAS, HASConfigHelper} from '../src/HAS';

let config = new HASConfigHelper('salam20', '77:E6:B6:63:FC:2C', 2, __dirname + '/lights.json', 8090, '130-13-333');

let iHAS = new HAS(config);

iHAS.startServer();