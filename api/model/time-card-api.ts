// Employee interface
export interface Employee {
  qualifier: string;
}

// Paycode interface
export interface Paycode {
  name: string;
}

// Base PayCodeEdit interface
export interface BasePayCodeEdit {
  amountType: string;
  paycode: Paycode;
  startDateTime: string;
  employee: Employee;
  scheduleAmountType: string;
}

// PayCodeEdit with days
export interface PayCodeEdit extends BasePayCodeEdit {
  durationInDays: number;
}

// PayCodeEdit with hours
export interface PayCodeEditHours extends BasePayCodeEdit {
  durationInHours: number;
}

// Base interface for hours worked
export interface HoursWorkedEntry {
  startDateTime: string;
  durationInHours: number;
  employee: Employee;
}

// Hours worked collection
export interface HoursWorked {
  added: HoursWorkedEntry[];
}

// PayCodeEdits interface (supports both types) - SINGLE DECLARATION
export interface PayCodeEdits {
  added: (PayCodeEdit | PayCodeEditHours)[];
}

// Base Payload interface
export interface BasePayload {
  startDate: string;
  endDate: string;
  includeExceptions: boolean;
  employeeRef: Employee;
}

// Payload with only payCodeEdits
export interface PayloadWithPayCodeEdits extends BasePayload {
  payCodeEdits: PayCodeEdits;
}

// Payload with only hoursWorked
export interface PayloadWithHoursWorked extends BasePayload {
  hoursWorked: HoursWorked;
}

// Payload with both hoursWorked and payCodeEdits
export interface PayloadWithBoth extends BasePayload {
  hoursWorked: HoursWorked;
  payCodeEdits: PayCodeEdits;
}

// Main Payload interface with optional properties - SINGLE DECLARATION
export interface Payload extends BasePayload {
  hoursWorked?: HoursWorked;
  payCodeEdits?: PayCodeEdits;
}

// Specific interface for your exact JSON structure
export interface CompletePayload extends BasePayload {
  hoursWorked: HoursWorked;
  payCodeEdits: {
    added: PayCodeEditHours[]; // Specifically hours since your JSON uses durationInHours
  };
}
