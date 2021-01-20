const suncalc = require('suncalc');

class SunpositionAccessory {
  constructor(log, config, platformConfig) {
    this.accessory = null;
    this.registered = null;
    this.config = config;
    this.platformConfig = platformConfig;
    this.log = log;
  }

  getAccessory() {
    return this.accessory;
  }

  setAccessory(accessory) {
    this.accessory = accessory;
    this.setAccessoryEventHandlers();
  }

  hasRegistered() {
    return this.registered;
  }

  initializeAccessory() {
    const { config } = this;
    const uuid = UUIDGen.generate(config.name);
    const accessory = new Accessory(config.name, uuid);

    const SensorService = accessory.addService(Service.OccupancySensor, config.name);

    if (SensorService) {
      SensorService.getCharacteristic(Characteristic.OccupancyDetected);
    }

    this.setAccessory(accessory);

    return accessory;
  }

  setRegistered(status) {
    this.registered = status;
  }

  setAccessoryEventHandlers() {
    const { log } = this;

    this.getAccessory().on('identify', (paired, callback) => {
      log(this.getAccessory().displayName, `Identify sensor, paired: ${paired}`);
      callback();
    });

    const SensorService = this.getAccessory().getService(Service.OccupancySensor);

    if (SensorService) {
      SensorService
        .getCharacteristic(Characteristic.OccupancyDetected)
        .on('get', this.getState.bind(this));
    }
  }

  getState(callback) {
    const { config, platformConfig, log } = this;
    const { lat, long } = platformConfig;
    const { threshold } = config;

    if (!lat || !long || typeof lat !== 'number' || typeof long !== 'number') {
      log('Error: Lat/Long incorrect. Please refer to the README.');
      callback(null, 0);
      return;
    }

    const sunPos = suncalc.getPosition(Date.now(), lat, long);
    const sunPosDegrees = Math.abs((sunPos.azimuth * 180) / Math.PI);

    if (threshold[0] < 0) threshold[0] = 360 + threshold[0];
    if (threshold[1] < 0) threshold[1] = 360 + threshold[1];

    if (
      (sunPosDegrees >= threshold[0] && sunPosDegrees <= threshold[1])
      || (sunPosDegrees >= threshold[1] && sunPosDegrees <= threshold[0])
    ) {
      callback(null, 1);
      log(this.getAccessory().displayName, 'getState: 1');
    } else {
      callback(null, 0);
      log(this.getAccessory().displayName, 'getState: 0');
    }
  }
}

module.exports = SunpositionAccessory;