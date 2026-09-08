// src/utils/openExternalPlayer.js

export const openExternalPlayer = (m3u8URL) => {
  const isAndroid = /Android/i.test(navigator.userAgent);
  
  if (!isAndroid) {
    alert("This feature is only available on Android devices.\nPlease use an Android phone or TV.");
    return;
  }

  let cleanUrl = m3u8URL;
  let scheme = 'http'; 

  // HTTP သို့မဟုတ် HTTPS ဖြစ်/မဖြစ် စစ်ဆေးပြီး Scheme ကို သတ်မှတ်ခြင်း
  if (cleanUrl.startsWith('https://')) {
    cleanUrl = cleanUrl.replace(/^https:\/\//, '');
    scheme = 'https';
  } else if (cleanUrl.startsWith('http://')) {
    cleanUrl = cleanUrl.replace(/^http:\/\//, '');
    scheme = 'http';
  }

  const playStoreUrl = "https://play.google.com/store/apps/details?id=com.genuine.leone";
  
  // ✅ Chrome/TWA က Support လုပ်တဲ့ Fallback URL Parameter
  const encodedFallback = encodeURIComponent(playStoreUrl);

  // ✅ Iframe မသုံးဘဲ Direct Intent URL တည်ဆောက်ခြင်း
  const intentURL = `intent://${cleanUrl}#Intent;scheme=${scheme};type=video/*;package=com.genuine.leone;S.browser_fallback_url=${encodedFallback};end`;

  // ✅ Hidden Iframe အစား Direct Navigation ကို သုံးပါ (TWA မှာ အလုပ်လုပ်ပါတယ်)
  window.location.href = intentURL;
};