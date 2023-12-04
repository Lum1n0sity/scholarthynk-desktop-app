const Store = require('electron-store');
const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const i18next = require('i18next');
const fsBackend = require('i18next-fs-backend');

document.addEventListener('DOMContentLoaded', async function () 
{
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

    const delete_select = document.getElementById('delete_select');

    //* Get all topics

    fetch(`${api_addr}/discover/get-topics`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        },
    })
    .then(response => response.json())
    .then(data => {
        const topicList = document.getElementById('topic_list');
        const template = document.getElementById('topic_list_template');

        if (data.topics && data.topics.length > 0) 
        {
            data.topics.forEach(topic => {
                const clonedTemplate = document.importNode(template.content, true);

                const imgElement = clonedTemplate.querySelector('img');
                imgElement.src = `data:image/png;base64,${topic.images[0].data}`;
                imgElement.alt = topic.images[0].filename;

                const title = clonedTemplate.querySelector('h3');
                title.textContent = topic.topic;

                topicList.insertBefore(clonedTemplate, topicList.lastElementChild);
            });
        }
    })
    .catch(error => {
        console.error('Fetch error: ', error);
    });

    //* Get Vocab Of the Week data

    const dataToSendVocabOfWeek = ({ topic: "vocab_of_the_week" });

    fetch(`${api_addr}/discover/get-vocab`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(dataToSendVocabOfWeek)
    })
    .then(response => response.json())
    .then(data => {
        const foundVocab = data != null ? data.vocabFound : null;

        if (foundVocab != null && foundVocab == true)
        {
            const vocab = data.vocab;
            const student = data.student;

            const studentDisplay = document.getElementById('studentDisplay');
            const vocabDisplay = document.getElementById('vocab_container');

            const currentText = studentDisplay.textContent;

            const newText = currentText.replace('N/A', student);

            studentDisplay.textContent = newText;

            const formattedText = vocab.map(pair => `${pair.german} | ${pair.english}`).join('\n');
                
            const wordPairs = formattedText.split('\n');

            for (const wordPair of wordPairs) 
            {
                const option = document.createElement('option');
                option.value = wordPair;
                option.textContent = wordPair;
                delete_select.appendChild(option);
            }

            vocabDisplay.value = formattedText;
        }
    })
    .catch(error => {
        console.error("Fetch error: ", error);
    });

    const nav_home = document.getElementById('nav_home');
    const nav_courses = document.getElementById('nav_courses');

    const english_tab = document.getElementById('english_tab');
    const german_tab = document.getElementById('german_tab');
    const math_tab = document.getElementById('math_tab');

    const english_page = document.getElementById('english');
    const german_page = document.getElementById('german');
    const math_page = document.getElementById('math');

    const menu_topics = document.getElementById('menu_topics');
    const menu_topics_div = document.getElementById('menu_topics_div');

    const topic_list = document.getElementById('topic_list');

    const add_topic = document.getElementById('add_topic');
    const add_topic_win = document.getElementById('add_topic_win');
    const close_add_topic = document.getElementById('close_add_topic');
    const add_word_pair = document.getElementById('add_word_pair');

    const delete_topics = document.getElementById('delete_topics');
    const delete_topic_overlay = document.getElementById('delete_topic_overlay');
    const cancel_delete_topic = document.getElementById('cancel_delete_topic');
    const delete_delete_topic = document.getElementById('delete_delete_topic');
    
    const vocab_of_the_week = document.getElementById('vocab_of_the_week');

    const vocab_list_display = document.getElementById('vocab_list_display');
    const add_vocab = document.getElementById('add_vocab');
    const add_vocab_win = document.getElementById('add_vocab_win');
    const close_add_vocab_win = document.getElementById('close_add_vocab_win');
    const vocab_list_display_topic = document.getElementById('vocab_list_display_topic');

    const delete_vocab = document.getElementById('delete_vocab');
    const delete_vocab_win = document.getElementById('delete_vocab_win');
    const close_delete_vocab_win = document.getElementById('close_delete_vocab_win');
    const delete_btn = document.getElementById('delete_btn');

    const topic_input = document.getElementById('topic_input');
    const select_image = document.getElementById('select_image');
    const add_topic_btn = document.getElementById('add_topic_btn');

    const pop_up_background = document.getElementById('background');

    let new_selected_image;
    let isMenuDropDownOpen = false;
    let isVocabOfWeekDisplayed = true;

    nav_home.addEventListener('click', (event) => {
        event.preventDefault();

        window.location.href = '../Home/index.html';
    });

    nav_courses.addEventListener('click', (event) => {
        event.preventDefault();

        window.location.href = '../Courses/courses.html';
    });
    
    english_tab.addEventListener('click', () => {
        english_page.style.display = 'block';
        german_page.style.display = 'none';
        math_page.style.display = 'none';
    });

    german_tab.addEventListener('click', () => {
        german_page.style.display = 'block';
        english_page.style.display = 'none';
        math_page.style.display = 'none';
    });

    math_tab.addEventListener('click', () => {
        math_page.style.display = 'block';
        english_page.style.display = 'none';
        german_page.style.display = 'none';
    });

    topic_list.addEventListener('click', (event) => {
        const template = document.getElementById('topic_list_template');
        const clickedElement = event.target;

        const closestDiv = clickedElement.closest('#template_div');
    
        if (clickedElement === template || closestDiv) 
        {
            const h3Element = closestDiv ? closestDiv.querySelector('#template_h3') : template.querySelector('#template_h3');
    
            if (h3Element !== null) 
            {
                const options = delete_select.options;
                for (let i = options.length - 1; i >= 0; i--)
                {
                    if (options[i].value !== "default")
                    {
                        options[i].remove();
                    }
                }

                const vocabDisplay = document.getElementById('vocab_container');
                vocabDisplay.value = '';

                const topic = h3Element.textContent;
                vocab_list_display_topic.textContent = topic;
    
                const dataToSendLoadVocab = { topic: topic };
    
                fetch(`${api_addr}/discover/get-vocab`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(dataToSendLoadVocab),
                })
                .then(response => response.json())
                .then(data => {
                    const foundVocab = data != null ? data.vocabFound : null;
    
                    if (foundVocab != null && foundVocab === true) 
                    {
                        const vocab = data.vocab;
                        const vocabDisplay = document.getElementById('vocab_container');
    
                        const formattedText = vocab.map(pair => `${pair.german} | ${pair.english}`).join('\n');
                        vocabDisplay.value = formattedText;

                        const wordPairs = formattedText.split('\n');

                        for (const wordPair of wordPairs) 
                        {
                            const option = document.createElement('option');
                            option.value = wordPair;
                            option.textContent = wordPair;
                            delete_select.appendChild(option);
                        }
                    }
                })
                .catch(error => {
                    console.error('Fetch error: ', error);
                });
                
                add_vocab.removeAttribute('disabled');
                delete_vocab.removeAttribute('disabled');
            } 
            else 
            {
                console.error('No element with id "template_h3" found under the clicked element or its ancestor.');
            }
        } 
        else 
        {
            const options = delete_select.options;
            for (let i = options.length - 1; i >= 0; i--)
            {
                if (options[i].value !== "default")
                {
                    options[i].remove();
                }
            }

            if (storedLang == 'en')
            {
                vocab_list_display_topic.textContent = "Vocab of the week";
            }
            else if (storedLang == 'de')
            {
                vocab_list_display_topic.textContent = "Vocabeln der Woche";
            }

            const dataToSendVocabOfWeek = ({ topic: "vocab_of_the_week" });

            fetch(`${api_addr}/discover/get-vocab`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dataToSendVocabOfWeek)
            })
            .then(response => response.json())
            .then(data => {
                const foundVocab = data != null ? data.vocabFound : null;
        
                if (foundVocab != null && foundVocab == true)
                {
                    const vocab = data.vocab;
                    const student = data.student;
        
                    const studentDisplay = document.getElementById('studentDisplay');
                    const vocabDisplay = document.getElementById('vocab_container');
        
                    const currentText = studentDisplay.textContent;

                    const newText = currentText.replace('N/A', student);

                    studentDisplay.textContent = newText;
        
                    const formattedText = vocab.map(pair => `${pair.german} | ${pair.english}`).join('\n');
                        
                    const wordPairs = formattedText.split('\n');

                    for (const wordPair of wordPairs) 
                    {
                        const option = document.createElement('option');
                        option.value = wordPair;
                        option.textContent = wordPair;
                        delete_select.appendChild(option);
                    }
        
                    vocabDisplay.value = formattedText;
                }
            })
            .catch(error => {
                console.error("Fetch error: ", error);
            });

            add_vocab.setAttribute('disabled', 'true');
            delete_vocab.setAttribute('disabled', 'true');
        }
    });    

    menu_topics.addEventListener('click', () => {
        if (!isMenuDropDownOpen)
        {
            menu_topics_div.style.display = 'block';
            menu_topics_div.style.transition = '.5s';
            isMenuDropDownOpen = true;
        }
        else
        {
            menu_topics_div.style.display = 'none';
            menu_topics_div.style.transition = '.5s';
            isMenuDropDownOpen = false;
        }
    });

    add_topic.addEventListener('click', () => {
        add_topic_win.style.display = 'block';
        pop_up_background.style.display = 'block';

        menu_topics_div.style.display = 'none';
        menu_topics_div.style.transition = '.5s';
        isMenuDropDownOpen = false;
    });

    close_add_topic.addEventListener('click', () => {
        add_topic_win.style.display = 'none';
        pop_up_background.style.display = 'none';
    });

    delete_topics.addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('#template_del_checkbox');
        if (checkboxes.length != 0)
        {
            checkboxes.forEach(checkbox => {
                checkbox.style.display = 'block'
            });
            delete_topic_overlay.style.display = 'block'
            menu_topics_div.style.display = 'none';
        }
        else
        {
            menu_topics_div.style.display = 'none';
            isMenuDropDownOpen = false;
        }
    });

    cancel_delete_topic.addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('#template_del_checkbox')
        checkboxes.forEach(checkbox => {
            checkbox.style.display = 'none'
            checkbox.checked = false;
        });
        delete_topic_overlay.style.display = 'none'
    });

    delete_delete_topic.addEventListener('click', () => {
        const selectedTopics = [];
        const selectedH3 = [];
        const checkboxes = document.querySelectorAll('#template_del_checkbox');

        checkboxes.forEach(checkbox => {
            if (checkbox.checked)
            {
                const topicDiv = checkbox.closest('#template_div');
                const topicNameH3 = topicDiv.querySelector('#template_h3');
                const topicName = topicNameH3.textContent;
                selectedH3.push(topicNameH3);
                selectedTopics.push(topicName);
            }
        });

        if (selectedTopics.length != 0)
        {
            const sendTopicsToDelete = ({ topics: selectedTopics });

            fetch(`${api_addr}/discover/topics/delete`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(sendTopicsToDelete),
            })
            .then(response => response.json())
            .then(data => {
                const deleted = data.deleted;

                if (deleted)
                {
                    selectedH3.forEach(h3 => {
                        const elementToRemove = h3.closest('#template_div');
                        elementToRemove.remove();
                    });

                    checkboxes.forEach(checkbox => {
                        checkbox.style.display = 'none';
                    });

                    delete_topic_overlay.style.display = 'none';
                }
            })
            .catch(error => {
                console.error('Fetch error: ', error);
            });
        }
    });

    select_image.addEventListener('click', () => {
        ipcRenderer.send('open-file-dialog');
    
        ipcRenderer.on('selected-file', (event, filePath) => {
            try 
            {
                new_selected_image = filePath;
            } 
            catch (error) 
            {
                console.error('Error reading file:', error);
            }
        });
    
        ipcRenderer.on('file-dialog-canceled', () => {
            new_selected_image = null;
        });
    });
    
    add_topic_btn.addEventListener('click', () => {
        const topic_name = topic_input.value;
    
        if (topic_name != null && new_selected_image != null) 
        {
            const fileContent = fs.readFileSync(new_selected_image);
            const fileName = path.basename(new_selected_image);
            const fileType = path.extname(new_selected_image).toLowerCase();

            const mimeType = fileType === '.jpg' || fileType === '.jpeg' ? 'image/jpeg' :
                             fileType === '.png' ? 'image/png':
                             null;
                             
            if (mimeType)
            {
                const formData = new FormData();
                formData.append('image', new Blob([fileContent], { type: mimeType }), fileName);
                formData.append('name', topic_name);

                add_topic_win.style.display = 'none';
                pop_up_background.style.display = 'none';

                fetch(`${api_addr}/discover/topic/add`, {
                    method: "POST",
                    body: formData
                })
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! Status: ${response.status}`);
                    }
                    return response.text();
                })
                .then(data => {
                    try 
                    {
                        const jsonData = JSON.parse(data);
                        console.log(jsonData);

                        const added = jsonData.added;

                        if (added)
                        {
                            const topicList = document.getElementById('topic_list');
                            const template = document.getElementById('topic_list_template');

                            const clonedTemplate = document.importNode(template.content, true);

                            const imgElement = clonedTemplate.querySelector('img');
                            imgElement.src = new_selected_image;

                            const title = clonedTemplate.querySelector('h3');
                            title.textContent = topic_name;

                            topicList.insertBefore(clonedTemplate, topicList.lastElementChild);

                            new_selected_image = null;
                            topic_input.value = '';
                        }
                    } 
                    catch (parseError) 
                    {
                        console.error('Error parsing JSON:', parseError);
                        console.log('Raw response:', data);
                    }
                })
                .catch(error => {
                    console.error('Fetch error:', error);
                });
            }
        }
    });

    add_vocab.addEventListener('click', () => {
        add_vocab_win.style.display = 'block';
        pop_up_background.style.display = 'block';
    });

    close_add_vocab_win.addEventListener('click', () =>  {
        add_vocab_win.style.display = 'none';
        pop_up_background.style.display = 'none';
    });

    add_word_pair.addEventListener('click', () => {
        const german = document.getElementById('german_input').value;
        const english = document.getElementById('english_input').value;

        const topic = document.getElementById('vocab_list_display_topic').textContent;

        console.log(topic);

        const dataToSendAddVocab = ({ german: german, english: english, topic: topic });

        fetch(`${api_addr}/discover/topic/add-vocab`, {
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
                const vocab_container = document.getElementById('vocab_container');

                const formattedText = `${german} | ${english}`;
                
                vocab_container.value += (vocab_container.value ? '\n' : '') + formattedText;
                vocab_container.scrollTop = vocab_container.scrollHeight;

                const option = document.createElement('option');
                option.value = formattedText;
                option.textContent = formattedText;
                delete_select.appendChild(option);
            }

            document.getElementById('german_input').value = '';
            document.getElementById('english_input').value = '';

            add_vocab_win.style.display = 'none';
            pop_up_background.style.display = 'none';
        })
        .catch(error => {
            console.error("Fetch error: ", error);
        });
    });

    delete_vocab.addEventListener('click', () => {
        delete_vocab_win.style.display = 'block';
        pop_up_background.style.display = 'block';
    });

    close_delete_vocab_win.addEventListener('click', () => {
        delete_vocab_win.style.display = 'none';
        pop_up_background.style.display = 'none';
    });

    delete_btn.addEventListener('click', () => {
        const selectedOption = delete_select.selectedIndex;
        const wordPair = delete_select.options[selectedOption].value;

        const words = wordPair.split('|');

        const germanWord = words[0].trim();
        const englishWord = words[1].trim();
        const topic = document.getElementById('vocab_list_display_topic').textContent;

        const dataToSendDeleteVocab = ({ german: germanWord, english: englishWord, topic: topic });

        fetch(`${api_addr}/discover/vocab/delete`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dataToSendDeleteVocab)
        })
        .then(response => response.json())
        .then(data => {
            const isDeleted = data.deleted;
            const vocabDisplay = document.getElementById('vocab_container');

            let valueToRemove = wordPair;

            if (isDeleted)
            {
                let currentValue = vocabDisplay.value;
                const lines = currentValue.split('\n');

                const filteredLines = lines.filter(line => line.trim() !== valueToRemove);

                currentValue = filteredLines.join('\n');

                vocabDisplay.value = currentValue;

                const options = delete_select.options;
                for (let i = options.length - 1; i >= 0; i--)
                {
                    if (options[i].value == wordPair)
                    {
                        options[i].remove();
                    }
                }

                delete_vocab_win.style.display = 'none';
                pop_up_background.style.display = 'none';
            }
        })
        .catch(error => {
            console.error('Fetch error: ', error);
        });
    });
});