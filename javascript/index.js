document.addEventListener('DOMContentLoaded', () => {
    const login_button = document.getElementById('login_button');
    const user_button = document.getElementById('user_logged_in_bg');
    const close_login = document.getElementById('close_login');
    const close_register = document.getElementById('close_register');

    const loginField = document.getElementById('login_div');
    const registerField = document.getElementById('register_div');

    const switch_lo = document.getElementById('switch_lo');
    const switch_rg = document.getElementById('switch_rg');

    const viewPwLo = document.getElementById('password_view_lo');
    const viewPwRg = document.getElementById('password_view_rg');

    const unviewPwLo = document.getElementById('password_unview_lo');
    const unviewPwRg = document.getElementById('password_unview_rg');

    const login = document.getElementById('login');
    const register = document.getElementById('register');

    const add_vocab = document.getElementById('add_vocab');
    const german_entry = document.getElementById('german-in');
    const english_entry = document.getElementById('english-in');
    const vocab_list = document.getElementById('vocab_list');

    const api_address = '192.168.5.21';

    let isLoggedIn = false;

    login_button.addEventListener('click', () => {
        openLogin();
    });

    close_login.addEventListener('click', () => {
        closeLogin();
    });

    close_register.addEventListener('click', () => {
        closeRegister();
    });

    switch_lo.addEventListener('click', () => {
        loginField.style.display = 'none';
        registerField.style.display = 'grid';
        close_register.style.display = 'block';
        close_login.style.display = 'none';
    });

    switch_rg.addEventListener('click', () => {
        registerField.style.display = 'none';
        loginField.style.display = 'grid';
        close_register.style.display = 'none';
        close_login.style.display = 'block';
    });

    viewPwLo.addEventListener('click', () => {
        const pw_in = document.getElementById('password_input_lo');
        viewPassword(pw_in, viewPwLo, unviewPwLo);
    });

    unviewPwLo.addEventListener('click', () => {
        const pw_in = document.getElementById('password_input_lo');
        unviewPassword(pw_in, viewPwLo, unviewPwLo);
    });

    viewPwRg.addEventListener('click', () => {
        const pw_in = document.getElementById('password_input_rg');
        viewPassword(pw_in, viewPwRg, unviewPwRg);
    });

    unviewPwRg.addEventListener('click', () => {
        const pw_in = document.getElementById('password_input_rg');
        unviewPassword(pw_in, viewPwRg, unviewPwRg);
    })

    login.addEventListener('click', () => {
        sendLogin();
    });

    register.addEventListener('click', () => {
        sendRegister();
    });

    function openLogin()
    {
        const login_field = document.getElementById('login_div');
        const list_div = document.getElementById('list_div');

        login_field.style.display = 'grid';
        list_div.style.display = 'none';
        close_login.style.display = 'block';
    }

    function closeLogin()
    {
        const login_field = document.getElementById('login_div');
        const list_div = document.getElementById('list_div');

        login_field.style.display = 'none';
        list_div.style.display = 'block';
        close_login.style.display = 'none';
    }

    function closeRegister()
    {
        const register_field = document.getElementById('register_div');
        const list_div = document.getElementById('list_div');

        register_field.style.display = 'none';
        list_div.style.display = 'block';
        close_register.style.display = 'none';
    }

    function viewPassword(password_input, view_button, unview_button)
    {
        password_input.type = 'text';
        view_button.style.display = 'none';
        unview_button.style.display = 'block';
    }

    function unviewPassword(password_input, view_button, unview_button)
    {
        password_input.type = 'password';
        view_button.style.display = 'block';
        unview_button.style.display = 'none';
    }

    function sendLogin()
    {
        const username = document.getElementById('username_input_lo').value;
        const password = document.getElementById('password_input_lo').value;

        dataToSendLogin = ({ username: username, password: password });

        fetch(`http://${api_address}:3000/user/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dataToSendLogin),
        })
        .then (response => {
            const login_error_message = document.getElementById('error_lo');

            if (response.status === 401)
            {
                login_error_message.style.display = 'block';
                return;
            }

            return response.json();
        })
        .then(data => {
            console.log(data);

            const allowLogin = data.allowLogin;
            
            if (allowLogin == true)
            {
                login_button.style.display = 'none';
                user_button.style.display = 'block';
                loginField.style.display = 'none';
                registerField.style.display = 'none';
                close_login.style.display = 'none';
                close_register.style.display = 'none';
                list_div.style.display = 'block';
                displayLoginMessage();
            }
        })
        .catch(error => {
            console.log('Fetch error: ', error);
        });
    }

    function sendRegister()
    {
        const username = document.getElementById('username_input_rg').value;
        const password = document.getElementById('password_input_rg').value;

        dataToSendRegister = ({ username: username, password: password });

        fetch(`http://${api_address}:3000/user/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dataToSendRegister),
        })
        .then (response => {
            const register_error_message = document.getElementById('error_rg');

            if (response.status === 401)
            {
                register_error_message.style.display = 'block';
                return;
            }

            return response.json();
        })
        .then(data => {
            console.log(data);

            const accountCreated = data.accountCreated;
            
            if (accountCreated == true)
            {
                login_button.style.display = 'none';
                user_button.style.display = 'block';
                loginField.style.display = 'none';
                registerField.style.display = 'none';
                close_login.style.display = 'none';
                close_register.style.display = 'none';
                list_div.style.display = 'block';
                displayLoginMessage();
            }
        })
        .catch(error => {
            console.log('Fetch error: ', error);
        });
    }

    function displayLoginMessage()
    {
        const message = document.getElementById('logged_in_message');

        message.style.right = '5vw';
        message.style.transition = '.5s';
        setTimeout(function() {
            message.style.right = '-15vw';
          }, 5000);
    }
});