/**
 * @file A simple Homekit bridge sample
 * @author MohammadHossein Abedinpour <abedinpourmh@gmail.com>
 * @licence Apache2
 */

import * as HAS from '../';

let config = new HAS.Config('NodeJS Bridge', '79:E6:B6:63:BC:2C', HAS.categories.bridge, __dirname + '/lights.json', 8090, '200-20-200');

let server = new HAS.Server(config);

let identity = new HAS.Characteristic(1, '14', 'bool', false, false, false, false);
let manufacturer = new HAS.Characteristic(2, '20', 'string', false, false, true, true);
manufacturer.setValue('Hamyar');
let model = new HAS.Characteristic(3, '21', 'string', false, false, true, true);
model.setValue('Model2017');
let name = new HAS.Characteristic(4, '23', 'string', false, false, true, true);
name.setValue('Bridge');
let serialNumber = new HAS.Characteristic(5, '30', 'string', false, false, true, true);
serialNumber.setValue('112-HA-BN');
let firmwareVersion = new HAS.Characteristic(6, '52', 'string', false, false, true, true);
firmwareVersion.setValue('1.0.0');
let service = new HAS.Service(1, '3E', false, false, []);
service.addCharacteristics(identity, manufacturer, model, name, serialNumber);




let accessory = new HAS.Accessory(1);
accessory.addServices(service);
server.addAccessory(accessory);

let identity2 = new HAS.Characteristic(1, '14', 'bool', false, false, false, false);
let manufacturer2 = new HAS.Characteristic(2, '20', 'string', false, false, true, true);
manufacturer2.setValue('Hamyar');
let model2 = new HAS.Characteristic(3, '21', 'string', false, false, true, true);
model2.setValue('Model2017');
let name2 = new HAS.Characteristic(4, '23', 'string', false, false, true, true);
name2.setValue('Fan');
let serialNumber2 = new HAS.Characteristic(5, '30', 'string', false, false, true, true);
serialNumber2.setValue('113-HA-BN');
let firmwareVersion2 = new HAS.Characteristic(6, '52', 'string', false, false, true, true);
firmwareVersion2.setValue('1.0.0');
let service2 = new HAS.Service(1, '3E', false, false, []);
service2.addCharacteristics(identity2, manufacturer2, model2, name2, serialNumber2);

let on = new HAS.Characteristic(1, '25', 'bool', false, true, true, false);
on.setValue(false);
let service3 = new HAS.Service(2, '40', false, true, []);
service3.addCharacteristics(on);

let accessory2 = new HAS.Accessory(2);
accessory2.addServices(service2, service3);
server.addAccessory(accessory2);


server.startServer();