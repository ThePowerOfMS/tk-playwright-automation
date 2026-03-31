import { APIBaseClass } from './api-base-class';
import { get } from '@data-manager';
import { expect } from '@playwright/test';
import { profile } from 'console';

class PutCalls extends APIBaseClass {
  async updateFap(fapname: string, payload: any) {
    const endpoint = `${await get('BASE_API_URL')}${await get('UPDATE_FAP')}`;
    const response = await this.apiUtils.put(endpoint, payload, {}, {}, { fapName: fapname });
    expect(response.status()).toBe(200);
    const responseBody = await response.json();
    console.log('responseBody', responseBody);
    const status = responseBody?.Response?.Status ?? null;
    expect(status).toBe('Success');
  }

  async updateCreateContributingPayCode(payload: any) {
    const endpoint = `${await get('BASE_API_URL')}${await get('CONTRIBUTING_PAY_CODE')}`;
    const response = await this.apiUtils.put(endpoint, payload, {}, {}, {});
    expect(response.status()).toBe(200);

    const responseBody = await response.json();
    console.log('Response body: PUT ContributingPayCode:\n', responseBody);
  }

  async updateUser(payload: any, personid: string) {
    const endpoint = `${await get('BASE_API_URL')}${await get('GET_PERSON')}`;
    const response = await this.apiUtils.put(endpoint, payload, {}, {}, { personId: personid });
    expect(response.status()).toBe(200);
  }

  async updateAddOnProfile(payload: any, person_id: string, tenant_Id: string): Promise<void> {
    const endpoint = `${await get('BASE_API_URL')}${await get('CREATE_TIMECARD_ADDON_PROFILE')}`;
    const response = await this.apiUtils.put(endpoint, payload, { tenantId: tenant_Id }, { 'X-dynaTrace': 'NA=TK_/timecard_settings/_update' }, { profileId: person_id });
    expect(response.status()).toBe(200);
  }

  async updateAddOnProfile1(payload: any, person_id: string, tenant_Id: string): Promise<void> {
    const endpoint = `${await get('BASE_API_URL')}${await get('CREATE_TIMECARD_ADDON_PROFILE')}`;
    const response = await this.apiUtils.put(endpoint, payload, { tenantId: tenant_Id }, { 'X-dynaTrace': 'NA=TK_/timecard_addon_profiles/_update' }, { profileId: person_id });
    expect(response.status()).toBe(200);
  }

  async updateDisplayProfile(payload: any, profile_Id: string, tenant_Id: string, type: string): Promise<string> {
    const endpoint = `${await get('BASE_API_URL')}${await get('DISPLAY_PROFILE')}`;
    const response = await this.apiUtils.put(endpoint, payload, { tenantId: tenant_Id }, {}, { profileId: profile_Id });
    expect(response.status()).toBe(200);
    const responseBody = await response.json();
    if (type === 'employeeProject') {
      return responseBody?.employeeProjectTimecardSetting.id;
    } else if (type === 'employeeHourly') {
      return responseBody?.employeeHourlyTimecardSetting.id;
    } else if (type === 'managerProject') {
      return responseBody?.managerProjectTimecardSetting.id;
    } else if (type === 'managerProjectHourly') {
      const hourlyid = responseBody?.managerHourlyTimecardSetting.id;
      const projectid = responseBody?.managerProjectTimecardSetting.id;
      const id = hourlyid + ',' + projectid;
      return id;
    } else if (type === 'employeeProjectHourly') {
      const hourlyid = responseBody?.employeeHourlyTimecardSetting.id;
      const projectid = responseBody?.employeeProjectTimecardSetting.id;
      const id = hourlyid + ',' + projectid;
      return id;
    } else if (type === 'employeeHourlyManagerProject') {
      const hourlyid = responseBody?.employeeHourlyTimecardSetting.id;
      const projectid = responseBody?.managerProjectTimecardSetting.id;
      const id = hourlyid + ',' + projectid;
      return id;
    } else {
      return responseBody?.managerHourlyTimecardSetting.id;
    }
  }

  async updateDetails(payload: any, type: string, name: string) {
    let endpoint = '';

    if (type === 'WSAPaycode') {
      endpoint = `${await get('BASE_API_URL')}${await get('Update_WSA_PAYCODE_URL')}`;
    } else if (type === 'WSAWorkRule') {
      endpoint = `${await get('BASE_API_URL')}${await get('Update_WSA_WORKRULE_URL')}`;
    }

    const response = await this.apiUtils.put(endpoint, payload, { tenantId: 'manufacturing' }, {}, { name: name });
    expect(response.status()).toBe(200);
  }

  async updatePayRule(payRuleName: string, payload: any): Promise<void> {
    const endpoint = `${await get('BASE_API_URL')}${await get('UPDATE_WSA_PAYRULE_URL')}/${payRuleName}`;
    const response = await this.apiUtils.put(endpoint, payload, { tenantId: `${await get('TENANT_ID')}` }, {}, {});

    expect(response.status()).toBe(200);
    const responseBody = await response.json();
    console.log('Pay rule update response:', JSON.stringify(responseBody, null, 2));

    const status = responseBody?.Response?.Status ?? null;
    expect(status).toBe('Success');
  }

  async updateDisplayProfile2(payload: any, profile_Id: string, tenant_Id: string): Promise<void> {
    const endpoint = `${await get('BASE_API_URL')}${await get('DISPLAY_PROFILE')}`;
    console.log('endpoint', endpoint);
    const response = await this.apiUtils.put(endpoint, payload, { tenantId: tenant_Id }, {}, { profileId: profile_Id });
    expect(response.status()).toBe(200);
  }
}
export { PutCalls };
