import { APIBaseClass } from './api-base-class';
import { GetCalls } from './get-calls';
import { get } from '@data-manager';
import { expect, APIRequestContext } from '@playwright/test';
import { SmartDateUtil } from '@utils';

interface DateRange {
  startDate: string;
  endDate: string;
}

class PostCalls extends APIBaseClass {
  constructor(request: APIRequestContext) {
    super(request);
  }

  getNextWeekWednesday = (): string => {
    const today = new Date();
    const day = today.getDay();
    const daysUntilWednesday = (3 - day + 7) % 7;
    const nextWeekWednesday = new Date(today);
    nextWeekWednesday.setDate(today.getDate() + daysUntilWednesday + 7);
    return nextWeekWednesday.toISOString().split('T')[0];
  };

  static async calculatePayPeriodDates(
    getCalls: GetCalls,
    postCalls: PostCalls,
    tenantId: string,
    personNumber: string,
    positionName: string
  ): Promise<DateRange> {
    const maxRetries = 2;
    let lastError: any = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Login as system admin to access person data with timeout
        await Promise.race([
          postCalls.loginWithSpecificUser(await get('SYSADMIN') ?? ''),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Login timeout')), 20000))
        ]);

        // Get person data with timeout
        const personResponse = await Promise.race([
          getCalls.getByPersonNumber(personNumber),
          new Promise((_, reject) => setTimeout(() => reject(new Error('GetPersonData timeout')), 15000))
        ]);

        if (!personResponse) {
          throw new Error(`No person data returned for ${personNumber}`);
        }

        // Extract position data and calculate dynamic pay period like Selenium did
        const apiResponse = personResponse as any;
        const positions = apiResponse.positions || [];
        const targetPosition = positions.find((pos: any) => pos.name === positionName);

        if (targetPosition && targetPosition.positionStatuses && targetPosition.positionStatuses.length > 0) {
          // Extract effective date from first position status
          const effectiveDate = targetPosition.positionStatuses[0].effectiveDate;

          // Create date range (effectiveDate + 6 days) matching Selenium approach
          const startDateObj = new Date(effectiveDate);
          const endDateObj = new Date(startDateObj);
          endDateObj.setDate(startDateObj.getDate() + 6);

          // Format dates to YYYY-MM-DD
          const startDate = startDateObj.toISOString().split('T')[0];
          const endDate = endDateObj.toISOString().split('T')[0];

          return { startDate, endDate };
        } else {
          throw new Error(`${positionName} position not found for ${personNumber}. Available positions: ${positions.map((p: any) => p.name).join(', ')}`);
        }
      } catch (error) {
        lastError = error;

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
      } finally {
        // Always logout from system admin session
        try {
          await postCalls.logOutWithSpecificTenantId(tenantId);
        } catch (logoutError) {
          // Silent logout error handling
        }
      }
    }

    // If all attempts failed, throw error instead of returning empty dates
    const errorMsg = `❌ Failed to calculate pay period dates after ${maxRetries} attempts. Last error: ${lastError instanceof Error ? lastError.message : lastError}`;
    throw new Error(errorMsg);
  }

  static async calculateMPTSEP1PayPeriod(getCalls: GetCalls, postCalls: PostCalls, tenantId: string): Promise<DateRange> {
    return this.calculatePayPeriodDates(getCalls, postCalls, tenantId, 'MPTSEP1', 'MPMPPos1');
  }

  async loginWithSpecificUser(username: string): Promise<void> {
    await this.login(username);
  }

  async loginWithSpecificUserAndTenantId(username: string, tenantId: string): Promise<void> {
    await this.loginWithSpecificTenantId(username, tenantId);
  }

  async loginWithSpecificUser_1(username: string): Promise<void> {
    await this.login_1(username);
  }

  async loginWithMockSessionForNewUser(username: string, tenantId: string): Promise<void> {
    // Call the protected loginWithMockSession method from the base class
    // This returns the ApiUtils but we don't need to set it - it's managed by the base class
    await (this as any).loginWithMockSession(username, tenantId);
  }

  async checkMultiReadToggleState(): Promise<boolean> {
    const releaseToggleURI = `${await get('BASE_API_URL')}${await get('RELEASE_TOGGLE_PATH')}${await get('RELEASE_TOGGLE_TYPE')}`;

    const response = await this.apiUtils.post(
      releaseToggleURI,
      ['pe.multiplepositions'],
      { tenantId: 'manufacturing' },
      {},
      {}
    );

    expect(response.status()).toBe(200);
    const responseBody = await response.json();
    return responseBody?.['pe.multiplepositions'];
  }

  async createTimecardApprovalMulti(payload: any): Promise<{ statusCode: number; response: any }> {
    try {
      const endpoint = `${await get('BASE_API_URL')}${await get('TIMECARD_APPROVALS_MULTI_CREATE')}`;

      const response = await this.apiUtils.post(
        endpoint,
        payload,
        { tenantId: await get('TENANT_ID') || '' },
        {},
        {}
      );

      const statusCode = response.status();
      const responseBody = await response.text(); // May be empty for 204 responses

      if (statusCode === 204) {
        console.log(`✅ Successfully created timecard approval`);
      } else {
        console.error(`❌ Unexpected status code: ${statusCode} for timecard approval`);
      }

      return { statusCode, response: responseBody };
    } catch (error) {
      console.error(`❌ Error creating timecard approval:`, error);
      throw error;
    }
  }

  async createDataViewProfile(payload: any, tenantId: string): Promise<any> {
    try {
      const endpoint = `${await get('BASE_API_URL')}${await get('DATAVIEW_PROFILE_URL')}`;
      const queryParams = { tenantId };

      console.log(`Creating DataView Profile: ${payload.name}`);

      const response = await this.apiUtils.post(endpoint, payload, queryParams, {}, {});
      expect(response.status()).toBe(200);

      const responseBody = await response.json();
      const dataViewProfileId = responseBody.id;

      console.log(`✅ Successfully created DataView Profile '${payload.name}' with ID: ${dataViewProfileId}`);
      return { statusCode: response.status(), id: dataViewProfileId, response: responseBody };
    } catch (error) {
      console.error(`❌ Error creating DataView Profile '${payload.name}':`, error);
      throw error;
    }
  }

  async createUserWithSpecificTenantId(payload: any, tenantId: string): Promise<string> {
    try {
      const endPoint = `${await get('BASE_API_URL')}${await get('CREATE_USER')}`;
      const response = await this.apiUtils.post(endPoint, payload, { tenantId: tenantId }, {}, {});
      const responseBody = await response.json();

      if (response.status() === 200) {
        const personKey = responseBody.personIdentity?.personKey;
        console.log(`✅ User created with personKey: ${personKey}`);
        if (personKey) {
          return String(personKey);
        } else {
          throw new Error('Person created but personKey not found in response');
        }
      } else if (response.status() === 400) {
        if (responseBody.message?.includes('The user account name already exists within the system')) {
          console.warn(`User already exists: ${payload.user?.userAccount?.userName || 'Unknown'}`);
          return '0'; // Return string "0" to indicate user already exists
        } else {
          throw new Error(`Bad request (400): ${responseBody.message || 'Unknown error'}`);
        }
      } else {
        throw new Error(`Unexpected response status: ${response.status()} - ${responseBody.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating user from template:', error);
      throw error;
    }
  }

  async createDataView(payload: any, tenantId: string): Promise<any> {
    try {
      const endpoint = `${await get('BASE_API_URL')}${await get('DATAVIEW_URL')}`;
      const queryParams = { tenantId };

      console.log(`Creating DataView: ${payload.name}`);

      const response = await this.apiUtils.post(endpoint, payload, queryParams, {}, {});
      expect(response.status()).toBe(200);

      const responseBody = await response.json();
      const dataViewId = responseBody.id;

      console.log(`✅ Successfully created DataView '${payload.name}' with ID: ${dataViewId}`);
      return { statusCode: response.status(), id: dataViewId, response: responseBody };
    } catch (error) {
      console.error(`❌ Error creating DataView '${payload.name}':`, error);
      throw error;
    }
  }

  async addTimecardDetails(payload: any, tenantId: string): Promise<void> {
    const employTimecardURL = `${await get('BASE_API_URL')}${await get('EMPLOYEE_TIMECARDS')}`;
    const response = await this.apiUtils.post(
      employTimecardURL,
      payload,
      { tenantId: tenantId },
      {},
      {}
    );
    expect(response.status()).toBe(200);
  }

  async setReleaseToggleOn(toggleState: boolean, user: string): Promise<void> {
    if (!toggleState) {
      await this.loginWithSpecificUser(user);
      const releaseToggleURI = `${await get('BASE_API_URL')}${await get('RELEASE_TOGGLE_PATH')}`;

      const response = await this.apiUtils.post(
        releaseToggleURI,
        { 'pe.multiplepositions': true },
        { tenantId: `${await get('TENANT_ID')}` },
        {},
        {}
      );

      expect(response.status()).toBe(204);
    }
  }

  async setReleaseToggleToBeOn(toggleState: boolean, user: string): Promise<void> {
    if (!toggleState) {
      await this.loginWithSpecificUser(user);
      const releaseToggleURI = `${await get('BASE_API_URL')}${await get('RELEASE_TOGGLE_PATH')}`;

      const response = await this.apiUtils.post(
        releaseToggleURI,
        { 'pe.multiplepositions': true },
        { tenantId: `${await get('TENANT_ID')}` },
        {},
        {}
      );

      expect(response.status()).toBe(204);
    }
  }

  async setReleaseToggleOff(toggleState: boolean, user: string): Promise<void> {
    if (toggleState) {
      await this.loginWithSpecificUser(user);
      const releaseToggleURI = `${await get('BASE_API_URL')}${await get('RELEASE_TOGGLE_PATH')}`;

      const response = await this.apiUtils.post(
        releaseToggleURI,
        { 'pe.multiplepositions': false },
        { tenantId: `${await get('TENANT_ID')}` },
        {},
        {}
      );

      expect(response.status()).toBe(204);
    }
  }

  async createShift(
    user: string,
    qualifier: string,
    options: {
      path: string;
      day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
      week: 'previous' | 'current' | 'next';
      times: { start: string; end: string };
      tenantId: string;
    }
  ): Promise<{ shiftIds: number[] }> {
    await this.loginWithSpecificUserAndTenantId(user, options.tenantId);
    const shiftDate = this.resolveTargetDate(options.day, options.week);

    const startDateTime = `${shiftDate}T${options.times.start}`;
    const endDateTime = `${shiftDate}T${options.times.end}`;

    const payload = {
      employee: { qualifier },
      startDateTime,
      endDateTime,
      segments: [
        {
          type: 'REGULAR_SEGMENT',
          startDateTime,
          endDateTime
        }
      ]
    };

    const endpoint = `${await get('BASE_API_URL')}${options.path}`;
    const response = await this.apiUtils.post(
      endpoint,
      payload,
      { tenantId: options.tenantId },
      {},
      {}
    );

    expect(response.status()).toBe(200);

    const data = await response.json();
    if (!data?.id) {
      throw new Error(`❌ No shiftId returned in createShift response: ${JSON.stringify(data)}`);
    }

    console.log(`✅ Created shift ${data.id} for ${qualifier} (${startDateTime} → ${endDateTime})`);
    return { shiftIds: [data.id] };
  }

  async createPunches(
    user: string,
    qualifier: string,
    options: {
      path: string;
      day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
      week: 'previous' | 'current' | 'next';
      times: { in: string; out: string };
      tenantId: string;
    }
  ): Promise<void> {
    await this.loginWithSpecificUserAndTenantId(user, options.tenantId);

    const punchDate = this.resolveTargetDate(options.day, options.week);

    const payload = {
      startDate: punchDate,
      endDate: punchDate,
      employeeRef: { qualifier },
      punches: {
        added: [
          {
            punchDtm: `${punchDate}T${options.times.in}`,
            typeOverride: { id: '2', name: 'In Punch' },
            employee: { qualifier }
          },
          {
            punchDtm: `${punchDate}T${options.times.out}`,
            typeOverride: { id: '4', name: 'Out Punch' },
            employee: { qualifier }
          }
        ]
      }
    };

    const endpoint = `${await get('BASE_API_URL')}${options.path}`;
    const response = await this.apiUtils.post(
      endpoint,
      payload,
      { tenantId: options.tenantId },
      {},
      {}
    );

    expect(response.status()).toBe(200);
  }

  async createCombinedPunches(
    user: string,
    employee: string,
    options: {
      path: string; // relative path like '/api/punches/combined'
      punches: {
        punchDtm: string;
        typeOverride: { id: string; name: string };
        employee: { qualifier: string };
      }[];
      tenantId: string;
    }
  ): Promise<{ punchIds: string[]; startDate: string; endDate: string }> {
    await this.loginWithSpecificUserAndTenantId(user, options.tenantId);

    const punchDates = options.punches.map(p => new Date(p.punchDtm));
    const startDate = new Date(Math.min(...punchDates.map(d => d.getTime()))).toISOString().split('T')[0];
    const endDate = new Date(Math.max(...punchDates.map(d => d.getTime()))).toISOString().split('T')[0];

    const payload = {
      startDate,
      endDate,
      employeeRef: { qualifier: employee },
      punches: { added: options.punches }
    };

    // ---------- ✅ Fix Invalid URL ----------
    const baseUrl = await get('BASE_API_URL');
    if (!baseUrl) throw new Error('BASE_API_URL not set');

    const endpoint = new URL(options.path, baseUrl).toString();
    console.log('PunchHelper endpoint:', endpoint);

    const response = await this.apiUtils.post(endpoint, payload, { tenantId: options.tenantId }, {}, {});
    expect(response.status()).toBe(200);

    const responseBody = await response.json();
    const punchIds: string[] = responseBody.punches?.map((p: any) => String(p.id)) ?? [];

    console.log(`✅ Combined punches created: ${punchIds.join(', ')}`);
    return { punchIds, startDate, endDate };
  }

  async createMultiplePunches(
    user: string,
    employees: string[] | string,
    options: {
      path: string;
      week: 'previous' | 'current' | 'next';
      punches: {
        day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
        time: string;
        typeOverrideId: number;
      }[];
      timeframeId: number;
      tenantId: string;
      managerRole?: boolean;
    }
  ): Promise<{ punchIds: string[]; startDate: string; endDate: string }> {
    await this.loginWithSpecificUserAndTenantId(user, options.tenantId);

    // Build punches with resolved dates
    const punchDetails = options.punches.map((p) => {
      const punchDate = this.resolveTargetDate(p.day, options.week);
      return {
        punchDtm: `${punchDate}T${p.time}`,
        typeOverride: { typeOverrideId: p.typeOverrideId },
        punchDate
      };
    });

    // Get min and max punch dates
    const punchDates = punchDetails.map(p => new Date(p.punchDate));
    const startDate = new Date(Math.min(...punchDates.map(d => d.getTime())))
      .toISOString()
      .split('T')[0];
    const endDate = new Date(Math.max(...punchDates.map(d => d.getTime())))
      .toISOString()
      .split('T')[0];

    // Normalize employees list
    const employeesList = Array.isArray(employees)
      ? employees.map(name => ({ name }))
      : [{ name: employees }];

    const payload: any = {
      punches: punchDetails.map(p => ({
        punchDtm: p.punchDtm,
        typeOverride: p.typeOverride
      })),
      endDate,
      employees: employeesList,
      startDate,
      timeframe_id: options.timeframeId,
      managerRole: options.managerRole ?? false
    };

    const endpoint = `${await get('BASE_API_URL')}${options.path}`;
    const response = await this.apiUtils.post(
      endpoint,
      payload,
      { tenantId: options.tenantId },
      {},
      {}
    );

    expect(response.status()).toBe(200);

    // Extract punch IDs from response
    const responseBody = await response.json();
    const punchIds: string[] = responseBody.map((p: any) => String(p.id));

    console.log(`✅ Created punches: ${punchIds.join(', ')}`);

    return { punchIds, startDate, endDate };
  }

  async setReleaseToggle(): Promise<void> {
    const releaseToggleURI = `${await get('BASE_URL')}${await get('RELEASE_TOGGLE_PATH')}`;

    const response = await this.apiUtils.post(
      releaseToggleURI,
      { 'tk.DisplayFlankingDays': true },
      { tenantId: 'manufacturing' },
      {}
    );

    expect(response.status()).toBe(204);
  }

  async createPersons(qualifier: string): Promise<string> {
    const authAPI_URI = `${await get('BASE_API_URL')}${await get('PERSONS_PATH')}`;

    const response = await this.apiUtils.post(
      authAPI_URI,
      {
        where: {
          employees: { key: 'username', values: [qualifier] }
        }
      },
      { tenantId: 'manufacturing' },
      {},
      {}
    );

    expect(response.status()).toBe(200);
    const responseBody = await response.json();
    return responseBody?.refs?.[0]?.qualifier;
  }

  async createSchedule(qualifier: string, startDateTime: string, endDateTime: string): Promise<void> {
    const authAPI_URI = `${await get('BASE_API_URL')}${await get('CREATE_SCHEDULE')}`;

    const response = await this.apiUtils.post(
      authAPI_URI,
      {
        employee: { qualifier },
        segments: [
          { startDateTime, type: 'REGULAR_SEGMENT', endDateTime }
        ],
        posted: true
      },
      { tenantId: 'manufacturing' },
      {},
      {}
    );

    expect(response.status()).toBe(200);
  }

  async logOut(): Promise<void> {
    const xmlPayload = `
      <Kronos_WFC version='1.0'>
        <Request object='System' action='Logoff'/>
      </Kronos_WFC>
    `;

    const authAPI_URI = `${await get('BASE_API_URL')}${await get('LOG_OUT')}`;
    const response = await this.apiUtils.postSOAP(authAPI_URI, xmlPayload, { tenantId: 'manufacturing' }, {});
    expect(response.status()).toBe(200);
  }

  async logOutWithSpecificTenantId(tenantId: string): Promise<void> {
    const xmlPayload = `
    <Kronos_WFC version='1.0'>
      <Request object='System' action='Logoff'/>
    </Kronos_WFC>
  `;

    const authAPI_URI = `${await get('BASE_API_URL')}${await get('LOG_OUT')}`;
    const response = await this.apiUtils.postSOAP(
      authAPI_URI,
      xmlPayload,
      { tenantId },
      {}
    );

    expect(response.status()).toBe(200);
  }

  async createPositionAssignment(payload: any, tenant_Id: string, personId: string): Promise<void> {
    const peopleInfoUrl = (await get('PEOPLE_INFO_URL')).replace("{personId}", personId);
    const endpoint = `${await get('BASE_API_URL')}${peopleInfoUrl}/positions/`;
    const response = await this.apiUtils.post(endpoint, payload, { tenantId: tenant_Id }, {}, { personId: personId });
    expect(response.status()).toBe(204);
  }

  async createUser(payload: any) {
    const endPoint = `${await get('BASE_API_URL')}${await get('CREATE_USER')}`;
    const response = await this.apiUtils.post(endPoint, payload, { tenantId: `${await get('TENANT_ID')}` }, {}, {});
    const responseBody = await response.json();

    if (response.status() === 200) {
      return responseBody.personIdentity?.personKey;
    } else if (response.status() === 400) {
      if (responseBody.message?.includes('The user account name already exists within the system')) {
        return 0;
      }
    }
  }

  async createEmployee(payload: any) {
    const endPoint = `${await get('BASE_URL')}${await get('CREATE_USER')}`;
    const response = await this.apiUtils.post(endPoint, payload, { tenantId: `${await get('TENANT_ID')}` }, {}, {});
    expect(response.status()).toBe(200);
  }

  async addJob(payload: any) {
    const endPoint = `${await get('BASE_URL')}${await get('JOB_URL')}`;
    const response = await this.apiUtils.postAddJob(endPoint, payload, { tenantId: `${await get('TENANT_ID')}` }, {});
    const responseBody = await response.json();

    if (responseBody.message?.includes('not unique')) {
      expect(response.status()).toBe(400);
    } else {
      expect(response.status()).toBe(200);
    }
  }

  async setupPaycodeDistribution(payload: any) {
    const endPoint = `${await get('BASE_API_URL')}${await get('PAYCODE_DIS_URL')}`;
    const response = await this.apiUtils.postAddJob(endPoint, payload, { tenantId: `${await get('TENANT_ID')}` }, {});
    const responseBody = await response.json();

    if (responseBody.message?.includes('already in use')) {
      expect(response.status()).toBe(400);
    } else {
      expect(response.status()).toBe(200);
    }
  }

  async addLocation(payload: any) {
    const endPoint = `${await get('BASE_URL')}${await get('LOCATION_URL')}`;
    const response = await this.apiUtils.postAddJob(endPoint, payload, { tenantId: `${await get('TENANT_ID')}` }, {});
    const responseBody = await response.json();

    if (responseBody.message?.includes('not unique')) {
      expect(response.status()).toBe(400);
    } else {
      expect(response.status()).toBe(200);
    }
  }

  async applyUpsert(payload: any) {
    const endPoint = `${await get('BASE_URL')}${await get('UPSERT_URL')}`;
    const response = await this.apiUtils.post(endPoint, payload, { tenantId: `${await get('TENANT_ID')}` }, {}, {});
    expect(response.status()).toBe(200);
  }

  async updateWageWorkRule(payload: any, type: string) {
    let endpoint;
    if (type === 'multi_upsert') {
      endpoint = `${await get('BASE_API_URL')}${await get('CREATE_USER')}${await get('WAGE_WORK_URL_MULTIUPSERT')}`;
    } else {
      endpoint = `${await get('BASE_API_URL')}${await get('CREATE_USER')}${await get('WAGE_WORK_URL_MULTIREAD')}`;
    }

    const response = await Promise.race([
      this.apiUtils.post(endpoint, payload, { tenantId: 'manufacturing' }, {}, {}),
      new Promise((_, reject) => setTimeout(() => reject(new Error('updateWageWorkRule timeout after 30s')), 30000))
    ]) as any;
    expect(response.status()).toBe(200);
  }

  async importPunches(payload: any , tenant_Id: string) {
    const endpoint = `${await get('BASE_API_URL')}${await get('IMPORTPUNCH_URL')}`;
    const response = await this.apiUtils.post(endpoint, payload, { tenantId: tenant_Id }, {}, {});
    expect(response.status()).toBe(200);
  }

  async editImports(payload: any, tenant_Id: string): Promise<any> {
    const endpoint = `${await get('BASE_API_URL')}${await get('ENABLE_EDITS_IMPORT_URL')}`;
    const response = await this.apiUtils.post(endpoint, payload, { tenantId: tenant_Id }, {}, {});
    expect(response.status()).toBe(200);
    
    const responseBody = await response.json();
    console.log('Edit Imports response body:', JSON.stringify(responseBody, null, 2));
    return responseBody;
  }

  async signOffPayPeriod(payload: any, personNumber: string, period: string) {
    const endpoint = `${await get('BASE_API_URL')}${await get('SIGNOFF_URL')}`;
    const response = await this.apiUtils.post(endpoint, payload, { person_num: personNumber, timeframe_id: period }, {}, {});
    expect(response.status()).toBe(204);
  }

  async verifyIfTimecardSignedOff(payload: any, personNumber: string, period: string) : Promise<number> {
    const endpoint = `${await get('BASE_API_URL')}${await get('SIGNOFF_URL')}`;
    const response = await this.apiUtils.post(endpoint, payload, { person_num: personNumber, timeframe_id: period }, {}, {});
    return response.status();
  }

  async platformProperties(payload: any) {
    const endpoint = `${await get('BASE_API_URL')}${await get('PLATFORM_PROPERTIES')}`;
    const response = await this.apiUtils.post(endpoint, payload, {}, {}, {});
    expect(response.status()).toBe(202);
  }

  async addPCEToUser(payload: any , tenant_Id: string): Promise<string> {
    const releaseToggleURI = `${await get('BASE_API_URL')}${await get('EMPLOYEE_TIMECARD')}`;
    const response = await this.apiUtils.post(
      releaseToggleURI,
      payload,
      { tenantId: tenant_Id },
      { "X-dynaTrace": "NA=work_timecard_update" },
      {}
    );
    expect(response.status()).toBe(200);
    const responseBody = await response.json();
    return responseBody.payCodeEdits?.[0]?.employee?.id;
  }

  async fillTimeCardByManager(payload: any, tenant_Id: string): Promise<string> {
    const endpoint = `${await get('BASE_API_URL')}${await get('MANAGER_TIMECARDS')}`;
    const response = await this.apiUtils.post(endpoint, payload, { tenantId: tenant_Id }, {}, {});
    expect(response.status()).toBe(200);
    const responseBody = await response.json();
    return responseBody.payCodeEdits?.[0]?.id;
  }

  async moveAmount(payload: any,tenant_Id: string): Promise<void> {
    const releaseToggleURI = `${await get('BASE_API_URL')}${await get('TIMECARD')}`;
    const response = await this.apiUtils.post(
      releaseToggleURI,
      payload,
      { tenantId: tenant_Id },
      { 'X-dynaTrace': 'NA=work_timecard_update' },
      {}
    );
    expect(response.status()).toBe(200);
  }

  async addPunch(payload: any): Promise<void> {
    const releaseToggleURI = `${await get('BASE_API_URL')}${await get('TIMECARD')}`;
    const response = await this.apiUtils.post(
      releaseToggleURI,
      payload,
      { tenantId: 'manufacturing' },
      {},
      {}
    );
    expect(response.status()).toBe(200);
  }

  async addPunch1(payload: any, tenantId: string): Promise<void> {
    const releaseToggleURI = `${await get('BASE_API_URL')}${await get('TIMECARD')}`;
    const response = await this.apiUtils.post(
      releaseToggleURI,
      payload,
      { tenantId: tenantId },
      {},
      {}
    );
    expect(response.status()).toBe(200);
  }

  async createTotalAddOnProfileForMultiPositions(payload: any, tenant_Id: string): Promise<number> {
    const endpoint = `${await get('BASE_API_URL')}${await get('CREATE_TIMECARD_ADDON_PROFILE')}`;
    const response = await this.apiUtils.post(endpoint, payload, { tenantId: tenant_Id }, { 'X-dynaTrace': 'NA=TK_/timecard_addon_profiles/_create' }, {});
    expect(response.status()).toBe(200);
    const responseBody = await response.json();
    return responseBody.id;
  }

  async createTotalAddOnProfile(payload: any, tenant_Id: string): Promise<number> {
    const endpoint = `${await get('BASE_API_URL')}${await get('TIMECARD_ADDON_PROFILE')}`;
    const response = await this.apiUtils.post(endpoint, payload, { tenantId: tenant_Id }, { 'X-dynaTrace': 'NA=TK_/timecard_addon_profiles/_create' }, {});
    expect(response.status()).toBe(200);
    const responseBody = await response.json();

    return responseBody.id;
  }

  async updateUser(payload: any, tenant_Id: string): Promise<void> {
    const endPoint = `${await get('BASE_API_URL')}${await get('MULTIREAD')}`;
    const response = await this.apiUtils.post(endPoint, payload, { tenantId: tenant_Id }, {}, {});
    expect(response.status()).toBe(200);
    const responseBody = await response.json();
    return responseBody.ids;
  }

  async addTimeCardSetting(payload: any, tenant_Id: string): Promise<void> {
    const endpoint = `${await get('BASE_API_URL')}${await get('TIMECARD_SETTINGS')}`;
    const response = await this.apiUtils.post(endpoint, payload, { tenantId: tenant_Id }, { 'X-dynaTrace': 'NA=TK_/timecard_settings/_create' }, {});
    expect(response.status()).toBe(201);
  }

  async addDisplayProfile(payload: any, tenantId: string): Promise<number> {
    const endpoint = `${await get('BASE_API_URL')}${await get('DISPLAY_PROFILE_1')}`;
    const response = await this.apiUtils.post(endpoint, payload, { tenantId: tenantId }, {}, {});
    expect(response.status()).toBe(201);
    const responseBody = await response.json();
    return responseBody.id;
  }

  async disableSwitch(payload: any, tenantId: string): Promise<void> {
    const featureSwitchURI = `${await get('BASE_API_URL')}${await get('FEATURE_SWITCH')}`;
    const response = await this.apiUtils.post(
      featureSwitchURI,
      payload,
      { tenantId: tenantId },
      {},
      {}
    );
    expect(response.status()).toBe(200);
  }

  async addPosition(positionName: string, personId: string, startDate: string, status: 'ACTIVE' | 'INACTIVE' = 'ACTIVE'): Promise<boolean> {
    try {
      const getEndpoint = `${process.env.BASE_API_URL}wfc/restcall/v1/commons/peopleinfo/${personId}/positions/-${personId}`;
      const getResponse = await this.apiUtils.get(getEndpoint, { tenantId: `${process.env.TENANT_ID}` }, {}, {});
      
      if (getResponse.status() === 404) return false;
      
      expect(getResponse.status()).toBe(200);
      const defaultPosition = await getResponse.json();

      const positionPayload = {
        ...defaultPosition,
        id: undefined,
        tenantId: undefined,
        name: positionName,
        hireDate: startDate,
        positionStatuses: [{ name: status, effectiveDate: startDate }],
        locations: defaultPosition.locations?.map((loc: any) => ({ ...loc, effectiveDate: startDate })) || [],
        positionCustomDates: defaultPosition.positionCustomDates?.map((cd: any) => ({ ...cd, actualDate: startDate, defaultDate: startDate })) || [],
        jobTransferSets: defaultPosition.jobTransferSets?.length > 0 
          ? defaultPosition.jobTransferSets.map((jts: any) => ({ ...jts, effectiveDate: startDate })) 
          : []
      };

      delete positionPayload.person?.tenantId;
      delete positionPayload.job?.tenantId;

      const endpoint = `${await get('BASE_API_URL')}wfc/restcall/v1/commons/peopleinfo/${personId}/positions/`;
      const response = await this.apiUtils.post(endpoint, positionPayload, { tenantId: `${await get('TENANT_ID')}` }, {}, {});
      
      const statusCode = response.status();
      if (statusCode === 204) {
        console.log(`✅ Successfully added position '${positionName}' for person ${personId}`);
        return true;
      }
      if (statusCode === 400) {
        const body = await response.text();
        const isAlreadyExists = body.includes('already exists') || body.includes('duplicate') || body.includes('must be unique');
        if (isAlreadyExists) {
          console.log(`ℹ️ Position '${positionName}' already exists for person ${personId}`);
        }
        return isAlreadyExists;
      }
      if (statusCode === 409) return true;
      
      return false;
    } catch (error) {
      return false;
    }
  }

  async addLaborCategoryListAssignment(payload: any, tenantId: string): Promise<string> {
      const endpoint = `${await get('BASE_API_URL')}${await get('ADD_LABOR_CATEGORY_LIST_ASSIGNMENTS')}`;
      const response = await this.apiUtils.post(
        endpoint,
        payload,
        { tenantId: tenantId },
        {},
        {}
      );
      expect(response.status()).toBe(200);
      const responseBody = await response.json();
      // If response is an array, return the id from the first object
      if (Array.isArray(responseBody) && responseBody.length > 0 && responseBody[0].id) {
        return responseBody[0].id;
      }
      // Fallback to previous behavior
      return responseBody.id;
  }

  async deleteLaborCategoryListAssignment(payload: any, tenantId: string): Promise<void> {
      const endpoint = `${await get('BASE_API_URL')}${await get('DELETE_LABOR_CATEGORY_LIST_ASSIGNMENTS')}`;
      const response = await this.apiUtils.post(
      endpoint,
      payload,
      { tenantId: tenantId },
      {},
      {}
    );
    expect(response.status()).toBe(204);
     
  }
}

export { PostCalls };
