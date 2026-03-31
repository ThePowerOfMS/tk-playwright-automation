import getLocalEnv from './test-data/environments/local.js';
import { defineConfig, devices } from '@playwright/test';
import { config as dotenvConfig } from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { resolveSystemChrome } from '@utils';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const chromeExecutable = resolveSystemChrome();
const hasChrome = !!chromeExecutable;

// ✅ Suppress all dotenv logs
process.env.DOTENV_CONFIG_QUIET = 'true';
dotenvConfig({ quiet: true });

const env = 'r9int';
const isLocalExecution = true; // Set to true for local execution

process.env.ENV = env;
process.env.ENV_PATH = path.resolve(__dirname, `./test-data/environments/${env.toLowerCase()}.env`);
process.env.IS_LOCAL_EXECUTION = isLocalExecution.toString();

if (isLocalExecution) {
  const localCredPath = path.resolve(__dirname, './test-data/environments/local.cred.env');
  if (!fs.existsSync(localCredPath)) {
    throw new Error(`Local execution flag is enabled but credential file not found at: ${localCredPath}`);
  }
  process.env.LOCAL_CRED_PATH = localCredPath;
  console.log('Local execution mode: Using local credentials');
} else {
  console.log('Remote execution mode: Local credentials not required');
}
const localBaseURL = 'http://timekeeping90-b-k8s.int.dev.mykronos.com/';

// ✅ Async wrapper for dynamic environment loading
async function createConfig() {
  const localEnv = await getLocalEnv();

  const baseURLs: Record<string, string> = {
    local: localEnv.baseURL
  };

  return defineConfig({
    timeout: 900 * 1000,
    testDir: './tests',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 1 : 0,
    workers: process.env.CI ? 1 : undefined,

    reporter: [
      ['list'],
      ['html', { open: 'never', outputFolder: 'playwright-report' }],
      ['allure-playwright', { outputFolder: 'allure-results' }]
      // ['@reportportal/agent-js-playwright', rpConfig],
    ],

    use: {
      baseURL: process.env.BASE_URL || localBaseURL,
      screenshot: { mode: 'only-on-failure', fullPage: true },
      trace: 'retain-on-failure',
      video: 'retain-on-failure',
      actionTimeout: 30 * 1000,
      navigationTimeout: 60 * 1000,
      ignoreHTTPSErrors: true,
      locale: 'en-US',
      timezoneId: 'UTC'
    },

    projects: [
      {
        name: 'chrome-headed',
        use: {
          extraHTTPHeaders: {
            Authorization: `Bearer ${process.env.API_TOKEN}`
          },
          browserName: 'chromium',
          headless: false,
          viewport: null,
          launchOptions: {
            args: ['--start-maximized']
          }
        }
      },
        {
        name: 'chrome',
        use: {
          extraHTTPHeaders: {
            Authorization: `Bearer ${process.env.API_TOKEN}`
          },
          ...devices['Desktop Chrome'],
          ...(hasChrome? { executablePath: chromeExecutable } : { channel: 'chrome' }),
          viewport: { width: 1920, height: 1080 },
          launchOptions: {
            slowMo: 2000
          }
        }
      },
      {
        name: 'chromium',
        use: {
          browserName: 'chromium',
          headless: true,
          viewport: { width: 1920, height: 1080 },
          testIdAttribute: 'data-test',
          permissions: ['geolocation', 'microphone', 'camera'],
          launchOptions: {
            timeout: 0,
            args: [
              '--allow-file-access-from-files',
              '--use-fake-device-for-media-stream',
              '--use-fake-ui-for-media-stream',
              '--hide-scrollbars',
              '--disable-features=IsolateOrigins,site-per-process,VizDisplayCompositor,SidePanelPinning,OptimizationGuideModelDownloading,OptimizationHintsFetching,OptimizationTargetPrediction,OptimizationHints',
              '--disable-popup-blocking',
              '--disable-search-engine-choice-screen',
              '--disable-infobars',
              '--disable-dev-shm-usage',
              '--disable-notifications',
              '--disable-blink-features=AutomationControlled'
            ]
          }
        }
      },
      {
        name: 'setup-only',
        testDir: './tests/setup',
        testMatch: /.*\\.setup\\.ts/,
        use: {
          browserName: 'chromium',
          headless: true
        }
      }
    ]
  });
}

export default await createConfig();
