const { ipcRenderer } = require('electron');
const Store = require('electron-store');

document.addEventListener('DOMContentLoaded', () => {
    const api_addr = "http://192.168.5.21:3000";
    const store = new Store();
    const authTokenINIT = store.get('authToken');
    const loggedOut = store.get('loggedOut');
    
    const connection_error = document.getElementById('connection_error');
    const login_error_message = document.getElementById('error_msg');

    const login_container = document.getElementById('login_container');

    if (authTokenINIT != null && loggedOut == false)
    {
        const storedTokenObject = JSON.parse(authTokenINIT);
        const token = storedTokenObject.value;

        const dataToSendAutoLogin = { token };
        connection_error.style.display = 'none';

        fetch(`${api_addr}/user/auth`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dataToSendAutoLogin)
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            const allowLogin = data.allowLogin;
            const username_storage = document.getElementById('username_view');
            const username = data.username;

            if (allowLogin == true) 
            {
                store.set('username', username);                                                                          

                store.set('loggedIn', true);

                window.location.href = '../Home/index.html';
            }
        })
        .catch(error => {
            login_container.style.borderRadius = '10px 0px 0px 0px';
            connection_error.style.display = 'block';
        });
    }

    const sign_in = document.getElementById('login');
    const switch_sign_up = document.getElementById('register_switch');

    const show_pw = document.getElementById('show_pw');
    const hide_pw = document.getElementById('hide_pw');
    const pw_input = document.getElementById('password_input');

    const remember_checkbox = document.getElementById('remember_checkbox');

    let isPWVisible = false;

    show_pw.addEventListener('click', () => {
        if (!isPWVisible)
        {
            pw_input.type = 'text';
            isPWVisible = true;
            show_pw.style.display = 'none';
            hide_pw.style.display = 'block';
        }
    });

    hide_pw.addEventListener('click', () => {
        if (isPWVisible)
        {
            pw_input.type = 'password';
            isPWVisible = false;
            show_pw.style.display = 'block';
            hide_pw.style.display = 'none';
        }
    });

    switch_sign_up.addEventListener('click', (event) => {
        event.preventDefault();

        window.location.href = './Register/register.html';
    });

    sign_in.addEventListener('click', () => {
        const username = document.getElementById('username_input').value;
        const password = document.getElementById('password_input').value;

        connection_error.style.display = 'none';
        login_error_message.style.display = 'none';
        login_container.style.borderRadius = '10px 0px 0px 10px';

        const dataToSendLogin = ({ username: username, password: password });

        fetch(`${api_addr}/user/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dataToSendLogin),
        })
        .then (response => {
            if (response.status === 401)
            {
                login_container.style.borderRadius = '10px 0px 0px 0px';
                login_error_message.style.display = 'block';
                return;
            }

            return response.json();
        })
        .then(data => {
            const allowLogin = data != null ? data.allowLogin : null;
            const userToken = data != null ? data.token : null;

            if (allowLogin != null && userToken != null)
            {
                if (allowLogin == true)
                {
                    store.set('username', username);                                                                          

                    if (remember_checkbox.checked)
                    {                    
                        const data = { value: userToken };
                        store.set('authToken', JSON.stringify(data));
                        store.set('loggedIn', true);
                    }

                    window.location.href = '../Home/index.html';
                }
            }
        })
        .catch(error => {
            console.error('Fetch error: ', error);
            login_container.style.borderRadius = '10px 0px 0px 0px';
            connection_error.style.display = 'block';
        });
    });
});