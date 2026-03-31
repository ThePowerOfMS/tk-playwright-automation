import { BasePayCodeEdit, PayCodeEdit } from '../../api/model/time-card-api';

class PayCodeEditBuilder {
  private payCodeEdit: BasePayCodeEdit & { durationInDays?: number; durationInHours?: string };

  constructor() {
    this.payCodeEdit = {
      amountType: '',
      paycode: { name: '' },
      startDateTime: '',
      employee: { qualifier: '' },
      scheduleAmountType: ''
    };
  }

  static forDays(): PayCodeEditBuilder {
    const builder = new PayCodeEditBuilder();
    builder.payCodeEdit.durationInDays = 0;
    return builder;
  }

  static forHours(): PayCodeEditBuilder {
    const builder = new PayCodeEditBuilder();
    builder.payCodeEdit.durationInHours = '2';
    return builder;
  }

  setAmountType(amountType: string): PayCodeEditBuilder {
    this.payCodeEdit.amountType = amountType;
    return this;
  }

  setPayCodeName(name: string): PayCodeEditBuilder {
    this.payCodeEdit.paycode.name = name;
    return this;
  }

  setStartDateTime(startDateTime: string): PayCodeEditBuilder {
    this.payCodeEdit.startDateTime = startDateTime;
    return this;
  }

  setEmployeeQualifier(qualifier: string): PayCodeEditBuilder {
    this.payCodeEdit.employee.qualifier = qualifier;
    return this;
  }

  setDurationInDays(durationInDays: number): PayCodeEditBuilder {
    this.payCodeEdit.durationInDays = durationInDays;
    return this;
  }

  setDurationInHours(durationInHours: string): PayCodeEditBuilder {
    this.payCodeEdit.durationInHours = durationInHours;
    return this;
  }

  setScheduleAmountType(scheduleAmountType: string): PayCodeEditBuilder {
    this.payCodeEdit.scheduleAmountType = scheduleAmountType;
    return this;
  }

  build(): PayCodeEdit {
    return this.payCodeEdit as PayCodeEdit;
  }
}
export { PayCodeEditBuilder };
