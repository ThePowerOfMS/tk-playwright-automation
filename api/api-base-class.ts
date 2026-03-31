import { get } from '@data-manager';
import { ApiUtils } from '@utils';
import { request, APIRequestContext, APIResponse, expect } from '@playwright/test';

interface UserSession {
  context: APIRequestContext;
  apiUtils: ApiUtils;
}

export class APIBaseClass {
  private static userSessions: Map<string, UserSession> = new Map();
  private static currentUserGlobal?: string;

  constructor(protected request: APIRequestContext) {
  }

  async login(username: string): Promise<ApiUtils> {
    if (!APIBaseClass.userSessions.has(username)) {
      const userContext = await request.newContext();
      const userApiUtils = new ApiUtils(userContext);
      const authAPI_URI = `${await get('AUTH_API_BASE_URL')}${await get('AUTH_API_JSON')}${await get('TENANT_ID')}${await get('AUTH_API_AUTHENTICATOR')}`;

      const response: APIResponse = await userApiUtils.post(
        authAPI_URI,
        {},
        {},
        {
          'X-OpenAM-Username': username,
          'X-OpenAM-Password': await get('PASSWORD')
        },
        {}
      );

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.successUrl).toContain('/authn/');

      APIBaseClass.userSessions.set(username, {
        context: userContext,
        apiUtils: userApiUtils
      });
    }

    APIBaseClass.currentUserGlobal = username;
    return APIBaseClass.userSessions.get(username)!.apiUtils;
  }

  async loginWithSpecificTenantId(username: string, tenantId: string): Promise<ApiUtils> {
    if (!APIBaseClass.userSessions.has(`${username}_${tenantId}`)) {
      const userContext = await request.newContext();
      const userApiUtils = new ApiUtils(userContext);

      const authAPI_URI = `${await get('AUTH_API_BASE_URL')}${await get('AUTH_API_JSON')}${tenantId}${await get('AUTH_API_AUTHENTICATOR')}`;

      const response: APIResponse = await userApiUtils.post(
        authAPI_URI,
        {},
        {},
        {
          'X-OpenAM-Username': username,
          'X-OpenAM-Password': `${await get('PASSWORD')}`
        },
        {}
      );

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.successUrl).toContain('/authn/');

      APIBaseClass.userSessions.set(`${username}_${tenantId}`, {
        context: userContext,
        apiUtils: userApiUtils
      });
    }

    APIBaseClass.currentUserGlobal = `${username}_${tenantId}`;
    return APIBaseClass.userSessions.get(`${username}_${tenantId}`)!.apiUtils;
  }

  async login_1(username: string): Promise<ApiUtils> {
    if (!APIBaseClass.userSessions.has(username)) {
      const userContext = await request.newContext();
      const userApiUtils = new ApiUtils(userContext);

      const authAPI_URI = `${await get('AUTH_API_BASE_URL')}${await get('AUTH_API_JSON')}${await get('TENANT_ID')}${await get('AUTH_API_AUTHENTICATOR')}`;

      const response: APIResponse = await userApiUtils.post(
        authAPI_URI,
        {},
        {
          authIndexType: 'service',
          authIndexValue: 'SystemUserAuthService'
        },
        {
          'X-OpenAM-Username': username,
          'X-OpenAM-Password': await get('PASSWORD')
        },
        {}
      );

      expect(response.status()).toBe(200);
      const body = await response.json();
      expect(body.successUrl).toContain('/authn/');

      APIBaseClass.userSessions.set(username, {
        context: userContext,
        apiUtils: userApiUtils
      });
    }

    APIBaseClass.currentUserGlobal = username;
    return APIBaseClass.userSessions.get(username)!.apiUtils;
  }

  async loginWithMockSession(username: string, tenantId: string): Promise<ApiUtils> {
    const sessionKey = `${username}_mock_${tenantId}`;
    
    if (!APIBaseClass.userSessions.has(sessionKey)) {
      const userContext = await request.newContext();
      const userApiUtils = new ApiUtils(userContext);
      
      // Use the mock session setup endpoint that bypasses OpenAM authentication
      const mockSetupURL = `${await get('MOCK_BASE_URL')}?user=${username}&tenantId=${tenantId}`;
      
      const response: APIResponse = await userApiUtils.get(
        mockSetupURL,
        {},
        {},
        {}
      );

      // Mock session setup typically returns 200-302 range
      if (response.status() >= 200 && response.status() < 400) {
        console.log(`Successfully created mock session for ${username}`);
        APIBaseClass.userSessions.set(sessionKey, {
          context: userContext,
          apiUtils: userApiUtils
        });
      } else {
        throw new Error(`Mock session setup failed with status: ${response.status()}`);
      }
    }

    APIBaseClass.currentUserGlobal = sessionKey;
    return APIBaseClass.userSessions.get(sessionKey)!.apiUtils;
  }

  protected get apiUtils(): ApiUtils {
    if (!APIBaseClass.currentUserGlobal) {
      throw new Error('No user is logged in for this session');
    }
    const session = APIBaseClass.userSessions.get(APIBaseClass.currentUserGlobal);
    if (!session) {
      throw new Error(`Session not found for user: ${APIBaseClass.currentUserGlobal}. Available sessions: ${Array.from(APIBaseClass.userSessions.keys()).join(', ')}`);
    }
    return session.apiUtils;
  }

  protected resolveTargetDate(
    day: string,
    week: 'previous' | 'current' | 'next'
  ): string {
    const dayMap: Record<string, number> = {
      monday: 1,
      tuesday: 2,
      wednesday: 3,
      thursday: 4,
      friday: 5,
      saturday: 6,
      sunday: 7
    };

    const targetDay = dayMap[day.toLowerCase()];
    if (!targetDay) throw new Error(`Invalid day: ${day}`);

    const today = new Date();
    const isoToday = today.getDay() === 0 ? 7 : today.getDay();

    const mondayThisWeek = new Date(today);
    mondayThisWeek.setDate(today.getDate() - (isoToday - 1));

    const targetDate = new Date(mondayThisWeek);
    targetDate.setDate(mondayThisWeek.getDate() + (targetDay - 1));

    if (week === 'next') {
      targetDate.setDate(targetDate.getDate() + 7);
    } else if (week === 'previous') {
      targetDate.setDate(targetDate.getDate() - 7);
    }

    return targetDate.toISOString().split('T')[0];
  }

  static async cleanup() {
    for (const session of APIBaseClass.userSessions.values()) {
      await session.context.dispose();
    }
    APIBaseClass.userSessions.clear();
    APIBaseClass.currentUserGlobal = undefined;
  }
}
