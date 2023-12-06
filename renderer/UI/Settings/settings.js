const fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const i18next = require('i18next');
const fsBackend = require('i18next-fs-backend');

document.addEventListener('DOMContentLoaded', async () => {
    const store = new Store();
    const api_addr = "http://192.168.5.21:3000";

    function updateUILanguage() 
    {
        document.querySelectorAll('[data-i18n]').forEach((element) => {
            const key = element.getAttribute('data-i18n');
            const attribute = element.getAttribute('data-i18n-attr') || 'textContent';

            if (attribute === 'placeholder') 
            {
                  element.setAttribute(attribute, i18next.t(key));
            }
            else if (attribute === 'textContent')
            {
                  element.textContent = i18next.t(key);
            }
            else 
            {
                  element[attribute] = i18next.t(key);
            }
        });
    }

    const storedLang = store.get('lang') || 'en';

    await i18next
    .use(fsBackend)
    .init({
      lng: storedLang,
      fallbackLng: 'en',
      backend: {
        loadPath: `${__dirname}/../../Translation/{{lng}}.yaml`
      }
    }, 
    (err, t) => {
        if (err) 
        {
              console.error('Error initializing i18next:', err);
              return;
        }

        updateUILanguage();
    });

    const close_settings = document.getElementById('close_settings');

    close_settings.addEventListener('click', (event) => {
        event.preventDefault();

        window.location.href = '../Home/index.html'; 
    });
}); 