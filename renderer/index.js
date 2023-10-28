const fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');
const nodemailer = require('nodemailer');
const { clearInterval } = require('timers');
const FuzzySearch = require("fuzzy-search");

document.addEventListener('DOMContentLoaded', () => {

    const api_address = '192.168.5.21';

    let canConnectToServer = true;
    let timeoutId;

    let isOffline = false;
    let isOffline_MessageDisplayed = false;
    let offlineFilePath = null;

    const connection_error = document.getElementById('error_login');

    const abortControllerInit = new AbortController();
    const signal = abortControllerInit.signal;

    let latestRequest = null;

    loadLogs();

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

            hideConnectionError();

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
    const popupBlock = document.getElementById('pop_up_block');

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

    const feedback_win = document.getElementById('feedback_win');
    const feedback_open = document.getElementById('feedback');
    const feedback_close = document.getElementById('close_feedback');
    const feedback_sub = document.getElementById('feedback-sub');
    const problem_sub = document.getElementById('bug-report-sub');
    const feedback_tab = document.getElementById('feedback-win');
    const problem_tab = document.getElementById('bug-report');
    const feedback_send = document.getElementById('feedback-send');
    const report_send = document.getElementById('report');
    const offline_feedback = document.getElementById('offline_feedback');

    const change_log_container = document.getElementById('change_log_container');
    const change_log_open = document.getElementById('change-log-open');
    const change_log_close = document.getElementById('close_log');
    const change_log_bg = document.getElementById('change_log_bg');

    const start_training = document.getElementById('start_training');
    const training_div = document.getElementById('training_con');
    const close_training = document.getElementById('close_training');

    const questionContainer = document.getElementById('question_container');
    const next_button = document.getElementById('next_block');

    const easyMode = document.getElementById('difficulty-display-easy');
    const mediumMode = document.getElementById('difficulty-display-medium');
    const hardMode = document.getElementById('difficulty-display-hard');      

    const doneMode = document.getElementById('difficulty-display-done');

    const easyInputs = [];
    const mediumInputs = [];
    const hardInputs = [];
    const inputsTrainer = [];
    const failedWords = [];

    let isInTrainingMode = false;

    let easyGroups;
    let mediumGroups;
    let hardGroups;
    let currentDifficulty = 'Easy';
    let groupIndex = 0;

    let isFeedbackWinOpen = false;
    let isInFeedbackTab = true;
    let isInProblemTab = false;

    let isLoggedIn = false;
    let isUserInfoOpen = false;

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
        popupBlock.style.display = 'block';
    }

    function closeLogin()
    {
        const login_field = document.getElementById('login_div');
        const list_div = document.getElementById('list_div');

        login_field.style.display = 'none';
        list_div.style.display = 'block';
        close_login.style.display = 'none';
        popupBlock.style.display = 'none';
    }

    function closeRegister()
    {
        const register_field = document.getElementById('register_div');
        const list_div = document.getElementById('list_div');

        register_field.style.display = 'none';
        list_div.style.display = 'block';
        popupBlock.style.display = 'none';
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
                popupBlock.style.display = 'block';
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
            
            hideConnectionError();

            if (allowLogin == true)
            {
                login_button.style.display = 'none';
                user_button.style.display = 'block';
                loginField.style.display = 'none';
                registerField.style.display = 'none';
                close_login.style.display = 'none';
                close_register.style.display = 'none';
                popupBlock.style.display = 'none';
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
                popupBlock.style.display = 'block';
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

            hideConnectionError();

            if (accountCreated == true)
            {
                login_button.style.display = 'none';
                user_button.style.display = 'block';
                loginField.style.display = 'none';
                registerField.style.display = 'none';
                close_login.style.display = 'none';
                close_register.style.display = 'none';
                popupBlock.style.display = 'none';
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
    
                    hideConnectionError();

                    if (added) 
                    {
                        const formattedText = `${german_word} | ${english_word}`;
                    
                        vocab_list.value += (vocab_list.value ? '\n' : '') + formattedText;
                        vocab_list.scrollTop = vocab_list.scrollHeight;
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
                    const difficulty = getDifficulty(english_word);

                    let exists = false;

                    const newData = { german: german_word, english: english_word, difficulty: difficulty };

                    const filePath = offlineFilePath;

                    fs.readFile(filePath, 'utf8', (error, data) => {
                        if (error) 
                        {
                            console.error('Error reading file: ', error);
                            return;
                        }
                    
                        try 
                        {
                            let existingData = JSON.parse(data);
                    
                            exists = existingData.some(item => (
                                item.german === newData.german || item.english === newData.english
                            ))

                            if (!exists)
                            {
                                if (!Array.isArray(existingData)) 
                                {
                                    existingData = [];
                                }
                        
                                existingData.push(newData);
                        
                                const updatedData = JSON.stringify(existingData, null, 2);
                        
                                fs.writeFile(filePath, updatedData, 'utf8', (err) => {
                                    if (err) 
                                    {
                                        console.error(err);
                                    } 
                                    else 
                                    {
                                        console.log('Data inserted');
                                    }
                                })
                                
                                const formattedText = `${german_word} | ${english_word}`;
                    
                                vocab_list.value += (vocab_list.value ? '\n' : '') + formattedText;
                                vocab_list.scrollTop = vocab_list.scrollHeight;
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
                        } 
                        catch (erro) 
                        {
                            console.error('Error parsing JSON:', erro);
                        }
                    });
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

            hideConnectionError();

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
                    unloadVocab();
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
        unloadVocab(); 
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
    
                hideConnectionError();

                if (allowLogin == true) {
                    login_button.style.display = 'none';
                    user_button.style.display = 'block';
                    loginField.style.display = 'none';
                    registerField.style.display = 'none';
                    close_login.style.display = 'none';
                    close_register.style.display = 'none';
                    popupBlock.style.display = 'none';
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

    offline_toggle_checkbox.addEventListener('change', function () 
    {
        if (this.checked) 
        {   
            isOffline = true;
            handleOffline();
        } 
        else 
        {
            isOffline = false;
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
        popupBlock.style.display = 'block';
        list_div.style.display = 'none';
        register_div.style.display = 'none';
        login_div.style.display = 'none';
        close_login.style.display = 'none';
        close_register.style.display = 'none';
        add_vocab.style.display = 'none';
        delete_vocab.style.display = 'none';
    }

    function hideConnectionError()
    {
        canConnectToServer = true;
        const list_div = document.getElementById('list_div');
        const login_div = document.getElementById('login_div');
        const register_div = document.getElementById('register_div');
        const close_register = document.getElementById('close_register');
        const close_login = document.getElementById('close_login');
        
        connection_error.style.display = 'none';
        list_div.style.display = 'block';
        add_vocab.style.display = 'block';
        delete_vocab.style.display = 'block';
        popupBlock.style.display = 'none';
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
        popupBlock.style.display = 'none';
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
    
                fs.readFile(filePath, 'utf-8', (err, data) => {
                    if (err)
                    {
                        console.error('Error reading file: ', err);
                        return;
                    }
                    
                    try 
                    {
                        const rawData = JSON.parse(data);

                        const processedData = [];
                        
                        rawData.forEach(item => {
                            const germanW = item.german;
                            const englishW = item.english;
                        
                            const wordR = `${germanW} | ${englishW}`;
                            processedData.push(wordR);
                        });

                        const sanitizedData = processedData.map(item => item.replace(/,/g, ''));

                        vocab_list.textContent = sanitizedData.join('\n');
                    }
                    catch(e)
                    {
                        console.error('Error parsing JSON: ', e);
                    }
                });
            } 
            catch (error) 
            {
              console.error('Error reading to file:', error);
            }
        }        
    }

    function unloadVocab()
    {
        vocab_list.textContent = ' ';
    }

    function handleOffline() {
        if (isOffline) {
            try 
            {
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

                ipcRenderer.on('file-dialog-canceled', (event) => {
                    const jsonData = [];

                    const fileName = 'vocab.json';

                    fs.writeFile(fileName, JSON.stringify(jsonData, null, 2), (err) => {
                        if (err) 
                        {
                            console.error('Error writing JSON file:', err);
                        } 
                        else 
                        {
                            offlineFilePath = fileName;
                        }
                    });
                });
            
                offline_toggle_checkbox.addEventListener('change', function () 
                {
                  if (this.checked) 
                  {
                    isOffline = true;
                    isLoggedIn = false;

                    ipcRenderer.send('open-file-dialog');
                
                    ipcRenderer.on('selected-file', (event, filePath) => {
                        offlineFilePath = filePath;
                        loadVocabOffline();
                    });
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
            catch (error) 
            {
                console.error("Error clearing offlineInterval:", error);
            }
        }
        else
        {
            console.log("isOffline = false");
        }
    }

    delete_vocab.addEventListener('click', () => {
        vocab_list.style.display = 'none';
        list_div.style.display = 'none';
        delete_vocab.style.display = 'none';
        add_vocab.style.display = 'none';
        delete_vocab_win.style.display = 'block';
        close_vocab_win.style.display = 'block'; 
        popupBlock.style.display = 'block';
    });

    close_vocab_win.addEventListener('click', () => {
        vocab_list.style.display = 'block';
        list_div.style.display = 'block';
        delete_vocab.style.display = 'block';
        add_vocab.style.display = 'block';
        delete_vocab_win.style.display = 'none';
        close_vocab_win.style.display = 'none'; 
        popupBlock.style.display = 'none';
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
                    if (err) 
                    {
                        console.error('Error reading file:', err);
                        return;
                    }

                    const rows = data.split('\n');

                    const updatedRows = [];
                  
                    for (const row of rows) 
                    {
                        const rowValues = row.split(' | ');

                        if (!(rowValues.includes(german_in) && rowValues.includes(english_in))) 
                        {
                            updatedRows.push(row);
                        }
                    }
                  
                    const newContent = updatedRows.join('\n');

                    console.log('New Content', newContent);
                  
                    fs.writeFile(filePath, newContent, 'utf8', (err) => {
                      if (err) 
                      {
                        console.error('Error writing to file:', err);
                        return;
                      }
                    });

                    vocab_list.textContent = newContent;

                    vocab_list.style.display = 'block';
                    list_div.style.display = 'block';
                    delete_vocab.style.display = 'block';
                    add_vocab.style.display = 'block';
                    delete_vocab_win.style.display = 'none';
                    close_vocab_win.style.display = 'none'; 
                    popupBlock.style.display = 'none';
                });
            }
            else if (!isOffline)
            {
                const username_storage = document.getElementById('username_view');
                const username = username_storage.textContent;

                const dataToSendDeleteVocab = ({ german: german_in, english: english_in, username: username });

                console.log(dataToSendDeleteVocab);

                fetch(`http://${api_address}:3000/vocab/delete`, {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(dataToSendDeleteVocab),
                })
                .then(response => response.json())
                .then(data => {
                    const isDeleted = data.deleted;

                    let valueToRemove = `${german_in} | ${english_in}`;

                    if (isDeleted)
                    {
                        vocab_list.style.display = 'block';
                        list_div.style.display = 'block';
                        delete_vocab.style.display = 'block';
                        add_vocab.style.display = 'block';
                        delete_vocab_win.style.display = 'none';
                        close_vocab_win.style.display = 'none'; 
                        popupBlock.style.display = 'none';

                        let currentValue = vocab_list.value;
                        const lines = currentValue.split('\n');

                        const filteredLines = lines.filter(line => line.trim() !== valueToRemove);

                        currentValue = filteredLines.join('\n');

                        vocab_list.value = currentValue;
                    }
                })
                .catch(error => {
                    console.log('Fetch error: ', error);
                }); 
            }
        }
    });

    offline_feedback.addEventListener('click', () => {
        if (!isFeedbackWinOpen)
        {
            feedback_win.style.display = 'block';
            feedback_sub.style.display = 'block';
            feedback_close.style.display = 'block';
            popupBlock.style.display = 'block';
            
            list_div.style.display = 'none';
            user_info_button_container.style.display = 'none';

            isFeedbackWinOpen = true;
        }
    });

    feedback_open.addEventListener('click', () => {
        if (!isFeedbackWinOpen)
        {
            feedback_win.style.display = 'block';
            feedback_sub.style.display = 'block';
            feedback_close.style.display = 'block';
            popupBlock.style.display = 'block';
            
            list_div.style.display = 'none';
            user_info_button_container.style.display = 'none';

            isFeedbackWinOpen = true;
        }
    });

    feedback_close.addEventListener('click', () => {
        if (isFeedbackWinOpen)
        {
            feedback_win.style.display = 'none';
            feedback_sub.style.display = 'none';
            feedback_close.style.display = 'none';
            popupBlock.style.display = 'none';
            
            list_div.style.display = 'block';

            isFeedbackWinOpen = false; 
        }
    });

    feedback_tab.addEventListener('mouseover', () => {
        if (isInProblemTab)
        {
            feedback_tab.style.backgroundColor = '#151922';
            feedback_tab.style.transition = '.5s';
        }
    });

    feedback_tab.addEventListener('mouseout', () => {
        if (isInProblemTab)
        {
            feedback_tab.style.backgroundColor = '#222b38';
            feedback_tab.style.transition = '.5s';
        }
    });

    feedback_tab.addEventListener('click', () => {
        if (isFeedbackWinOpen && isInProblemTab)
        {
            feedback_sub.style.display = 'block'
            problem_sub.style.display = 'none';

            feedback_tab.style.backgroundColor = '#151922';
            problem_tab.style.backgroundColor = '#222b38';

            isInProblemTab = false;
            isInFeedbackTab = true;
        }
    });

    problem_tab.addEventListener('mouseover', () => {
        if (isInFeedbackTab)
        {
            problem_tab.style.backgroundColor = '#151922';
            problem_tab.style.transition = '.5s';
        }
    });

    problem_tab.addEventListener('mouseout', () => {
        if (isInFeedbackTab)
        {
            problem_tab.style.backgroundColor = '#222b38';
            problem_tab.style.transition = '.5s';
        }
    });

    problem_tab.addEventListener('click', () => {
        if (isFeedbackWinOpen && isInFeedbackTab)
        {
            feedback_sub.style.display = 'none'
            problem_sub.style.display = 'block';

            feedback_tab.style.backgroundColor = '#222b38';
            problem_tab.style.backgroundColor = '#151922';

            isInFeedbackTab = false;
            isInProblemTab = true;
        }
    });

    feedback_send.addEventListener('click', () => {
        const transporter_feedback = nodemailer.createTransport({
           service: 'Outlook' ,
           auth: {
            user: 'vocabTrainer@outlook.com',
            pass: 'n6T</b]+M&fi&T}eq7{$j0vjXIiaoG'
           },
        });

        const feedback_text = document.getElementById('feedback-win-text').value;

        const mailOptions = {
            from: 'vocabTrainer@outlook.com',
            to: 'vocabTrainer@outlook.com',
            subject: 'Feedback',
            text: feedback_text
        };

        transporter_feedback.sendMail(mailOptions, (error) => {
            if (error) 
            {
                console.error('Error sending email:', error);
            } 
            else 
            {
                feedback_win.style.display = 'none';
                feedback_sub.style.display = 'none';
                feedback_close.style.display = 'none';
                popupBlock.style.display = 'none';
                
                list_div.style.display = 'block';
    
                isFeedbackWinOpen = false; 
            }
        });
    });

    report_send.addEventListener('click', () => {
        const transporter_report = nodemailer.createTransport({
            service: 'Outlook',
            auth: {
                user: 'vocabTrainer@outlook.com',
                pass: 'n6T</b]+M&fi&T}eq7{$j0vjXIiaoG'
            },
        });

        const subject_problem = document.getElementById('select-problem').value;
        const report_text = document.getElementById('problem-description').value;

        const mailOptions = {
            from: 'vocabTrainer@outlook.com',
            to: 'vocabTrainer@outlook.com',
            subject: `Problem: ${subject_problem}`,
            text: report_text
        };

        transporter_report.sendMail(mailOptions, (error) => {
            if (error)
            {
                console.error('Error sending email:', error);
            }
            else
            {
                feedback_win.style.display = 'none';
                feedback_sub.style.display = 'none';
                feedback_close.style.display = 'none';
                popupBlock.style.display = 'none';

                list_div.style.display = 'block';
    
                isFeedbackWinOpen = false;  
            }
        });
    });

    function loadLogs()
    {
        const nothing_there = document.getElementById('nothing_there');

        fetch(`http://${api_address}:3000/webportal/change_log/load`, {
            method: "GET"
        })
        .then(response => {
            if (response.status === 404)
            {
                nothing_there.style.display = 'block';
                return;
            }

            return response.json();
        })
        .then(data => {
            console.log(data);

            const logs = data.logs;

            nothing_there.style.display = 'none';

            logs.forEach(log => {
                const logDiv = document.createElement('div');
                logDiv.id = 'log-entry';

                const logTitle = document.createElement('h3');
                logTitle.textContent = log.title;

                const logTimestamp = document.createElement('p');
                const formattedDate = formatData(log.timestamp)
                logTimestamp.textContent = formattedDate;

                const logText = document.createElement('pre');
                logText.textContent = log.text;

                logDiv.style.backgroundColor = '#1b232e';
                logDiv.style.width = '90%';
                logDiv.style.height = 'auto';
                logDiv.style.marginLeft = '5%';
                logDiv.style.marginTop = '5%';
                logDiv.style.paddingBottom = '1vw';
                logDiv.style.borderRadius = '5px';
                logDiv.style.color = '#ffffff';

                logTitle.style.fontSize = '3vw';
                logTitle.style.marginTop = '1vw';
                logTitle.style.marginLeft = '1vw';

                logTimestamp.style.fontSize = '1.2vw';
                logTimestamp.style.marginLeft = '1vw';

                logText.style.fontSize = '1.2vw';
                logText.style.marginTop = '.5vw';
                logText.style.marginLeft = '1vw';

                logDiv.appendChild(logTitle);
                logDiv.appendChild(logTimestamp);
                logDiv.appendChild(logText);
            
                change_log_container.appendChild(logDiv);

                change_log_container.scrollTop = change_log_container.scrollHeight;
            })
        })
        .catch(error => {
            console.error(error);
        })
    }

    function formatData(timestamp)
    {
        const date = new Date(timestamp);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are 0-based
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    change_log_open.addEventListener('click', () => {
        change_log_container.style.display = 'block';
        change_log_bg.style.display = 'block';
        change_log_close.style.display = 'block';
        list_div.style.display = 'none';
    });

    change_log_close.addEventListener('click', () => {
        change_log_container.style.display = 'none';
        change_log_bg.style.display = 'none';
        change_log_close.style.display = 'none';
        list_div.style.display = 'block';
    });

    start_training.addEventListener('click', () => {
        training_div.style.display = 'block';
        close_training.style.display = 'block';
        popupBlock.style.display = 'block';
        isInTrainingMode = true;
        questionContainer.innerHTML = '';
        if (!isOffline)
        {
            loadData();
        }
        else
        {
            loadDataOffline();
        }
    });

    close_training.addEventListener('click', () => {
        training_div.style.display = 'none';
        close_training.style.display = 'none';
        popupBlock.style.display = 'none';
        isInTrainingMode = false;
        currentDifficulty = "Easy";
        easyInputs.length = 0;
        mediumInputs.length = 0;
        hardInputs.length = 0;
        inputsTrainer.length = 0;
        failedWords.length = 0;
    });

    function loadData()
    {
        const vocab = vocab_list.value;

        if (vocab !== null)
        {
            isLoadingTraining = true;

            const username_storage = document.getElementById('username_view');
            const username = username_storage.textContent;    

            const dataToSendGetDifficulty = ({ username: username });

            fetch(`http://${api_address}:3000/vocab/get/difficulty`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dataToSendGetDifficulty),
            })
            .then(response => response.json())
            .then(data => {
                const dataArray = data.difficulty;

                console.log(dataArray);

                if (Array.isArray(dataArray))
                {
                    const easyWords = [];
                    const mediumWords = [];
                    const hardWords = [];

                    dataArray.forEach(item => {
                        if (item.difficulty === 'Easy')
                        {
                            easyWords.push(item);
                        }
                        else if (item.difficulty === 'Medium')
                        {
                            mediumWords.push(item);
                        }
                        else if (item.difficulty === 'Hard')
                        {
                            hardWords.push(item);
                        }
                    })
                     
                    easyGroups = splitArrayIntoGroups(easyWords, 5);
                    mediumGroups = splitArrayIntoGroups(mediumWords, 5);
                    hardGroups = splitArrayIntoGroups(hardWords, 5);

                    initializeTrainingMode();
                }
                else 
                {
                    console.error('Data is not an array');
                }
            })
            .catch(error => {
                console.error(error);
            });
        }
    }

    function loadDataOffline()
    {
        const vocab = vocab_list.value;

        if (vocab !== null)
        {
            const filePath = offlineFilePath;

            fs.readFile(filePath, 'utf-8', (err, data) => {
                if (err)
                {
                    console.error('Error reading file: ', error);
                    return;
                }

                const outPutData = JSON.parse(data);

                console.log(outPutData);

                if (Array.isArray(outPutData))
                {
                    const easyWords = [];
                    const mediumWords = [];
                    const hardWords = [];

                    outPutData.forEach(item => {
                        if (item.difficulty === 'Easy')
                        {
                            easyWords.push(item);
                        }
                        else if (item.difficulty === 'Medium')
                        {
                            mediumWords.push(item);
                        }
                        else if (item.difficulty === 'Hard')
                        {
                            hardWords.push(item);
                        }
                    });

                    easyGroups = splitArrayIntoGroups(easyWords, 5);
                    mediumGroups = splitArrayIntoGroups(mediumWords, 5);
                    hardGroups = splitArrayIntoGroups(hardWords, 5);

                    initializeTrainingMode();
                }
                else
                {
                    console.error('Data is not an array');
                }
            });
        }
    }

    function initializeTrainingMode() {
        currentDifficulty = 'Easy';
        groupIndex = 0;

        questionContainer.textContent = '';
        easyMode.style.display = 'none';
        mediumMode.style.display = 'none';
        hardMode.style.display = 'none';
        doneMode.style.display = 'none';

        next_button.textContent = 'Start ';
        
        const ionIcon = document.createElement('ion-icon');
        ionIcon.setAttribute('name', 'play-forward-outline');
        next_button.appendChild(ionIcon);
    }

    next_button.addEventListener('click', () => {
        next_button.textContent = 'Next ';
        
        const ionIcon = document.createElement('ion-icon');
        ionIcon.setAttribute('name', 'play-forward-outline');
        next_button.appendChild(ionIcon);

        if (!isInTrainingMode)
        {
            training_div.style.display = 'none';
            close_training.style.display = 'none';
            isInTrainingMode = false;
        }

        transitionToNextDifficulty();
    });

    async function transitionToNextDifficulty() {
        switch (currentDifficulty) {
          case 'Easy':
            questionContainer.textContent = '';
            if (groupIndex < easyGroups.length) 
            {
                questionContainer.textContent = '';
                easyMode.style.display = 'block';
                generateQuestionsForGroup(easyGroups[groupIndex], questionContainer);
                groupIndex++;
            } 
            else 
            {
                easyMode.style.display = 'none';
                currentDifficulty = 'Medium';
                groupIndex = 0;

                console.table(inputsTrainer);
                console.log(inputsTrainer.length);
        
                if (inputsTrainer.length > 0) 
                {
                    easyInputs.push(...inputsTrainer);

                    inputsTrainer.length = 0;
                }
            }
            break;
      
          case 'Medium':
            if (groupIndex < mediumGroups.length)
            {
                questionContainer.textContent = '';
                mediumMode.style.display = 'block';
                generateQuestionsForGroup(mediumGroups[groupIndex], questionContainer);
                groupIndex++;
            } 
            else 
            {
                questionContainer.textContent = '';
                mediumMode.style.display = 'none';
                currentDifficulty = 'Hard';
                groupIndex = 0;

                console.table(inputsTrainer);
                console.log(inputsTrainer.length);

                if (inputsTrainer.length > 0) 
                {
                    mediumInputs.push(...inputsTrainer);

                    inputsTrainer.length = 0;
                }
            }
            break;
      
          case 'Hard':
            if (groupIndex < hardGroups.length) 
            {
                questionContainer.textContent = '';
                hardMode.style.display = 'block';
                generateQuestionsForGroup(hardGroups[groupIndex], questionContainer);
                groupIndex++;
            } 
            else 
            {
                groupIndex = 0;
                questionContainer.textContent = '';
                hardMode.style.display = 'none';
                doneMode.style.display = 'block';

                next_button.textContent = 'Done ';
        
                const ionIcon = document.createElement('ion-icon');
                ionIcon.setAttribute('name', 'checkmark-done-outline');
                next_button.appendChild(ionIcon);

                isInTrainingMode = false;
                popupBlock.style.display = 'none';

                if (inputsTrainer.length > 0) 
                {
                    hardInputs.push(...inputsTrainer);

                    inputsTrainer.length = 0;
                }

                if (!isOffline)
                {
                    
                    const dataToSendDifficulty = ({ easy: easyInputs, medium: mediumInputs, hard: hardInputs, failed: failedWords });

                    fetch(`http://${api_address}:3000/vocab/update/difficulty`, {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(dataToSendDifficulty),
                    })
                    .then(response => response.json())
                    .then(data => {
                        console.log(data);
                        easyInputs.length = 0;
                        mediumInputs.length = 0;
                        hardInputs.length = 0;
                        failedWords.length = 0;
                    })
                    .catch(err => {
                        throw err;
                    });
                }
                else
                {
                    const easyInputData = [];
                    const mediumInputData = [];
                    const hardInputData = [];

                    for (var i = 0; i < easyInputs.length; i += 4)
                    {
                        const word = easyInputs[i];
                        const word2 = easyInputs[i + 1];
                        const time = easyInputs[i + 2];
                        const lang = easyInputs[i + 3];

                        easyInputData.push({ word, word2, time, lang });
                    }

                    for (var i = 0; i < hardInputs.length; i += 4)
                    {
                        const word = mediumInputs[i];
                        const word2 = mediumInputs[i + 1];
                        const time = mediumInputs[i + 2];
                        const lang = mediumInputs[i + 3];

                        mediumInputData.push({ word, word2, time, lang });
                    }

                    for (var i = 0; i < hardInputs.length; i += 4)
                    {
                        const word = hardInputs[i];
                        const word2 = hardInputs[i + 1];
                        const time = hardInputs[i + 2];
                        const lang = hardInputs[i + 3];

                        hardInputData.push({ word, word2, time, lang });
                    }

                    try 
                    {
                        const easyUpdated = await getUpdatedDifficulty(easyInputData);
                        const mediumUpdated = await getUpdatedDifficulty(mediumInputData);
                        const hardUpdated = await getUpdatedDifficulty(hardInputData);

                        const numUpdatesCompleted = { value: 0 };
                        const totalUpdates = easyUpdated.length + mediumUpdated.length + hardUpdated.length + failedWords.length;
                    
                        const filePath = offlineFilePath;

                        if (failedWords.length > 0)
                        {
                            updateFailedWordsWithJson(failedWords, filePath, "Hard");
                        }
                        else
                        {
                            console.log("NO failed words to update.");
                            handleUpdateResponse();
                        }

                        function updateFailedWordsWithJson(failedWords, jsonFilePath, difficulty) 
                        {
                            fs.readFile(jsonFilePath, 'utf-8', (err, data) => {
                                if (err) 
                                {
                                    console.error('Error reading JSON file:', err);
                                    handleUpdateResponse();
                                    return;
                                }
                                try 
                                {
                                    const jsonData = JSON.parse(data);
                                
                                    let updated = false;
                                
                                    for (const item of failedWords) 
                                    {
                                        const index = jsonData.findIndex(
                                          (row) =>
                                            row.german.trim().toLowerCase() === item.trim().toLowerCase() ||
                                            row.english.trim().toLowerCase() === item.trim().toLowerCase()
                                        );
                                        
                                        if (index !== -1) 
                                        {
                                            jsonData[index].difficulty = difficulty;
                                            updated = true;
                                        } 
                                        else 
                                        {
                                            console.log('FAILED WORD NOT FOUND:', item);
                                        }
                                    }
                                
                                    if (updated) 
                                    {
                                      fs.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 2), (writeErr) => {
                                            if (writeErr) 
                                            {
                                                console.error('Error writing JSON file:', writeErr);
                                            } 
                                            else 
                                            {
                                                console.log('Updated failed words difficulty successfully!');
                                            }
                                            handleUpdateResponse();
                                      });
                                    } 
                                    else 
                                    {
                                        console.log('No words were updated.');
                                        handleUpdateResponse();
                                    }
                                } 
                                catch (parseError) 
                                {
                                    console.error('Error parsing JSON data:', parseError);
                                    handleUpdateResponse();
                                }
                            });
                        }

                        function updateDifficulty(entry, vocabData) {
                            const { word, word2, difficulty } = entry;
                          
                            const closestMatchForWord = findClosestMatch(word, vocabData.map((row) => row.german));
                          
                            const closestMatchForWord2 = findClosestMatch(word2, vocabData.map((row) => row.english));
                          
                            const germanToUpdate = closestMatchForWord ? closestMatchForWord : word;
                            const englishToUpdate = closestMatchForWord2 ? closestMatchForWord2 : word2;
                          
                            for (const row of vocabData) {
                                if (row.german.trim().toLowerCase() === germanToUpdate.trim().toLowerCase() && row.english.trim().toLowerCase() === englishToUpdate.trim().toLowerCase()) {
                                    row.difficulty = difficulty;
                                }
                            }
                          
                            fs.writeFile(filePath, JSON.stringify(vocabData, null, 2), (writeErr) => {
                                if (writeErr) 
                                {
                                    console.error('Error writing JSON file:', writeErr);
                                } 

                                handleUpdateResponse();
                            });
                        }
                    
                        function findClosestMatch(word, array) 
                        {
                            let closestMatch = null;
                            let minDistance = Infinity;
                            
                            for (const item of array) 
                            {
                                const distance = calculateLevenshtein(word, item);
                                if (distance < minDistance) 
                                {
                                    minDistance = distance;
                                    closestMatch = item;
                                }
                            }
                          
                            return closestMatch;
                        }

                        const vocabData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
                        
                        for (const entry of easyUpdated)
                        {
                            updateDifficulty(entry, vocabData);
                        }

                        for (const entry of mediumUpdated)
                        {
                            updateDifficulty(entry, vocabData);
                        }

                        for (const entry of hardUpdated)
                        {
                            updateDifficulty(entry, vocabData);
                        }

                        function handleUpdateResponse() 
                        {
                            numUpdatesCompleted.value++;
                            if (numUpdatesCompleted.value === totalUpdates) 
                            {
                                // * All updates are completed, send the response
                                if (numUpdatesCompleted.value === totalUpdates) 
                                {
                                    isInTrainingMode = false;

                                    easyInputs.length = 0;
                                    mediumInputs.length = 0;
                                    hardInputs.length = 0;
                                    failedWords.length = 0;

                                    fs.readFile(filePath, 'utf-8', (err, data) => {
                                        if (err) 
                                        {
                                            console.error('Error reading JSON file:', err);
                                            return;
                                        }
            
                                        if (data.endsWith(']]')) 
                                        {
                                            const correctedData = data.slice(0, data.lastIndexOf(']')) + data.slice(data.lastIndexOf(']') + 1);
            
                                            fs.writeFile(filePath, correctedData, (writeErr) => {
                                                if (writeErr) 
                                                {
                                                    console.error('Error writing JSON file:', writeErr);
                                                } 
                                                else 
                                                {
                                                    console.log('Fixed JSON file: Removed extra "]" character.');
                                                }
                                            });
                                        } 
                                        else 
                                        {
                                            console.log('JSON file is already in the correct format.');
                                        }
                                    });
                                }
                            }
                        }
                    }
                    catch (error) 
                    {
                      throw error;
                    }
                }
            }
            break;
        }
    }

    function generateQuestionsForGroup(group, questionContainer, maxQuestions = 5) 
    {
        const groupContainer = document.createElement('div');
        groupContainer.classList.add('word-group');
      
        let questionCount = 0;
      
        for (let i = 0; i < group.length && questionCount < maxQuestions; i++) 
        {
            const wordPair = group[i];
            const wordPairContainer = document.createElement('div');
            
            const inputAndWordContainer = document.createElement('div');
            inputAndWordContainer.style.display = 'flex';
            inputAndWordContainer.style.alignItems = 'center';
            
            const inputFieldGerman = document.createElement('input');
            inputFieldGerman.type = 'text';
            inputFieldGerman.placeholder = 'German';
            inputFieldGerman.style.width = '15vw';
            inputFieldGerman.style.fontSize = '1.5vw';
            inputFieldGerman.style.outline = 'none';
            inputFieldGerman.style.border = 'none';
            inputFieldGerman.style.backgroundColor = '#151922';
            inputFieldGerman.style.color = '#ffffff';
            inputFieldGerman.style.borderRadius = '5px';
            inputFieldGerman.style.padding = '10px';
            inputFieldGerman.style.marginTop = '.5vw';
            inputFieldGerman.style.marginLeft = '1vw';
            inputFieldGerman.style.marginRight = '1vw';
            inputFieldGerman.id = 'trainerInputGerman';
            
            const inputFieldEnglish = document.createElement('input');
            inputFieldEnglish.type = 'text';
            inputFieldEnglish.placeholder = 'English';
            inputFieldEnglish.style.width = '15vw';
            inputFieldEnglish.style.fontSize = '1.5vw';
            inputFieldEnglish.style.outline = 'none';
            inputFieldEnglish.style.border = 'none';
            inputFieldEnglish.style.backgroundColor = '#151922';
            inputFieldEnglish.style.color = '#ffffff';
            inputFieldEnglish.style.borderRadius = '5px';
            inputFieldEnglish.style.padding = '10px';
            inputFieldEnglish.style.marginTop = '.5vw';
            inputFieldEnglish.style.marginLeft = '1vw';
            inputFieldEnglish.id = 'trainerInputEnglish';
            
            const germanWord = document.createElement('p');
            germanWord.textContent = wordPair.german + ' ';
            germanWord.style.fontSize = '1.5vw';
            germanWord.style.marginLeft = '1vw';
            germanWord.style.marginRight = '1vw';
            
            const englishWord = document.createElement('p');
            englishWord.textContent = wordPair.english;
            englishWord.style.fontSize = '1.5vw';
            englishWord.style.marginLeft = '1vw';
            
            const separator = document.createElement('span');
            separator.textContent = ' | ';
            separator.style.fontSize = '1.5vw';
            
            if (Math.random() < 0.5) 
            {
              inputAndWordContainer.appendChild(inputFieldGerman);
              inputAndWordContainer.appendChild(separator);
              inputAndWordContainer.appendChild(englishWord);

              const counterGerman = counter();

              inputFieldGerman.addEventListener('focus', () => {
                counterGerman.start();
              });

              inputFieldGerman.addEventListener('blur', () => {
                const endResultGerman = counterGerman.stop();

                if (inputFieldGerman.value !== "")
                {
                    const langG = "german"
                    inputsTrainer.push(inputFieldGerman.value, englishWord.textContent, endResultGerman, langG);
                }
                else
                {
                    failedWords.push(germanWord.textContent);
                }

                inputFieldGerman.disabled = true;
              });
            } 
            else 
            {
                inputAndWordContainer.appendChild(germanWord);
                inputAndWordContainer.appendChild(separator);
                inputAndWordContainer.appendChild(inputFieldEnglish);
                
                const counterEnglish = counter();

                inputFieldEnglish.addEventListener('focus', () => {
                    counterEnglish.start();
                });

                inputFieldEnglish.addEventListener('blur', () => {
                    const endResultEnglish = counterEnglish.stop();

                    if (inputFieldEnglish.value !== "")
                    {
                        const langE = "english"
                        inputsTrainer.push(inputFieldEnglish.value, germanWord.textContent, endResultEnglish, langE);
                    }
                    else
                    {
                        failedWords.push(englishWord.textContent);
                    }

                    inputFieldEnglish.disabled = true;
                });
            }
          
            wordPairContainer.appendChild(inputAndWordContainer);
            groupContainer.appendChild(wordPairContainer);
            questionCount++;
        }
      
        questionContainer.appendChild(groupContainer);
    }

    function splitArrayIntoGroups(array, groupSize)
    {
        const groups = [];
        for (let i = 0; i < array.length; i += groupSize)
        {
            groups.push(array.slice(i, i + groupSize));
        }
        return groups;
    }

    function counter()
    {
        let count = 0;

        let timer = setInterval(() => {
            count++
        }, 1000);

        function start()
        {
            timer = setInterval(() => {
                count++
            }, 1000);
        }

        function stop()
        {
            clearInterval(timer);

            const endResult = count;

            return endResult;
        }

        return { start, stop };
    }

    function getDifficulty(word)
    {
        const wordLength = word.length;
        const isCommon = isCommonWord(word);
        const syllables = countSyllables(word);

        if (wordLength >= 1 && wordLength <= 4)
        {
            if (isCommon && syllables <= 2)
            {
                return "Easy";
            }
            else if (!isCommon && syllables <= 3)
            {
                return "Medium";
            }
            else
            {
                return "Hard";
            }
        }
        else if (wordLength >= 5 && wordLength <= 7)
        {
            if (isCommon && syllables <= 3)
            {
                return "Medium";
            }
            else
            {
                return "Hard";
            }
        }
        else if (wordLength >= 8)
        {
            return "Hard";
        }

        return "Medium";
    }

    function isCommonWord(word) 
    {
        const commonWords = [
            "the",
            "and",
            "of",
            "to",
            "in",
            "that",
            "it",
            "is",
            "was",
            "for",
            "you",
            "he",
            "she",
            "we",
            "they",
            "with",
            "on",
            "at",
            "by",
            "this",
            "but",
            "from",
            "or",
            "not",
            "an",
            "as",
            "if",
            "will",
            "can",
            "are",
            "have",
            "has",
            "do",
            "what",
            "who",
            "which",
            "where",
            "when",
            "why",
            "how",
            "your",
            "there",
            "their",
            "here",
            "been",
            "more",
            "than",
            "so",
            "up",
            "down",
            "out",
            "into",
            "just",
            "now",
            "then",
            "time",
            "over",
            "would",
            "could",
            "should",
            "many",
            "some",
            "other",
            "most",
            "all",
            "any",
            "no",
            "good",
            "new",
            "old",
            "first",
            "last",
            "way",
            "day",
            "use",
            "man",
            "woman",
            "child",
            "work",
            "home",
            "life",
            "place",
            "thing",
            "world",
            "great",
            "small",
            "big",
            "high",
            "low",
            "right",
            "left",
            "long",
            "short",
            "high",
            "low",
            "near",
            "far",
            "next",
            "best",
            "better",
            "early",
            "late",
            "often",
            "always",
            "sometimes",
            "never",
            "every",
            "many",
            "few",
            "one",
            "two",
            "three",
            "four",
            "five",
            "six",
            "seven",
            "eight",
            "nine",
            "ten"
        ];      

        return commonWords.includes(word.toLowerCase());
    }

    function countSyllables(word)
    {
        word = word.toLowerCase().replace(/[^a-z]/g, '');

        if (word.length <= 3)
        {
            return 1; // * Single-syllable for short words
        }    

        const vowels = ['a', 'e', 'i', 'o', 'u'];
        let syllableCount = 0;
        let isPrevCharVowel = false;

        for (let i = 0; i < word.length; i++)
        {
            if (vowels.includes(word[i]))
            {
                if (!isPrevCharVowel)
                {
                    syllableCount++
                    isPrevCharVowel = true;
                }
            }
            else
            {
                isPrevCharVowel = false;
            }
        }

        // * Adjust syllable count for common cases
        if (word.endsWith('e'))
        {
            syllableCount--;
        }
        if (syllableCount === 0)
        {
            syllableCount = 1;
        }

        return syllableCount;
    }

    async function getUpdatedDifficulty(inputs) 
    {
        const updatedDifficulty = [];
    
        for (const input of inputs) 
        {
          const word = input.word;
          const word2 = input.word2;
          const lang = input.lang;
          const time = input.time;
        
          let difficultyTime = 0;
        
          if (time < 7) 
          {
            difficultyTime = 1;
          } 
          else if (time >= 7 && time <= 14) 
          {
            difficultyTime = 2;
          } 
          else 
          {
            difficultyTime = 3;
          }
      
          try 
          {
            const similarity = await checkSimilarity(word, word2, lang);
        
            const difficultyNum = difficultyTime + similarity;
        
            let difficulty = '';
            if (difficultyNum === 2) 
            {
              difficulty = "Easy";
            } 
            else if (difficultyNum === 3) 
            {
              difficulty = "Medium";
            } 
            else 
            {
              difficulty = "Hard";
            }
        
            updatedDifficulty.push({ word, word2, difficulty });
          } 
          catch (error) 
          {
            console.error("Error: ", error);
          }
        }
    
        return updatedDifficulty;
    }  

    function checkSimilarity(word, word2, lang) 
    {
        return new Promise((resolve, reject) => {
            const filePath = offlineFilePath;

            if (word && word2 !== null || word.length && word2.length !== 0)
            {
                fs.readFile(filePath, "utf-8", (err, data) => {
                    if (err) 
                    {
                      console.log("Error reading file: ", err);
                      reject(err);
                      return;
                    }
                  
                    try 
                    {
                      const selectedWords = JSON.parse(data);
                      
                      if (selectedWords.length === 0) 
                      {
                        console.log("Table is empty!");
                        reject(new Error("Table is empty"));
                        return;
                      }
                    
                      let correctWord = null;
                    
                      if (lang === 'german') 
                      {
                        correctWord = selectedWords.find((row) => row.english.trim().toLowerCase() === word2.trim().toLowerCase());
                        if (correctWord) 
                        {
                            correctWord = correctWord.german;
                            console.log("CorrectWord german: ", correctWord);
                        }
                      } 
                      else if (lang === 'english') 
                      {
                        correctWord = selectedWords.find((row) => row.german.trim().toLowerCase() === word2.trim().toLowerCase());
                        if (correctWord) 
                        {
                            correctWord = correctWord.english;
                            console.log("CorrectWord english: ", correctWord);
                        }
                      }
      
                      console.log("CorrectWord after assignment: ", correctWord);
                    
                      if (correctWord) 
                      {
                        const editDistance = calculateLevenshtein(word, correctWord);
                        const roundedEditDistance = parseFloat(editDistance.toFixed(2));
                      
                        let difficultyLevel;
                        if (roundedEditDistance === 0) 
                        {
                          difficultyLevel = 1; // Perfect
                        }
                        else if (roundedEditDistance < 0.5) 
                        {
                          difficultyLevel = 2; // Almost
                        } 
                        else 
                        {
                          difficultyLevel = 3; // NOT Perfect
                        }
                      
                        resolve(difficultyLevel);
                      } 
                      else 
                      {
                        console.log("Word not found in the table!", correctWord);
                        reject(new Error("Word not found in the table"));
                      }
                    } 
                    catch (parseError) 
                    {
                      console.log("Error parsing JSON data: ", parseError);
                      reject(parseError);
                    }
                  });    
            }
            else
            {
                reject(new Error("Array emtpy!"));
            }
        });
    }      

    function calculateLevenshtein(a, b) 
    {
        const matrix = [];

        for (let i = 0; i <= a.length; i++) 
        {
            matrix[i] = [i];
        }

        for (let j = 0; j <= b.length; j++) 
        {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= a.length; i++) 
        {
            for (let j = 1; j <= b.length; j++) 
            {
                const cost = a[i - 1] === b[j - 1] ? 0 : 1;
                const deletion = matrix[i - 1][j] + 1;
                const insertion = matrix[i][j - 1] + 1;
                const substitution = matrix[i - 1][j - 1] + cost;

                matrix[i][j] = Math.min(deletion, insertion, substitution);
            }
        }

        const maxLen = Math.max(a.length, b.length);
        const editDistance = matrix[a.length][b.length] / maxLen;

        return editDistance;
    }

    const search_button = document.getElementById('search_btn');
    const search_bar = document.getElementById('search_vocab');
    const search_output = document.getElementById('vocab_search_output_div');

    let isSearchBarVisible = false;

    search_button.addEventListener('click', () => {
        if (!isSearchBarVisible)
        {
            search_bar.style.display = 'block';
            search_bar.style.width = '18vw';
            search_bar.style.transition = '.5s';
            search_bar.style.paddingLeft = '10px';
            search_bar.style.paddingRight = '10px';
            search_bar.style.borderRadius = '10px';
            isSearchBarVisible = true;
        }
        else 
        {
            search_bar.style.width = '0vw';
            search_bar.style.display = 'block';
            search_bar.style.transition = '.5s';
            search_bar.style.paddingLeft = '0px';
            search_bar.style.paddingRight = '0px';
            search_bar.style.borderRadius = '10px';
            search_output.style.display = 'none';
            const p_output = document.getElementById('p_output');
            p_output.textContent = '';
            isSearchBarVisible = false;
        }
    });

    search_bar.addEventListener('keydown', async (event) => {
        if (event.key === 'Enter')
        {
            let output = await search(search_bar.value);

            if (output)
            {
                if (isSearchBarVisible)
                {
                    search_bar.style.borderRadius = '10px 10px 0px 0px';
                    search_output.style.display = 'block';
    
                    let outputText = `${output.german} ${output.english} ${output.difficulty}`;
    
                    const p_output = document.getElementById('p_output');
                    p_output.textContent = outputText;
                }
                else
                {
                    search_bar.style.borderRadius = '10px';
                }
            }
            else
            {
                console.log('No results were found.');
            }
        }
    });

    async function search(input) 
    {
        if (isOffline) 
        {
            if (input.length > 0)
            {
                const jsonData = JSON.parse(fs.readFileSync(offlineFilePath));
            
                const germanSearcher = new FuzzySearch(jsonData, ["german"], {
                    caseSensitive: false,
                });
            
                const englishSearcher = new FuzzySearch(jsonData, ["english"], {
                    caseSensitive: false,
                });

                const exactMatchGerman = jsonData.find((item) => item.german.toLowerCase() === input.toLowerCase());
                const exactMatchEnglish = jsonData.find((item) => item.english.toLowerCase() === input.toLowerCase());
                
                if (exactMatchGerman) 
                {
                    return {
                        german: exactMatchGerman.german,
                        english: exactMatchGerman.english,
                        difficulty: exactMatchGerman.difficulty,
                    };
                }

                if (exactMatchEnglish) 
                {
                    return {
                        german: exactMatchEnglish.german,
                        english: exactMatchEnglish.english,
                        difficulty: exactMatchEnglish.difficulty,
                    };
                }

                const closeMatchesGerman = germanSearcher.search(input);
                const closeMatchesEnglish = englishSearcher.search(input);

                if (closeMatchesGerman.length > 0) 
                {
                    return {
                        german: closeMatchesGerman[0].german,
                        english: closeMatchesGerman[0].english,
                        difficulty: closeMatchesGerman[0].difficulty,
                    };
                }

                if (closeMatchesEnglish.length > 0) 
                {
                    return {
                        german: closeMatchesEnglish[0].german,
                        english: closeMatchesEnglish[0].english,
                        difficulty: closeMatchesEnglish[0].difficulty,
                    };
                }

                return null;
            }
        } 
        else 
        {
            // TODO: Implement online search functionality.
        }  
    }
       

    /*
    const check_updates_btn = document.getElementById('update');
    const loading = document.getElementById('checking_for_updates');
    const updateExistWin = document.getElementById('update_available');
    const noUpdatesExistWin = document.getElementById('no_update_available');

    check_updates_btn.addEventListener('click', () => {
        checkForUpdates();
    });

    function checkForUpdates()
    {
        ipcRenderer.send('check-for-updates');
        loading.style.display = 'block';

        //let updatesExist = ipcRenderer.on('update-available');
        let updateExist = true;

        if (updateExistWin)
        {
            loading.style.display = 'none';
            updateExistWin.style.display = 'block';
            popupBlock.style.display = 'block';
        }
        else
        {
            noUpdatesExistWin.style.display = 'block';
            popupBlock.style.display = 'block';
            loading.style.display = 'none';
        }
    }
    */
});