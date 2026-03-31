import { BasePayCodeEdit, HoursWorked, HoursWorkedEntry, PayCodeEditHours } from '../../api/model/time-card-api';

class HoursWorkedBuilder {
  private hoursWorked: HoursWorkedEntry & { durationInDays?: number; durationInHours?: number };

  constructor() {
    this.hoursWorked = {
      startDateTime: '',
      durationInHours: 2,
      employee: { qualifier: '' }
    };
  }

  static forHours(): HoursWorkedBuilder {
    const builder = new HoursWorkedBuilder();
    builder.hoursWorked.durationInHours = 2;
    return builder;
  }

  setStartDateTime(startDateTime: string): HoursWorkedBuilder {
    this.hoursWorked.startDateTime = startDateTime;
    return this;
  }

  setEmployeeQualifier(qualifier: string): HoursWorkedBuilder {
    this.hoursWorked.employee.qualifier = qualifier;
    return this;
  }

  setDurationInHours(durationInHours: number): HoursWorkedBuilder {
    this.hoursWorked.durationInHours = durationInHours;
    return this;
  }

  build(): PayCodeEditHours {
    return this.hoursWorked as PayCodeEditHours;
  }
}
export { HoursWorkedBuilder };
