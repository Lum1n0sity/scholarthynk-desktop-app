const fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');
const Store = require('electron-store');
const i18next = require('i18next');
const fsBackend = require('i18next-fs-backend');
const { checkPrimeSync } = require('crypto');

document.addEventListener('DOMContentLoaded', async () => {
    // * IMPORTANT variable selection
    const store = new Store();
    const api_addr = "http://192.168.5.21:3000";
    const root = document.documentElement;

    // * Load dark/light mode:

    function switchAppearance()
    {
        const mode = store.get('mode');

        if (mode == null)
        {
            root.style.setProperty('--background', '#161616');
            root.style.setProperty('--primary', '#2F2F2F');
            root.style.setProperty('--selected-primary', '#454545c7');
            root.style.setProperty('--text-color', '#ffffff');
            root.style.setProperty('--alt-primary', '#1C1C1C');
        }
        else
        {
            if (mode === 'light')
            {
                root.style.setProperty('--background', '#E0E0E0');
                root.style.setProperty('--primary', '#CCCCCC');
                root.style.setProperty('--selected-primary', '#A0A0A0C7');
                root.style.setProperty('--text-color', '#000000');
                root.style.setProperty('--alt-primary', '#D8D8D8');
            }
            else
            {
                root.style.setProperty('--background', '#161616');
                root.style.setProperty('--primary', '#2F2F2F');
                root.style.setProperty('--selected-primary', '#454545c7');
                root.style.setProperty('--text-color', '#ffffff');
                root.style.setProperty('--alt-primary', '#1C1C1C');
            }
        }
    }

    switchAppearance();

    // * Load language:
    
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

    // * Get dummy password:

    const username = store.get('username');

    const dataToSendDisplayPassword = ({ username: username });

    fetch(`${api_addr}/user/display/password`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(dataToSendDisplayPassword)
    })
    .then(response => response.json())
    .then(data => {
        const password_edit = document.getElementById('password_edit');

        password_edit.value = data.dummy;
    })
    .catch(error => {
        console.error('Fetch error: ', error);
    });

    // * Load username:

    const username_display = document.getElementById('username');
    username_display.textContent = username;

    const username_edit = document.getElementById('username_edit');
    username_edit.textContent = username;

    // * Assign html elements:

    const close_settings = document.getElementById('close_settings');

    const light_mode = document.getElementById('light_mode');
    const dark_mode = document.getElementById('dark_mode');
    const lang_save = document.getElementById('lang_save');

    const background = document.getElementById('background');

    const account_remove_btn = document.getElementById('account_remove_btn');
    const warning_account = document.getElementById('warning_account');
    const cancel_delete = document.getElementById('cancel_delete');
    const delete_delete = document.getElementById('delete_delete');

    const ok_404 = document.getElementById('ok_404');
    const ok_500 = document.getElementById('ok_500');

    const username_edit_btn = document.getElementById('username_edit_btn');
    const edit_username = document.getElementById('edit_username');
    const cancel_edit_username = document.getElementById('cancel_edit_username');
    const change_edit_username = document.getElementById('change_edit_username');
    const username_409 = document.getElementById('username_409');

    const password_edit_btn = document.getElementById('password_edit_btn');

    let updated = false;

    // * Settings navbar:

    close_settings.addEventListener('click', (event) => {
        event.preventDefault();

        window.location.href = '../Home/index.html'; 
    });

    // * Appearance; lang selection and dark/light mode switch:

    lang_save.addEventListener('click', () => {
        const selectedLang = document.getElementById('lang_select').value;

        i18next.changeLanguage(selectedLang, (err, t) => {
            if (err) {
              console.error('Error changing language:', err);
              return;
            }

            updateUILanguage();

            store.set('lang', selectedLang);
        });
    });

    light_mode.addEventListener('click', () => {
        store.set('mode', 'light');
        switchAppearance();
    });

    dark_mode.addEventListener('click', () => {
        store.set('mode', 'dark');
        switchAppearance();
    });

    // * Account; account removal, username/password change and password request:

    account_remove_btn.addEventListener('click', () => {
        warning_account.style.display = 'block';
        background.style.display = 'block';
    });

    cancel_delete.addEventListener('click', () => {
        warning_account.style.display = 'none';
        background.style.display = 'none';
    });

    delete_delete.addEventListener('click', () => {        
        const dataToSendDeleteUser = ({ username: username });

        fetch(`${api_addr}/user/delete`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dataToSendDeleteUser)
        })
        .then(response => {
            if (response.status == 500)
            {
                warning_account.style.display = 'none';
                
                const error_delete_500 = document.getElementById('error_delete_500');

                error_delete_500.style.display = 'block';
            }
            else if (response.status == 404)
            {
                warning_account.style.display = 'none';
                
                const error_delete_404 = document.getElementById('error_delete_404');

                error_delete_404.style.display = 'block';
            }

            return response.json();
        })
        .then(data => {
            const deleted = data.userDeleted;
            const userNotFound = data.userFound;

            if (deleted && !userNotFound)
            {
                warning_account.style.display = 'none';
                background.style.display = 'none';

                store.set('authToken', null);
                store.set('loggedIn', false);
                
                window.location.href = '../Login/login.html';
            }
            else if (userNotFound)
            {
                const error_delete_404 = document.getElementById('error_delete_404');

                error_delete_404.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Fetch error: ', error);
        });
    });

    ok_404.addEventListener('click', () => {
        const error_delete_404 = document.getElementById('error_delete_404');

        error_delete_404.style.display = 'none';
        background.style.display = 'none';
    });

    ok_500.addEventListener('click', () => {
        const error_delete_500 = document.getElementById('error_delete_500');

        error_delete_500.style.display = 'none';
        background.style.display = 'none';
    });

    username_edit_btn.addEventListener('click', () => {
        edit_username.style.display = 'block';
        background.style.display = 'block';
    });

    cancel_edit_username.addEventListener('click', () => {
        edit_username.style.display = 'none';
        background.style.display = 'none';
    })

    change_edit_username.addEventListener('click', () => {
        const new_username = document.getElementById('new_username').value;

        const dataToSendNewUsername = ({ newUsername: new_username, oldUsername: username });

        fetch(`${api_addr}/user/change/username`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dataToSendNewUsername)
        })
        .then(response => {
            if (response.status == 409)
            {
                username_409.style.display = 'block';
            }
            else if (response.ok)
            {
                updated = true;
            }
        })
        .then(data => {
            if (updated)
            {
                edit_username.style.display = 'none';
                username_409.style.display = 'none';
                background.style.display = 'none';

                username_display.textContent = new_username;
                username_edit.textContent = new_username;
                store.set('username', new_username);
                updated = false;
            }
        })
        .catch(error => {
            console.error('Fetch error: ', error);
        });
    });

    // * Password reset:

    password_edit_btn.addEventListener('click', () => {
        const dataToSendStartReset = ({ username: username })

        fetch(`${api_addr}/user/reset-pw-start`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dataToSendStartReset)
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
        })
        .catch(error => {
            console.error('Fetch error: ', error);
        });
    });
}); 