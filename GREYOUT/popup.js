/**
 * BLACKOUT GREYOUT MODE - Popup Script
 */

document.addEventListener('DOMContentLoaded', async () => {
  const statusEl = document.getElementById('status');
  const pageStatusEl = document.getElementById('page-status');
  const interceptedEl = document.getElementById('intercepted');

  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      statusEl.textContent = 'No tab';
      statusEl.className = 'status-value inactive';
      return;
    }

    // Check if Greyout is active on this page
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_STATS' });

      if (response?.active) {
        statusEl.textContent = 'ACTIVE';
        statusEl.className = 'status-value active';
        pageStatusEl.textContent = 'Protected';
        pageStatusEl.className = 'status-value active';

        if (response.stats) {
          interceptedEl.textContent = response.stats.interceptedRequests || '0';
        }
      } else {
        statusEl.textContent = 'ACTIVE';
        statusEl.className = 'status-value active';
        pageStatusEl.textContent = 'Monitoring';
        pageStatusEl.className = 'status-value';
      }
    } catch {
      // Content script not responding (new tab, chrome:// page, etc.)
      statusEl.textContent = 'ACTIVE';
      statusEl.className = 'status-value active';
      pageStatusEl.textContent = 'N/A';
      pageStatusEl.className = 'status-value inactive';
    }

  } catch (error) {
    console.error('Popup error:', error);
    statusEl.textContent = 'ERROR';
    statusEl.className = 'status-value inactive';
  }
});
