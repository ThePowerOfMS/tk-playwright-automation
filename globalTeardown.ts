// globalTeardown.ts
import fetch from 'node-fetch';

export default async function globalTeardown() {
  const RP_ENDPOINT = process.env.RP_ENDPOINT;
  const RP_PROJECT = process.env.RP_PROJECT;
  const RP_API_KEY = process.env.RP_API_KEY;
  const RP_LAUNCH_ID = process.env.RP_LAUNCH_ID;

  if (!RP_ENDPOINT || !RP_PROJECT || !RP_API_KEY || !RP_LAUNCH_ID) {
    console.warn('⚠️ Skipping ReportPortal finalization — missing environment variables.');
    return;
  }

  const endTime = new Date().toISOString();
  const payload = {
    launchUuid: RP_LAUNCH_ID,
    endTime
  };

  try {
    const response = await fetch(`${RP_ENDPOINT}/${RP_PROJECT}/launch/finish`, {
      method: 'PUT',
      headers: {
        'Authorization': `bearer ${RP_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const text = await response.text();
    console.log(`✅ ReportPortal Finalization Response [${response.status}]: ${text}`);
  } catch (error) {
    console.error('❌ Error finalizing ReportPortal launch:', error);
  }
}
