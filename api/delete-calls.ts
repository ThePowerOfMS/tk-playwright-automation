import { APIBaseClass } from './api-base-class';
import { GetCalls } from './get-calls';
import { get } from '@data-manager';
import { expect } from '@playwright/test';

class DeleteCalls extends APIBaseClass {
  async deleteUser(personId: string, maxRetries: number = 10) {
    const endpoint = `${await get('BASE_API_URL')}${await get('GET_PERSON')}`;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await this.apiUtils.delete(endpoint, {}, {}, { personId });
        const statusCode = response.status();

        // Success case - only 204 is expected
        if (statusCode === 204) {
          console.log(`✅ Deleted user with personId: ${personId} (attempt ${attempt}) - Status: ${statusCode}`);
          return { success: true, statusCode };
        }

        // Already deleted
        if (statusCode === 404) {
          console.log(`✅ User ${personId} not found (likely already deleted) - Status: ${statusCode}`);
          return { success: true, statusCode, alreadyDeleted: true };
        }

        console.log(`⚠️ Attempt ${attempt}: Got status ${statusCode}, expected 204`);

        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.log(`⚠️ Attempt ${attempt} failed:`, error);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    // Final verification by trying to GET the user
    try {
      const getCalls = new GetCalls(this.request);
      await getCalls.getPersonId(personId);
      console.log(`❌ User ${personId} still exists after ${maxRetries} deletion attempts`);
      return { success: false, reason: 'User still exists' };
    } catch {
      console.log(`✅ User ${personId} confirmed deleted (not found in GET request)`);
      return { success: true, reason: 'Confirmed via GET request' };
    }
  }

  async deletePerson(personId: string, tenant_Id: string) {
    const endpoint = `${await get('BASE_API_URL')}${await get('GET_PERSON')}`;
    for (let attempt = 1; attempt <= 20; attempt++) {
      try {
        const response = await this.apiUtils.delete(endpoint, { tenantId: tenant_Id }, {}, { personId });
        const statusCode = response.status();
        // Success case - only 204 is expected
        if (statusCode === 204) {
          console.log(`✅ Deleted user with personId: ${personId} (attempt ${attempt}) - Status: ${statusCode}`);
          return { success: true, statusCode };
        }

        // Already deleted
        if (statusCode === 404) {
          console.log(`✅ User ${personId} not found (likely already deleted) - Status: ${statusCode}`);
          return { success: true, statusCode, alreadyDeleted: true };
        }

        console.log(`⚠️ Attempt ${attempt}: Got status ${statusCode}, expected 204`);

        if (attempt < 10) {
          await new Promise(resolve => setTimeout(resolve, 10000));
        }
      } catch (error) {
          console.log(`⚠️ Attempt ${attempt} failed:`, error);
          if (attempt < 10) {
            await new Promise(resolve => setTimeout(resolve, 5000));
          }
        }
    }
    
    // Final verification by trying to GET the user
    try {
      const getCalls = new GetCalls(this.request);
      await getCalls.getPersonId(personId);
      console.log(`❌ User with ${personId} still exists`);
      return { success: false, reason: 'User still exists' };
    } catch {
      console.log(`✅ User ${personId} confirmed deleted (not found in GET request)`);
      return { success: true, reason: 'Confirmed via GET request' };
    }
  }

  async deleteDataView(dataViewId: string, tenant_Id: string) {
    const endpoint = `${await get('BASE_API_URL')}/wfc/restcall/v1/commons/dataviews/{id}`;
    const response = await this.apiUtils.delete(endpoint, { tenantId: tenant_Id }, {}, { id: dataViewId });
    expect(response.status()).toBe(204);
    console.log(`✅ Deleted DataView with id: ${dataViewId}`);
    return { statusCode: response.status() };
  }

  async deleteShiftsByIds(shiftIds: number[], tenantId: string) {
    if (!shiftIds || shiftIds.length === 0) {
      console.warn('⚠️ No shiftIds provided for deletion.');
      return;
    }

    const endpoint = `${await get('BASE_API_URL')}wfc/restcall/v1/scheduling/schedule/shifts/multi_delete`;
    const payload = {
      where: { shiftIds }
    };

    const response = await this.apiUtils.post(
      endpoint,
      payload,
      { tenantId },
      {},
      {}
    );

    expect(response.status(), `Failed to delete shifts: ${shiftIds.join(', ')}`).toBe(204);

    const resJson = await response.json().catch(() => ({}));
    console.log(`🗑️ Deleted shifts: ${shiftIds.join(', ')} | Response: ${JSON.stringify(resJson)}`);
  }

  async deletePunchForTimecard(
    punchId: string,
    personNum: string,
    startDate: string,
    endDate: string,
    tenantId: string
  ) {
    const endpoint = `${await get('BASE_API_URL')}${await get('PUNCH_URL')}/${punchId}`;
    const queryParams = {
      tenantId,
      from: `${startDate}T00:00:00`,
      to: `${endDate}T23:59:00`,
      person_num: personNum
    };

    const response = await this.apiUtils.delete(endpoint, queryParams, {}, {});
    expect(response.status()).toBe(204);

    console.log(
      `✅ Deleted punch ${punchId} for ${personNum} (${startDate} → ${endDate}) [tenant=${tenantId}]`
    );
  }

