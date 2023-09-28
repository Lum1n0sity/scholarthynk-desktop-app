const fs = require('fs');
const { ipcRenderer, remote } = require('electron');

document.addEventListener('DOMContentLoaded', () => {

    const api_address = '192.168.5.21';

    let canConnectToServer = true;
    let timeoutId;

    let offlineInterval;
    let isOffline = true;
    let isOffline_MessageDisplayed = false;
    let offlineFilePath = null;

    const connection_error = document.getElementById('error_login');

    const abortControllerInit = new AbortController();
    const signal = abortControllerInit.signal;

    let latestRequest = null;

    const storedToken = localStorage.getItem('authToken');
    if (storedToken !== null && !isOffline) {
        const storedTokenObject = JSON.parse(storedToken);
        const token = storedTokenObject.value;

        const dataToSendInit = { token };

        console.log(dataToSendInit);

        latestRequest = "Init";

        timeoutId = setTimeout(function () {
            if (!isOffline_MessageDisplayed)
            {
                displayConnectionError();
            }

            abortControllerInit.abort();
        }, 30000);

        fetch(`http://${api_address}:3000/user/auth`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dataToSendInit),
        })
        .then(response => {
            if (signal.aborted)
            {
                console.log('Request was canceled');
                return Promise.reject('Request was canceled');                
            }

            return response.json();
        })
        .then(data => {
            clearTimeout(timeoutId);

            console.log(data);
            const allowLogin = data.allowLogin;
            const username_storage = document.getElementById('username_view');
            const username = data.username;

            username_storage.textContent = username;

            if (allowLogin == true) {
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
            displayConnectionError();
        });
    }

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
    const delete_vocab = document.getElementById('delete_vocab');
    const german_entry = document.getElementById('german-in');
    const english_entry = document.getElementById('english-in');
    const vocab_list = document.getElementById('vocab_list');
    const delete_vocab_win = document.getElementById('delete_vocab_div');
    const delete_vocab_win_btn = document.getElementById('delete');
    const close_vocab_win = document.getElementById('close_delete');

    const user_info_button_container = document.getElementById('user_info_buttons');
    const logout_button = document.getElementById('logout');
    const settings_button = document.getElementById('settings');

    const try_again_login = document.getElementById('try_again_login');
    const offline_login = document.getElementById('offline_login');

    const offline_toggle_checkbox = document.getElementById('toggleSwitch_offline');
    const offline_toggle = document.getElementById('offline_toggle');

    let isLoggedIn = false;
    let isUserInfoOpen = false;

    offlineInterval = setInterval(() => {
      handleOffline();
    }, 1000);

    function startOfflineCheckInterval() {
      offlineInterval = setInterval(() => {
        handleOffline();
      }, 1000);
    }

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
        const abortController = new AbortController();
        const signal = abortController.signal;

        timeoutId = setTimeout(function () {
            if (!isOffline_MessageDisplayed)
            {
                displayConnectionError();
            }

            abortController.abort();
        }, 30000);

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
            else if (signal.aborted)
            {
                console.log('Request was canceled');
                return Promise.reject('Request was canceled');                
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
            displayConnectionError();
        });

        latestRequest = "Login";
    }

    function sendRegister()
    {
        const abortController = new AbortController();
        const signal = abortController.signal;

        timeoutId = setTimeout(function () {
            if (!isOffline_MessageDisplayed)
            {
                displayConnectionError();
            }

            abortController.abort();
        }, 30000);

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
            else if (signal.aborted) {
                console.log('Request was canceled');
                return Promise.reject('Request was canceled');
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

            latestRequest = "Register";
        })
        .catch(error => {
            console.log('Fetch error: ', error);
            displayConnectionError();
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
            if (german_word && english_word !== null && isOffline == false) 
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
        else if (isOffline) 
        {
            if (offlineFilePath !== null)
            {
                try 
                {  
                    const german_word = document.getElementById('german-in').value;
                    const english_word = document.getElementById('english-in').value;

                    const inputData = `${german_word} | ${english_word} \n`;

                    const filePath = offlineFilePath;

                    fs.appendFile(filePath, inputData, 'utf8', (err) => {
                        if (err) 
                        {
                          console.error('Error writing to the file:', err);
                          return;
                        }
                      });

                      fs.readFile(filePath, 'utf8', (err, data) => {
                          if (err)
                          {
                              console.error('Error reading file: ', err);
                              return;
                          }

                          vocab_list.textContent = data;
                      });

                      console.log('Data saved to the file successfully.');
                } 
                catch (error) 
                {
                  console.error('Error writing to file:', error);
                }
            }
        }
        else
        {
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
    
            latestRequest = "LoadVocab";

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

    user_button.addEventListener('click', (event) => {
        event.stopPropagation();
        if (!isUserInfoOpen) 
        {
            user_info_button_container.style.display = 'block';
            isUserInfoOpen = true;
        }
    });
    
    document.addEventListener('click', (event) => {
        if (isUserInfoOpen) 
        {
            const isClickInsideDiv = user_info_button_container.contains(event.target);
            if (!isClickInsideDiv) 
            {
                user_info_button_container.style.display = 'none';
                isUserInfoOpen = false;
            }
        }
    });
    
    logout_button.addEventListener('click', () => {
        const username_storage = document.getElementById('username_view');

        username_storage.textContent = null;
        
        login_button.style.display = 'block';
        user_button.style.display = 'none';
        user_info_button_container.style.display = 'none';
        isLoggedIn = false;
        localStorage.removeItem('authToken');
    });

    function tryAutoLogin()
    {
        const storedToken = localStorage.getItem('authToken');
        if (storedToken !== null)
        {
            const storedTokenObject = JSON.parse(storedToken);
            const token = storedTokenObject.value;
    
            const dataToSendInit = { token };
    
            console.log(dataToSendInit);
    
            latestRequest = "Init";

            timeoutId = setTimeout(function () {
                if (!isOffline_MessageDisplayed)
                {
                    displayConnectionError();
                }
    
                abortControllerInit.abort();
            }, 30000);
    
            fetch(`http://${api_address}:3000/user/auth`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dataToSendInit),
            })
            .then(response => {
                if (signal.aborted)
                {
                    console.log('Request was canceled');
                    return Promise.reject('Request was canceled');                
                }
    
                return response.json();
            })
            .then(data => {
                clearTimeout(timeoutId);
    
                console.log(data);
                const allowLogin = data.allowLogin;
                const username_storage = document.getElementById('username_view');
                const username = data.username;
    
                username_storage.textContent = username;
    
                if (allowLogin == true) {
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
                displayConnectionError();
            });
        }
    }

    offline_toggle.addEventListener('change', function () 
    {
      if (this.checked) 
      {
        isOffline = true;
        isLoggedIn = false;
        console.log('isOffline', isOffline);
      } 
      else 
      {
        isOffline = false;
        console.log('isOffline', isOffline);
        unloadVocab();
        login_button.style.display = 'block';
        user_button.style.display = 'none';
        tryAutoLogin();
      }
    });

    function displayConnectionError()
    {
        console.log('Request timeout');
        canConnectToServer = false;
        const list_div = document.getElementById('list_div');
        const login_div = document.getElementById('login_div');
        const register_div = document.getElementById('register_div');
        const close_register = document.getElementById('close_register');
        const close_login = document.getElementById('close_login');
        
        connection_error.style.display = 'block';
        list_div.style.display = 'none';
        register_div.style.display = 'none';
        login_div.style.display = 'none';
        close_login.style.display = 'none';
        close_register.style.display = 'none';
        add_vocab.style.display = 'none';
        delete_vocab.style.display = 'none';
    }

    try_again_login.addEventListener('click', () => {
        console.log('latestRequest', latestRequest);
        if (latestRequest === "Login")
        {
            console.log("Try Login Again");
            sendLogin();
        }
        else if (latestRequest === "Register")
        {
            console.log("Try Register Again");
            sendRegister();
        }
        else if (latestRequest === "LoadVocab")
        {
            console.log("Try LoadVocab Again");
            loadVocab();
        }
        else if (latestRequest === "Init")
        {
            console.log("Try Init Again");
            tryAutoLogin();
        }
    });

    offline_login.addEventListener('click', () => {
        connection_error.style.display = 'none';
        displayOfflineMessage();
        isOffline = true;
        isLoggedIn = false;
        loadVocabOffline();
        handleOffline();
        add_vocab.style.display = 'block';
        delete_vocab.style.display = 'block';
    });

    function displayOfflineMessage() 
    {
        const offline_message = document.getElementById('offline_message');

        list_div.style.display = 'block';
        offline_message.style.right = '5vw';
        offline_message.style.transition = '.5s';
        setTimeout(function() {
            offline_message.style.right = '-20vw';
        }, 5000);

        isOffline_MessageDisplayed = true;
    }

    function loadVocabOffline()
    {
        if (offlineFilePath != null)
        {
            try 
            {
                const filePath = offlineFilePath;
    
                fs.readFile(filePath, 'utf8', (err, data) => {
                    if (err)
                    {
                        console.error('Error reading file: ', err);
                        return;
                    }
                    
                    vocab_list.textContent = data;
                });
            } 
            catch (error) 
            {
              console.error('Error writing to file:', error);
            }
        }        
    }

    function unloadVocab()
    {
        vocab_list.textContent = ' ';
    }

    function handleOffline() {
        if (isOffline) {
            clearInterval(offlineInterval);
            
            const offline_toggle_checkbox = document.getElementById('toggleSwitch_offline');
            const offline_toggle = document.getElementById('offline_toggle');
          
            login_button.style.display = 'none';
            user_button.style.display = 'none';

            offline_toggle_checkbox.checked = true;
          
            ipcRenderer.send('open-file-dialog');
          
            ipcRenderer.on('selected-file', (event, filePath) => {
              offlineFilePath = filePath;
              loadVocabOffline();
            });
          
            offline_toggle.addEventListener('change', function () 
            {
              if (this.checked) 
              {
                isOffline = true;
                console.log('isOffline', isOffline);
              } 
              else 
              {
                isOffline = false;
                console.log('isOffline', isOffline);
                unloadVocab();
                login_button.style.display = 'block';
                user_button.style.display = 'none';
                tryAutoLogin();
              }
            });
          
            return;
        }
    }

    delete_vocab.addEventListener('click', () => {
        vocab_list.style.display = 'none';
        
        delete_vocab.style.display = 'none';
        add_vocab.style.display = 'none';
        delete_vocab_win.style.display = 'block';
        close_vocab_win.style.display = 'block'; 
    });

    close_vocab_win.addEventListener('click', () => {
        vocab_list.style.display = 'block';
        delete_vocab.style.display = 'block';
        add_vocab.style.display = 'block';
        delete_vocab_win.style.display = 'none';
        close_vocab_win.style.display = 'none'; 
    });

    delete_vocab_win_btn.addEventListener('click', () => {
        const german_in = document.getElementById('delete_german').value;
        const english_in = document.getElementById('delete_english').value;

        if (german_in && english_in !== null)
        {
            if (isOffline)
            {
                let filePath = offlineFilePath;

                fs.readFile(filePath, 'utf8', (err, data) => {
                    if (err) {
                      console.error('Error reading file:', err);
                      return;
                    }
                    
                    console.log('German in: ', german_in);
                    console.log('English in: ', english_in);

                    const rows = data.split('\n');
                  
                    const updatedRows = [];
                  
                    for (const row of rows) {
                      const rowValues = row.split(' | ');
                  
                      console.log('Row Values', rowValues);

                      if (!(rowValues.includes(german_in) && rowValues.includes(english_in))) {
                        updatedRows.push(row);
                      }
                    }
                  
                    const newContent = updatedRows.join('\n');

                    console.log('New Content', newContent);
                  
                    fs.writeFile(filePath, newContent, 'utf8', (err) => {
                      if (err) {
                        console.error('Error writing to file:', err);
                        return;
                      }
                  
                      console.log('Rows with matching values deleted.');
                    });
                });
            }
        }
    });
});