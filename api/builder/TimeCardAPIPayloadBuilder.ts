import { Payload, PayCodeEdit, PayCodeEditHours } from '../../api/model/time-card-api';
class TimeCardAPIPayloadBuilder {
  private payload: Payload;

  constructor() {
    this.payload = {
      startDate: '',
      endDate: '',
      includeExceptions: false,
      employeeRef: { qualifier: '' },
      payCodeEdits: { added: [] }
    };
  }

  setStartDate(startDate: string): TimeCardAPIPayloadBuilder {
    this.payload.startDate = startDate;
    return this;
  }

  setEndDate(endDate: string): TimeCardAPIPayloadBuilder {
    this.payload.endDate = endDate;
    return this;
  }

  setIncludeExceptions(includeExceptions: boolean): TimeCardAPIPayloadBuilder {
    this.payload.includeExceptions = includeExceptions;
    return this;
  }

  setEmployeeRef(qualifier: string): TimeCardAPIPayloadBuilder {
    this.payload.employeeRef.qualifier = qualifier;
    return this;
  }

  // addPayCodeEdit(paycodeEdit: PayCodeEdit): TimeCardAPIPayloadBuilder {
  //   this.payload.payCodeEdits.added.push(paycodeEdit);
  //   return this;
  // }

  addPayCodeEdit(paycodeEdit: PayCodeEdit | PayCodeEditHours): TimeCardAPIPayloadBuilder {
    if (!this.payload.payCodeEdits) {
      this.payload.payCodeEdits = { added: [] };
    }
    this.payload.payCodeEdits.added.push(paycodeEdit);
    return this;
  }

  addHoursWorked(hoursWorked: PayCodeEditHours): TimeCardAPIPayloadBuilder {
    if (!this.payload.hoursWorked) {
      this.payload.hoursWorked = { added: [] };
    }
    this.payload.hoursWorked.added.push(hoursWorked);
    return this;
  }

  build(): Payload {
    return this.payload;
  }
}

export { TimeCardAPIPayloadBuilder };
