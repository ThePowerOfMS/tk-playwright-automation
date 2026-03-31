import { PlatformProperty } from '../model/platform-properties';

class PlatformPropertyBuilder {
  private platformProperty: PlatformProperty;

  constructor() {
    this.platformProperty = {
      accessType: '',
      viewable: false,
      propertyName: '',
      context: '',
      swimLane: '',
      propertyValue: '',
      locale: '',
      category: '',
      version: '',
      configurable: false
    };
  }

  setAccessType(accessType: string): PlatformPropertyBuilder {
    this.platformProperty.accessType = accessType;
    return this;
  }

  setViewable(viewable: boolean): PlatformPropertyBuilder {
    this.platformProperty.viewable = viewable;
    return this;
  }

  setPropertyName(propertyName: string): PlatformPropertyBuilder {
    this.platformProperty.propertyName = propertyName;
    return this;
  }

  setContext(context: string): PlatformPropertyBuilder {
    this.platformProperty.context = context;
    return this;
  }

  setSwimLane(swimLane: string): PlatformPropertyBuilder {
    this.platformProperty.swimLane = swimLane;
    return this;
  }

  setPropertyValue(propertyValue: string): PlatformPropertyBuilder {
    this.platformProperty.propertyValue = propertyValue;
    return this;
  }

  setLocale(locale: string): PlatformPropertyBuilder {
    this.platformProperty.locale = locale;
    return this;
  }

  setCategory(category: string): PlatformPropertyBuilder {
    this.platformProperty.category = category;
    return this;
  }

  setVersion(version: string): PlatformPropertyBuilder {
    this.platformProperty.version = version;
    return this;
  }

  setConfigurable(configurable: boolean): PlatformPropertyBuilder {
    this.platformProperty.configurable = configurable;
    return this;
  }

  build(): PlatformProperty {
    return this.platformProperty;
  }
}

export { PlatformPropertyBuilder };
