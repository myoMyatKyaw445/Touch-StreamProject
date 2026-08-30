// src/utils/openExternalPlayer.js

export const openExternalPlayer = (m3u8URL) => {
  const isAndroid = /Android/i.test(navigator.userAgent);
  
  if (!isAndroid) {
    alert("This feature is only available on Android devices.\nPlease use an Android phone or TV.");
    return;
  }

  let cleanUrl = m3u8URL;
  let scheme = 'http'; // Default scheme

  // HTTP သို့မဟုတ် HTTPS ဖြစ်/မဖြစ် စစ်ဆေးပြီး Scheme ကို သတ်မှတ်ခြင်း
  if (cleanUrl.startsWith('https://')) {
    cleanUrl = cleanUrl.replace(/^https:\/\//, '');
    scheme = 'https';
  } else if (cleanUrl.startsWith('http://')) {
    cleanUrl = cleanUrl.replace(/^http:\/\//, '');
    scheme = 'http';
  }

  // ✅ Dynamic Scheme ဖြင့် Intent URL တည်ဆောက်ခြင်း
  const intentURL = `intent://${cleanUrl}#Intent;scheme=${scheme};type=video/*;package=com.genuine.leone;end`;
  const playStoreUrl = "https://play.google.com/store/apps/details?id=com.genuine.leone";

  let appDetected = false;
  let iframe = null;

  const cleanup = () => {
    if (iframe && iframe.parentNode) {
      iframe.parentNode.removeChild(iframe);
    }
    document.removeEventListener('visibilitychange', handleVisibilityChange);
  };

  const handleVisibilityChange = () => {
    if (document.hidden || document.visibilityState === 'hidden') {
      appDetected = true;
      cleanup();
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityChange);

  iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.style.width = '0px';
  iframe.style.height = '0px';
  iframe.style.border = 'none';
  iframe.style.position = 'absolute';
  iframe.style.top = '-9999px';

  try {
    document.body.appendChild(iframe);
    iframe.src = intentURL;
  } catch (e) {
    console.error('Iframe src setting failed:', e);
    cleanup();
    window.location.href = playStoreUrl;
  }

  setTimeout(() => {
    if (!appDetected) {
      cleanup();
      window.location.href = playStoreUrl;
    }
  }, 2500);
};