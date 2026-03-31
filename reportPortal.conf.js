const buildNumber = process.env.DEV_BUILD_NUMBER || 'local-run';
const testTag = process.env.TEST_TAG || 'local';

const config = {
  endpoint: process.env.RP_ENDPOINT,
  apiKey: process.env.RP_API_KEY,
  launch: `Playwright ${testTag} Tests -> TK - UI Test Cases - Build #${buildNumber}`,
  project: process.env.RP_PROJECT,
  attributes: [
    { key: "build", value: buildNumber },
    { key: "platform", value: "web" },
    { key: "testingType", value: "e2e" }
  ],
  description: 'TK-UI Flaky Test Cases using Playwright Automation Suite',
  launchId: process.env.RP_LAUNCH_ID,
  includeTestSteps: true,
  skippedIssue: false,
  restClientConfig: {
    timeout: 0,
  },
};

export default config;  
