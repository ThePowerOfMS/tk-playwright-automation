import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
const fetch = require('node-fetch') as typeof import('node-fetch');

export default async function globalSetup() {
  const RP_ENDPOINT = process.env.RP_ENDPOINT;
  const RP_PROJECT = process.env.RP_PROJECT;
  const RP_API_KEY = process.env.RP_API_KEY;

  if (!RP_ENDPOINT || !RP_PROJECT || !RP_API_KEY) {
    console.warn('Skipping ReportPortal launch start — missing env vars.');
    return;
  }

  // If RP_LAUNCH_ID already set by Jenkins, skip generating new one
  const RP_LAUNCH_ID = process.env.RP_LAUNCH_ID || uuidv4();
  const launchName = process.env.RP_LAUNCH_NAME || `Playwright Tests - ${new Date().toISOString()}`;

  const payload = {
    uuid: RP_LAUNCH_ID,
    name: launchName,
    startTime: new Date().toISOString(),
    mode: 'DEFAULT'
  };

  try {
    const response = await fetch(`${RP_ENDPOINT}/${RP_PROJECT}/launch`, {
      method: 'POST',
      headers: {
        'Authorization': `bearer ${RP_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const responseText = await response.text();
    console.log(`Started RP launch: ${response.status} - ${responseText}`);

    // Save UUID for other shards
    fs.writeFileSync(path.resolve('.rp-env'), `RP_LAUNCH_ID=${RP_LAUNCH_ID}\n`, 'utf-8');
    process.env.RP_LAUNCH_ID = RP_LAUNCH_ID;
  } catch (err) {
    console.error('Error starting ReportPortal launch:', err);
  }
}
