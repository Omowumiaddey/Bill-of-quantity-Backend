// Install: npm install sib-api-v3-sdk
const dotenv = require('dotenv');
dotenv.config();

const SibApiV3Sdk = require('sib-api-v3-sdk');

async function createCampaign() {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    console.error('Missing BREVO_API_KEY in environment. Set BREVO_API_KEY and retry.');
    process.exitCode = 1;
    return;
  }

  // Configure API key (use env var in production)
  const defaultClient = SibApiV3Sdk.ApiClient.instance;
  defaultClient.authentications['api-key'].apiKey = apiKey;

  const apiInstance = new SibApiV3Sdk.EmailCampaignsApi();

  const campaign = new SibApiV3Sdk.CreateEmailCampaign();
  campaign.name = process.env.CAMPAIGN_NAME || 'Campaign sent via the API';
  campaign.subject = process.env.CAMPAIGN_SUBJECT || 'My subject';
  // Use a valid sender email/name registered in your Brevo account
  campaign.sender = {
    name: process.env.CAMPAIGN_SENDER_NAME || 'From name',
    email: process.env.CAMPAIGN_SENDER_EMAIL || 'no-reply@example.com'
  };
  campaign.type = 'classic';
  campaign.htmlContent = process.env.CAMPAIGN_HTML || '<p>Example campaign body.</p>';

  // Use real list IDs from your Brevo account or set env var as comma-separated values
  const listIdsEnv = process.env.CAMPAIGN_LIST_IDS || '';
  const listIds = listIdsEnv.split(',').map(s => s.trim()).filter(Boolean).map(Number);
  if (listIds.length === 0) {
    console.error('Missing CAMPAIGN_LIST_IDS environment variable (comma-separated list IDs).');
    process.exitCode = 1;
    return;
  }
  campaign.recipients = { listIds };

  // Optional: schedule in 1 hour (ISO 8601). Remove to create unscheduled campaign.
  if (process.env.CAMPAIGN_SCHEDULE_IN_HOURS) {
    const hours = Number(process.env.CAMPAIGN_SCHEDULE_IN_HOURS) || 1;
    campaign.scheduledAt = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
  }

  try {
    const data = await apiInstance.createEmailCampaign(campaign);
    console.log('API called successfully. Returned data:', data);
    return data;
  } catch (error) {
    console.error('createEmailCampaign error:', error && (error.body || error));
    process.exitCode = 1;
    return null;
  }
}

// Run when executed directly
if (require.main === module) {
  createCampaign().catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });
}

module.exports = { createCampaign };
