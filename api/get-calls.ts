import { APIBaseClass } from './api-base-class';
import { get } from '@data-manager';
import { expect } from '@playwright/test';

interface PersonResponse {
  personIdentity?: {
    personKey?: number;
  };
  personInformation?: {
    person?: {
      personNumber?: string;
    };
  };
  positionInformation?: Array<{
    id?: number;
    name?: string;
  }>;
  gdapAssignments?: any[];
  jobAssignment?: any;
  user?: any;
}

class GetCalls extends APIBaseClass {
  async getFap(fapname: string): Promise<any> {
    const endpoint = `${await get('BASE_API_URL')}${await get('GET_FAP')}`;
    const response = await this.apiUtils.get(endpoint, {}, {}, { fapName: fapname });
    expect(response.status()).toBe(200);
    return response.json();
  }

  async getPayCodeEditsId(startDate: string, endDate: string, personNum: string): Promise<string> {
    const endpoint = `${await get('BASE_API_URL')}${await get('GENERIC_TIMECARD')}`;

    const queryParams = {
      tenantId: `${await get('TENANT_ID')}`,
      include_kind_of_time_segments: 'false',
      person_number: personNum,
      start_date: startDate,
      end_date: endDate
    };

    const response = await this.apiUtils.get(endpoint, queryParams, {}, {});
    expect(response.status()).toBe(200);

    const responseBody = await response.json();

    const payCodeEditId = responseBody.payCodeEdits[0]?.id;
    console.log('payCodeEditId : ' + payCodeEditId);

    return payCodeEditId || '';
  }

  async getByPersonNumber(personNumber: string): Promise<PersonResponse | null> {
    try {
      // First get person ID by person number
      const personId = await this.getPersonIdByPersonNumber(personNumber);
      if (!personId) {
        return null;
      }

      // Then get full person details by ID
      const endpoint = `${await get('BASE_API_URL')}${await get('GET_PERSON')}`;
      const response = await this.apiUtils.get(endpoint, {}, {}, { personId: personId });

      expect(response.status()).toBe(200);
      const personData: PersonResponse = await response.json();

      return personData;
    } catch (error) {
      console.error(`Error getting person by number ${personNumber}:`, error);
      return null;
    }
  }

  async getAllPayCodeEditsIds(startDate: string, endDate: string, personNum: string): Promise<string[]> {
    const endpoint = `${await get('BASE_API_URL')}${await get('GENERIC_TIMECARD')}`;

    const queryParams = {
        tenantId: `${await get('TENANT_ID')}`,
        include_kind_of_time_segments: 'false',
        person_number: personNum,
        start_date: startDate,
        end_date: endDate,
    };

    const response = await this.apiUtils.get(endpoint, queryParams, {}, {});
    expect(response.status()).toBe(200);

    const responseBody = await response.json();
  
    // ⭐ Extract all payCodeEdit IDs safely
    const payCodeEditIds =
        responseBody?.payCodeEdits?.map((edit: any) => String(edit.id)) ?? [];

    console.log("Extracted PayCodeEdit IDs =>", payCodeEditIds.join(", "));

    return payCodeEditIds;
}

  async getPersonIdByPersonNumber(personNumber: string): Promise<string | null> {
    try {
      const endpoint = `${await get('BASE_API_URL')}${await get('GET_PERSON_PATH')}`;
      const queryParams = { person_number: personNumber };
      const response = await this.apiUtils.get(endpoint, queryParams, {}, {});

      if (response.status() !== 200) {
        return null;
      }

      const responseBody = await response.json();
      return responseBody.allExtension?.accrualExtension?.personId || null;
    } catch (error) {
      console.error(`Error getting person ID for ${personNumber}:`, error);
      return null;
    }
  }

  async getGroupEditResults(tenantId: string): Promise<any> {
    const endpoint = `${await get('BASE_API_URL')}/wfc/restcall/ia/v1/group_edit_result`;
    const queryParams = { tenantId: tenantId };
    const response = await this.apiUtils.get(endpoint, queryParams, {}, {});
    expect(response.status()).toBe(200);
    return response.json();
  }

  async getGroupEditResultById(groupEditId: number, tenantId: string): Promise<any> {
    const endpoint = `${await get('BASE_API_URL')}/wfc/restcall/ia/v1/group_edit_result/${groupEditId}`;
    const queryParams = { tenantId: tenantId };
    const response = await this.apiUtils.get(endpoint, queryParams, {}, {});
    expect(response.status()).toBe(200);
    return response.json();
  }

  async getPayRuleForUpdate(payRuleName: string): Promise<any> {
    const endpoint = `${await get('BASE_API_URL')}${await get('GET_WSA_PAYRULE_URL')}/${payRuleName}`;
    const response = await this.apiUtils.get(endpoint, { tenantId: `${await get('TENANT_ID')}` }, {}, {});
    expect(response.status()).toBe(200);
    const responseBody = await response.json();
    console.log('Retrieved pay rule data:', JSON.stringify(responseBody, null, 2));

    return responseBody;
  }

