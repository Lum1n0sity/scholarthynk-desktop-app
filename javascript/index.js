document.addEventListener('DOMContentLoaded', () => {

    const api_address = '192.168.5.21';

    const storedToken = localStorage.getItem('authToken');
    const storedTokenObject =  JSON.parse(storedToken);
    const token = storedTokenObject.value;

    const dataToSendInit = { token };

    console.log(dataToSendInit);

    fetch(`http://${api_address}:3000/user/auth`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(dataToSendInit),
    })
    .then(response => response.json())
    .then(data => {
        console.log(data);
        const allowLogin = data.allowLogin;
        const username_storage = document.getElementById('username_view');
        const username = data.username;

        username_storage.textContent = username;
        
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
            isLoggedIn = true;

            loadVocab();

            const data = { value: userToken };
            localStorage.setItem('authToken', JSON.stringify(data));
        }

    })
    .catch(error => {
        console.log('Fetch error: ', error);
    });

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
            const username_storage = document.getElementById('username_view');
            const userToken = data.token;

            username_storage.textContent = username;
            
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
                isLoggedIn = true;
                loadVocab();

                const data = { value: userToken };
                localStorage.setItem('authToken', JSON.stringify(data));
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
            const username_storage = document.getElementById('username_view');
            const userToken = data.token;
            
            username_storage.textContent = username;

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
                isLoggedIn = true;
                loadVocab();

                const data = { value: userToken };
                localStorage.setItem('authToken', JSON.stringify(data));
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

    add_vocab.addEventListener('click', () => {
        const german_word = german_entry.value;
        const english_word = english_entry.value;
    
        const username = document.getElementById('username_view').textContent;
    
        if (isLoggedIn) 
        {
            if (german_word && english_word !== null) 
            {
                const dataToSendAddVocab = { word1: german_word, word2: english_word, username: username };
    
                fetch(`http://${api_address}:3000/vocab/add`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(dataToSendAddVocab),
                })
                .then(response => response.json())
                .then(data => {
                    console.log(data);
                    const added = data.added;
    
                    if (added) 
                    {
                        const formattedText = `${german_word} | ${english_word}`;
                    
                        vocab_list.value += (vocab_list.value ? '\n' : '') + formattedText;
                    }
                    else 
                    {
                        const vocab_message = document.getElementById('warning_vocab_div');
    
                        vocab_message.style.display = 'block';
    
                        const vocab_message_ok = document.getElementById('warning_vocab_ok');
    
                        vocab_message_ok.addEventListener('click', () => {
                            vocab_message.style.display = 'none';
                        });
                    }
                })
                .catch(error => {
                    console.log('Fetch error: ', error);
                });
            }
        }     
        else {
            openLogin();
        }
    });    

    function loadVocab() 
    {
        const username = document.getElementById('username_view').textContent;
    
        const dataToSendLoad = ({ username: username });
    
        fetch(`http://${api_address}:3000/vocab/load`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dataToSendLoad),
        })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            const foundVocab = data.vocabFound;
    
            if (foundVocab)
            {
                const vocab = data.vocab;
    
                const formattedText = vocab.map(pair => `${pair.german} | ${pair.english}`).join('\n');
    
                vocab_list.value = formattedText;
            }
            else
            {
                const error_message = document.getElementById('vocab_load_error');

                error_message.style.display = 'block';

                const reload_button = document.getElementById('try_again');
                const close_error_message = document.getElementById('ok_vocab_load');

                reload_button.addEventListener('click', () => {
                    error_message.style.display = 'none';
                    loadVocab();
                });

                close_error_message.addEventListener('click', () => {
                    error_message.style.display = 'none';
                });
            }
        })
        .catch(error => {
            console.log('Fetch error: ', error);
        });
    }
});