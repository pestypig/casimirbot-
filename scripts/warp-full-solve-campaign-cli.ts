import { CAMPAIGN_USAGE, runCampaignCli } from './warp-full-solve-campaign.js';

runCampaignCli()
  .then((payload) => {
    console.log(JSON.stringify(payload, null, 2));
  })
  .catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(message);
    if (message.includes('Invalid --wave value') || message.includes('Invalid --seed value')) {
      console.error(CAMPAIGN_USAGE);
    }
    process.exit(1);
  });