  async getPersonRecord(personId: string, tenantId: string): Promise<any> {
    const endpoint = `${await get('BASE_API_URL')}${await get('GET_PERSON')}`.replace('{personId}', personId);
    const queryParams = { tenantId };
    const response = await this.apiUtils.get(endpoint, queryParams, {}, {});
    expect(response.status()).toBe(200);
    return response.json();
  }

  async getSetupPaycode(tenant_Id: string) {
    const endPoint = `${await get('BASE_API_URL')}${await get('SETUP_PAYCODE')}`;
    const response = await this.apiUtils.get(endPoint, {}, { tenantId: tenant_Id }, {});
    expect(response.status()).toBe(200);
  }

  async getPerson(personNumber: string, exist: boolean) {
    const endpoint = `${await get('BASE_API_URL')}${await get('GET_PERSON_PATH')}`;
    const queryParams = { person_number: personNumber };
    const response = await this.apiUtils.get(endpoint, queryParams, {}, {});

    if (!exist) {
      expect(response.status()).toBe(400);
    } else {
      expect(response.status()).toBe(200);
      const responseBody = await response.json();
      return responseBody.allExtension?.accrualExtension.personId;
    }
  }

  async getPersonId(personid: string) {
    const endpoint = `${await get('BASE_API_URL')}${await get('GET_PERSON')}`;
    const response = await this.apiUtils.get(endpoint, {}, {}, { personId: personid });
    expect(response.status()).toBe(200);
  }

  async getPeopleInfo(personId: string): Promise<any> {
    const peopleInfoUrl = (await get('PEOPLE_INFO_URL')).replace("{personId}", personId);
    const endpoint = `${await get('BASE_API_URL')}${peopleInfoUrl}/positions/-${personId}`;
    const response = await this.apiUtils.get(endpoint, {}, {}, {});
    expect(response.status()).toBe(200);
    return response.json();
  }

  async getHyperfindQueries(): Promise<any> {
    const endpoint = `${await get('BASE_API_URL')}${await get('HYPERFIND_QUERY')}`;
    const queryParams = { tenantId: `${await get('TENANT_ID')}` };

    const response = await this.apiUtils.get(endpoint, queryParams, {}, {});
    expect(response.status()).toBe(200);

    const responseBody = await response.json();
    const homeHyperfindNames = responseBody.hyperfindQueries
      .filter((query: any) => query.usageType === 'Home')
      .map((query: any) => query.name);

    console.log('UsageType: Home entries:', homeHyperfindNames);
    expect(homeHyperfindNames.length).toBeGreaterThan(0);

    return homeHyperfindNames;
  }

  async getDataForSpecificDateRange(startDate: string, endDate: string): Promise<void> {
    const endpoint = `${await get('BASE_API_URL')}${await get('TIMECARD')}`;
    const queryParams = {
      tenantId: `${await get('TENANT_ID')}`,
      include_kind_of_time_segments: 'false',
      person_number: `${await get('MPMAEMPPHRLMANY_1')}`,
      start_date: startDate,
      end_date: endDate
    };

    const response = await this.apiUtils.get(endpoint, queryParams, {}, {});
    expect(response.status()).toBe(200);
  }

  async getDataForSpecificDateRangeForTimecards(startDate: string, endDate: string): Promise<string> {
    const endpoint = `${await get('BASE_API_URL')}${await get('GENERIC_TIMECARD')}`;

    const queryParams = {
      tenantId: `${await get('TENANT_ID')}`,
      include_kind_of_time_segments: 'false',
      person_number: `${await get('MPMAEMPPHRLMANY_1')}`,
      start_date: startDate,
      end_date: endDate
    };

    const response = await this.apiUtils.get(endpoint, queryParams, {}, {});
    expect(response.status()).toBe(200);

    const responseBody = await response.json();
    console.log('response : ' + JSON.stringify(responseBody));

    const startPunchId = responseBody.workedSpanList?.[1]?.[0]?.startPunch?.id;
    const endPunchId = responseBody.workedSpanList?.[1]?.[0]?.endPunch?.id;
    const startPunchId2 = responseBody.workedShifts[0].workedSpans[0].startPunch.id;
    const endPunchId2 = responseBody.workedShifts[0].workedSpans[0].endPunch.id;

    const punchIds = `${startPunchId},${endPunchId},${startPunchId2},${endPunchId2}`;
    console.log('PunchIds : ' + punchIds);

    return punchIds;
  }

  async getPunchIds(
    personNum: string,
    startDate: string,
    endDate: string,
    tenantId: string
  ): Promise<string[]> {
    const endpoint = `${await get('BASE_API_URL')}${await get('GENERIC_TIMECARD')}`;

    const queryParams = {
      tenantId,
      include_kind_of_time_segments: 'false',
      person_number: personNum,
      start_date: startDate,
      end_date: endDate
    };

    const response = await this.apiUtils.get(endpoint, queryParams, {}, {});
    expect(response.status()).toBe(200);

    const responseBody = await response.json();
    const ids: string[] = [];

    if (Array.isArray(responseBody.workedSpanList)) {
      for (const spanGroup of responseBody.workedSpanList) {
        for (const span of spanGroup) {
          if (span.startPunch?.id) ids.push(String(span.startPunch.id));
          if (span.endPunch?.id) ids.push(String(span.endPunch.id));
        }
      }
    }

    console.log(`Punch IDs for ${personNum} (${startDate} → ${endDate}) [tenant=${tenantId}]:`, ids);
    return ids;
  }