  async deletePayCodeEdits(id: string, personNum: string, startDate: string, endDate: string) {
    const endpoint = `${await get('BASE_API_URL')}${await get('DELETE_PAYCODE_EDIT')}`;
    const queryParams = {
      from: `${startDate}T00:00:00`,
      to: `${endDate}T23:59:00`,
      person_num: personNum
    };
    console.log('Given payCodeEditId --->', id);
    const response = await this.apiUtils.delete(endpoint, queryParams, {}, { payCodeEditId: id });
    expect(response.status()).toBe(204);
    console.log(`✅ Deleted pay code edit ${id}`);
  }

  async deletePunchesByDay(
    personNum: string,
    options: {
      day: 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'today';
      week: 'previous' | 'current' | 'next';
    },
    tenantId: string
  ) {
    const getCalls = new GetCalls(this.request);
    const targetDate = this.resolveTargetDate(options.day, options.week);

    const punchIds = await getCalls.getPunchIds(personNum, targetDate, targetDate, tenantId);

    if (punchIds.length === 0) {
      console.warn(`⚠️ No punches found for ${personNum} on ${targetDate} [tenant=${tenantId}]`);
      return;
    }

    for (const punchId of punchIds) {
      await this.deletePunchForTimecard(punchId, personNum, targetDate, targetDate, tenantId);
    }
  }

  async deletePunchesByIds(
    personNum: string,
    punchIds: string[] | number[],
    startDate: string,
    endDate: string,
    tenantId: string
  ) {
    if (!punchIds || punchIds.length === 0) {
      console.warn(`⚠️ No punches to delete for ${personNum} [tenant=${tenantId}]`);
      return;
    }

    for (const punchId of punchIds) {
      await this.deletePunchForTimecard(
        String(punchId),
        personNum,
        startDate,
        endDate,
        tenantId
      );
    }
  }

  async deleteSignOffPayPeriod(personNumber: string, period: string) {
    const endpoint = `${await get('BASE_API_URL')}${await get('SIGNOFF_URL')}`;
    const response = await this.apiUtils.delete(endpoint, { person_num: personNumber, timeframe_id: period }, {}, {});
    expect(response.status()).toBe(204);
  }

  async deleteTimecardApproval(tenantId: string, personNumber: string, startDate: string, endDate: string) {
    const endpoint = `${await get('BASE_API_URL')}${await get('DELETE_TIMCARD_APPROVAL')}`;
    console.log('endpoint', endpoint);
    const response = await this.apiUtils.delete(endpoint, { tenantId: tenantId, person_num: personNumber, symbolic_period: 'Previous_Payperiod', start_Date: startDate, end_Date: endDate }, {}, {});
    expect(response.status()).toBe(400);
  }

  async deleteDataViewProfile(dataViewProfileId: string, tenant_Id: string) {
    const endpoint = `${await get('BASE_API_URL')}/wfc/restcall/v1/commons/dataview_profiles/{id}`;
    const response = await this.apiUtils.delete(endpoint, { tenantId: tenant_Id }, {}, { id: dataViewProfileId });
    expect(response.status()).toBe(204);
    console.log(`✅ Deleted DataView Profile with id: ${dataViewProfileId}`);
    return { statusCode: response.status() };
  }

  async deleteDisplayProfile(displayProfileId: string , tenant_Id: string) {
    const endpoint = `${await get('BASE_API_URL')}${await get('DISPLAY_PROFILE')}`;
    const response = await this.apiUtils.delete(endpoint, { tenantId : tenant_Id}, {}, { profileId: displayProfileId });
    expect(response.status()).toBe(204);
    console.log(`✅ Deleted Display Profile with id: ${displayProfileId}`);
    return { statusCode: response.status() };
  }

  async deleteTimecardSetting(tenant_Id: string, timecardSettingId: string) {
    const endpoint = `${await get('BASE_API_URL')}${await get('TIMECARD_SETTINGS_1')}`;
    const response = await this.apiUtils.delete(endpoint, { tenantId: tenant_Id }, { 'X-dynaTrace': 'NA=TK_/timecard_settings/_delete' }, { id: timecardSettingId });
    expect(response.status()).toBe(204);
    console.log(`✅ Deleted Timecard Setting with id: ${timecardSettingId}`);
  }

  async deleteAddOnProfile(addOnProfileId: string, tenant_Id: string) {
    const endpoint = `${await get('BASE_API_URL')}${await get('CREATE_TIMECARD_ADDON_PROFILE')}`;
    console.log('endpoint', endpoint);
    const response = await this.apiUtils.delete(endpoint, { tenantId: tenant_Id }, { 'X-dynaTrace': 'NA=TK_/timecard_addon_profiles/_delete' }, { profileId: addOnProfileId });
    expect(response.status()).toBe(204);
    console.log(`✅ Deleted AddOn Profile with id: ${addOnProfileId}`);
  }
}

export { DeleteCalls };
