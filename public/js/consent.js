(function () {
  const STORAGE_KEY = 'wtp-consent-preferences';
  const DEFAULT_CONSENT = { ads: false, analytics: false };
  let bannerElement = null;
  let currentConsent = null;
  let adsScriptLoaded = false;

  function loadConsent() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return null;
      }
      const parsed = JSON.parse(stored);
      if (typeof parsed !== 'object') {
        return null;
      }
      return {
        ads: Boolean(parsed.ads),
        analytics: Boolean(parsed.analytics),
        timestamp: parsed.timestamp || Date.now(),
      };
    } catch (error) {
      console.error('コンセント情報の読み込みに失敗:', error);
      return null;
    }
  }

  function persistConsent(consent) {
    const normalized = {
      ads: Boolean(consent.ads),
      analytics: Boolean(consent.analytics),
      timestamp: Date.now(),
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    } catch (error) {
      console.error('コンセント情報の保存に失敗:', error);
    }

    applyConsent(normalized);
  }

  function applyConsent(consent) {
    currentConsent = consent;
    window.__consentState = consent;
    window.dispatchEvent(new CustomEvent('consent:updated', { detail: consent }));
    updateAdSection(consent);
  }

  function updateAdSection(consent) {
    const adSection = document.getElementById('sponsored-area');
    if (!adSection) {
      return;
    }

    if (consent.ads) {
      adSection.classList.add('active');
      loadAdSense();
    } else {
      adSection.classList.remove('active');
    }
  }

  function loadAdSense() {
    if (adsScriptLoaded) {
      triggerAdsRender();
      return;
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3586299042568120';
    script.crossOrigin = 'anonymous';
    script.dataset.adsbygoogleLoaded = 'true';
    script.onload = () => {
      adsScriptLoaded = true;
      triggerAdsRender();
    };
    script.onerror = (error) => {
      console.error('AdSenseスクリプトの読み込みに失敗:', error);
    };
    document.head.appendChild(script);
  }

  function triggerAdsRender() {
    window.adsbygoogle = window.adsbygoogle || [];
    try {
      window.adsbygoogle.push({});
    } catch (error) {
      console.error('広告の描画に失敗:', error);
    }
  }

  function removeBanner() {
    if (bannerElement) {
      bannerElement.remove();
      bannerElement = null;
    }
  }

  function createToggle(labelText, checked) {
    const wrapper = document.createElement('label');
    wrapper.className = 'consent-toggle';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = checked;

    const label = document.createElement('span');
    label.textContent = labelText;

    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);

    return { wrapper, checkbox };
  }

  function openBanner(showManageImmediately = false) {
    if (bannerElement) {
      if (showManageImmediately) {
        const managePanel = bannerElement.querySelector('.consent-manage-panel');
        if (managePanel) {
          managePanel.classList.add('active');
        }
      }
      return;
    }

    const initial = currentConsent || DEFAULT_CONSENT;

    bannerElement = document.createElement('div');
    bannerElement.className = 'consent-banner';

    const message = document.createElement('p');
    message.innerHTML = '当サイトでは広告表示および利用状況の分析のためにCookie等を使用します。詳細は<a href="/privacy.html">プライバシーポリシー</a>をご確認ください。';
    bannerElement.appendChild(message);

    const actions = document.createElement('div');
    actions.className = 'consent-actions';

    const acceptButton = document.createElement('button');
    acceptButton.className = 'consent-accept';
    acceptButton.textContent = 'すべて許可';
    acceptButton.addEventListener('click', () => {
      persistConsent({ ads: true, analytics: true });
      removeBanner();
    });

    const rejectButton = document.createElement('button');
    rejectButton.className = 'consent-reject';
    rejectButton.textContent = '必要なものだけ';
    rejectButton.addEventListener('click', () => {
      persistConsent({ ads: false, analytics: false });
      removeBanner();
    });

    const manageButton = document.createElement('button');
    manageButton.className = 'consent-manage';
    manageButton.textContent = '詳細設定';

    actions.appendChild(rejectButton);
    actions.appendChild(acceptButton);
    actions.appendChild(manageButton);
    bannerElement.appendChild(actions);

    const managePanel = document.createElement('div');
    managePanel.className = 'consent-manage-panel';

    const adsToggle = createToggle('広告とパーソナライズを許可', initial.ads);
    const analyticsToggle = createToggle('解析（Firebase Analytics）を許可', initial.analytics);

    const saveButton = document.createElement('button');
    saveButton.className = 'consent-save';
    saveButton.textContent = '設定を保存';
    saveButton.addEventListener('click', () => {
      persistConsent({
        ads: adsToggle.checkbox.checked,
        analytics: analyticsToggle.checkbox.checked,
      });
      removeBanner();
    });

    managePanel.appendChild(adsToggle.wrapper);
    managePanel.appendChild(analyticsToggle.wrapper);
    managePanel.appendChild(saveButton);

    manageButton.addEventListener('click', () => {
      managePanel.classList.toggle('active');
    });

    bannerElement.appendChild(managePanel);
    document.body.appendChild(bannerElement);

    if (showManageImmediately) {
      managePanel.classList.add('active');
    }
  }

  function bootstrap() {
    const stored = loadConsent();
    if (stored) {
      applyConsent(stored);
    } else {
      openBanner();
    }

    const settingsLink = document.getElementById('consent-settings-link');
    if (settingsLink) {
      settingsLink.addEventListener('click', (event) => {
        event.preventDefault();
        openBanner(true);
      });
    }
  }

  document.addEventListener('DOMContentLoaded', bootstrap);
})();
