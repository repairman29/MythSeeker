// Quick fix for undefined campaign ID issue
// Run this in browser console if you encounter /campaigns/undefined

console.log('Applying campaign ID fix...');

// Check current URL
const currentPath = window.location.pathname;
console.log('Current path:', currentPath);

if (currentPath.includes('/campaigns/undefined')) {
  console.log('Detected undefined campaign ID, attempting to fix...');
  
  // Try to find campaign data in localStorage
  const savedCampaigns = JSON.parse(localStorage.getItem('mythseeker_campaigns') || '[]');
  console.log('Found campaigns in localStorage:', savedCampaigns);
  
  if (savedCampaigns.length > 0) {
    // Get the most recent campaign
    const latestCampaign = savedCampaigns[savedCampaigns.length - 1];
    console.log('Latest campaign:', latestCampaign);
    
    if (latestCampaign && latestCampaign.id) {
      // Redirect to the correct campaign URL
      const correctUrl = `/campaigns/${latestCampaign.id}`;
      console.log('Redirecting to:', correctUrl);
      window.history.replaceState({}, '', correctUrl);
      window.location.reload();
    }
  } else {
    console.log('No campaigns found, redirecting to campaigns list');
    window.history.replaceState({}, '', '/campaigns');
    window.location.reload();
  }
}

console.log('Campaign ID fix applied'); 