  async verifyReleaseToggleIsSetToTrue(): Promise<void> {
    const releaseToggleURI = `${await get('BASE_URL')}${await get('RELEASE_TOGGLE_PATH')}`;
    const queryParams = { tenantId: `${await get('TENANT_ID')}` };

    const response = await this.apiUtils.get(releaseToggleURI, queryParams, {}, {});
    expect(response.status()).toBe(200);

    const responseBody = await response.json();
    expect(responseBody?.['tk.DisplayFlankingDays']).toBe(true);
  }

  async getTotalAddOnProfileForMultiPositions(tenant_Id: string): Promise<void> {
    const endpoint = `${await get('BASE_API_URL')}${await get('TIMECARD_ADDON_PROFILE')}`;
    console.log('endpoint : ' + endpoint);
    const response = await this.apiUtils.get(endpoint, { tenantId: tenant_Id }, { 'X-dynaTrace': 'NA=TK_/timecard_addon_profiles/_findAll' }, {});
    expect(response.status()).toBe(200);
  }

  async getTimecardAddOnProfile(tenant_Id: string): Promise<void> {
    const endpoint = `${await get('BASE_API_URL')}${await get('TIMECARD_ADDON_PROFILE')}`;
    const response = await this.apiUtils.get(endpoint, { tenantId: tenant_Id }, { 'X-dynaTrace': 'NA=TK_/timecard_addon_profiles/_findAll' }, {});
    expect(response.status()).toBe(200);
  }

  async getDisplayProfile_1(tenantId: string): Promise<void> {
    const endpoint = `${await get('BASE_API_URL')}${await get('DISPLAY_PROFILE_1')}`;
    const queryParams = { tenantId: tenantId };

    const response = await this.apiUtils.get(endpoint, queryParams, {}, {});
    expect(response.status()).toBe(200);
  }

  async getDisplayProfile(tenantId: string, profile_Id: string): Promise<string> {
    const endpoint = `${await get('BASE_API_URL')}${await get('DISPLAY_PROFILE')}`;
    const queryParams = { tenantId: tenantId };

    const response = await this.apiUtils.get(endpoint, queryParams, {}, { profileId: profile_Id });
    expect(response.status()).toBe(200);

    const responseBody = await response.json();
    return responseBody?.employeeProjectTimecardSetting.id;
  }

  async getPersonalityLoad(tenant_Id: string, person_Number: string): Promise<void> {
    const endpoint = `${await get('BASE_API_URL')}${await get('PERSONALITY_LOAD')}`;
    const queryParams = { tenantId: tenant_Id, personNumber: person_Number };
    const response = await this.apiUtils.get(endpoint, queryParams, {}, {});
    expect(response.status()).toBe(200);
  }

  async featureSwitch(tenant_Id: string): Promise<void> {
    const endpoint = `${await get('BASE_API_URL')}${await get('FEATURE_SWITCH_GET')}`;
    const queryParams = { tenantId: tenant_Id };
    const response = await this.apiUtils.get(endpoint, queryParams, {}, {});
    expect(response.status()).toBe(200);
  }

  async getActivePositions(personId: string, startDate: string, endDate: string): Promise<any[]> {
    try {
      const endpoint = `${process.env.BASE_API_URL}${process.env.PEOPLE_POSITION_URL}`.replace('{personId}', personId);
      const response = await this.apiUtils.get(endpoint, { tenantId: `${process.env.TENANT_ID}`, startDate, endDate, status: 'ACTIVE' }, {}, {});
      
      if (response.status() === 404) {
        console.log(`No active positions found for person ${personId} between ${startDate} and ${endDate}`);
        return [];
      }
      
      expect(response.status()).toBe(200);
      const responseBody = await response.json();
      return responseBody.positions || responseBody || [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(errorMessage.includes('404') || errorMessage.includes('Expected: 200') 
        ? `No active positions found for person ${personId} between ${startDate} and ${endDate}`
        : `Error getting active positions for person ${personId}: ${errorMessage}`);
      return [];
    }
  }
  
  async getPositionId(positionName: string, personId: string, startDate: string, endDate: string): Promise<number | null> {
    try {
      const positions = await this.getActivePositions(personId, startDate, endDate);
      const matchingPosition = positions.find((position: any) => position.name === positionName);
      
      console.log(matchingPosition 
        ? `✅ Position '${positionName}' found for person ${personId}: ID ${matchingPosition.id}`
        : `❌ Position '${positionName}' not found for person ${personId}. Available positions: ${positions.map(p => p.name).join(', ') || 'None'}`);
      
      return matchingPosition?.id ?? null;
    } catch (error) {
      console.error(`Error getting position ID for ${positionName}:`, error instanceof Error ? error.message : String(error));
      return null;
    }
  }
}
export { GetCalls };
