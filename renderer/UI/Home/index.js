const fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');
const Store = require('electron-store');

document.addEventListener('DOMContentLoaded', () => {
    const store = new Store();
    const api_addr = "http://192.168.5.21:3000";

    const dataToSendLoadVocab = ({ username: store.get('username') });
    const your_words_list = document.getElementById('your_words_list');
    const delete_words_select = document.getElementById('delete_words_select');

    fetch(`${api_addr}/vocab/load`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(dataToSendLoadVocab)
    })
    .then(response => response.json())
    .then(data => {
        const foundVocab = data != null ? data.vocabFound : null;

        if (foundVocab != null && foundVocab == true)
        {
            const vocab = data.vocab;

            const formattedText = vocab.map(pair => `${pair.german} | ${pair.english}`).join('\n');
                
            const wordPairs = formattedText.split('\n');

            for (const wordPair of wordPairs) {
                const option = document.createElement('option');
                option.value = wordPair;
                option.textContent = wordPair;
                delete_words_select.appendChild(option);
            }

            your_words_list.value = formattedText;
        }
    })
    .catch(error => {
        console.error("Fetch Error: ", error);
    });

    const body = document.body;

    const nav_discover = document.getElementById('nav_discover');
    const nav_courses = document.getElementById('nav_courses');
    const nav_logout = document.getElementById('nav_logout');

    const add_words_add = document.getElementById('add_words_add');
    const delete_words_delete = document.getElementById('delete_words_delete');

    const search_words_input = document.getElementById('search_words_input');
    const search_words_search = document.getElementById('search_words_search');
    const search_words_output_display = document.getElementById('search_words_output_display');

    function hideSearchOutput()
    {
        search_words_output_display.style.display = 'none'
        search_words_input.style.borderRadius = '6px 6px 6px 6px';
        search_words_input.style.borderBottom = '2px solid #2F2F2F';
    }

    document.addEventListener('click', (event) => {
        if (!search_words_output_display.contains(event.target))
        {
            hideSearchOutput();
        }
    });

    nav_discover.addEventListener('click', (event) => {
        event.preventDefault();

        window.location.href = '../Discover/discover.html';
    });

    nav_courses.addEventListener('click', (event) => {
        event.preventDefault();

        window.location.href = '../Courses/courses.html';
    });

    nav_logout.addEventListener('click', (event) => {
        event.preventDefault();

        window.location.href = "../Login/login.html";
        store.set('loggedIn', false);
        store.set('loggedOut', true);
        store.delete('authToken');
    });

    add_words_add.addEventListener('click', () => {
        const german_word = document.getElementById('add_words_german_input').value;
        const english_word = document.getElementById('add_words_english_input').value;

        const username = store.get('username');

        if (german_word && english_word != null)
        {
            const dataToSendAddVocab = ({ word1: german_word, word2: english_word, username: username });

            console.log(dataToSendAddVocab);
            fetch(`${api_addr}/vocab/add`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dataToSendAddVocab),
            })
            .then(response => response.json())
            .then(data => {
                const added = data != null ? data.added : null;

                if (added != null && added == true)
                {
                    const formattedText = `${german_word} | ${english_word}`;

                    your_words_list.value += (your_words_list.value ? '\n' : '') + formattedText;
                    your_words_list.scrollTop = your_words_list.scrollHeight;
                        
                    const option = document.createElement('option');
                    option.value = formattedText;
                    option.textContent = formattedText;
                    delete_words_select.appendChild(option);
                }
            })
            .catch(error => {
                console.error('Fetch error: ', error);
            });
        }
    });

    delete_words_delete.addEventListener('click', () => {
        const selectedOption = delete_words_select.selectedIndex;
        const wordPair = delete_words_select.options[selectedOption].value;

        const words = wordPair.split('|');

        const germanWord = words[0].trim();
        const englishWord = words[1].trim();

        const username = store.get('username');

        const dataToSendDeleteVocab = ({ german: germanWord, english: englishWord, username: username });

        fetch(`${api_addr}/vocab/delete`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dataToSendDeleteVocab),
        })
        .then(response => response.json())
        .then(data => {
            const isDeleted = data.deleted;

            let valueToRemove = wordPair;

            if (isDeleted)
            {
                let currentValue = your_words_list.value;
                const lines = currentValue.split('\n');

                const filteredLines = lines.filter(line => line.trim() !== valueToRemove);

                currentValue = filteredLines.join('\n');

                your_words_list.value = currentValue;
            }
        })
        .catch(error => {
            console.error('Fetch error: ', error);
        });
    });

    search_words_input.addEventListener('keydown', async (event) => {
        if (event.key === 'Enter') 
        {
            try 
            {
                const output = await search(search_words_input.value);
    
                if (output) 
                {
                    search_words_input.style.borderRadius = '6px 6px 0px 0px';
                    search_words_input.style.borderBottom = 'none';
                    search_words_output_display.style.display = 'block';

                    let outputText = `${output.german} | ${output.english} | ${output.difficulty}`;
                    
                    search_words_output_display.textContent = outputText;
                    search_words_output_display.scrollTop = search_words_output_display.scrollHeight;
                } 
            } 
            catch (error) 
            {
                console.error('Error in search:', error);
            }
        }
    });

    search_words_search.addEventListener('click', async () => {
        try 
        {
            const output = await search(search_words_input.value);

            if (output) 
            {
                search_words_input.style.borderRadius = '6px 6px 0px 0px';
                search_words_input.style.borderBottom = 'none';
                search_words_output_display.style.display = 'block';

                let outputText = `${output.german} | ${output.english} | ${output.difficulty}`;
                
                search_words_output_display.textContent = outputText;
            } 
        } 
        catch (error) 
        {
            console.error('Error in search:', error);
        }
    });

    async function search(input) 
    {
        const username = store.get('username');
         
        if (input.length > 0)
        {
            return new Promise((resolve, reject) => {
                if (input.length !== 0) 
                {
                    let dataToSendVocabSearch = { input, username };
        
                    fetch(`${api_addr}/search`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(dataToSendVocabSearch)
                    })
                    .then((response) => response.json())
                    .then((data) => {
                        console.log(data);
                        resolve({
                            german: data.german,
                            english: data.english,
                            difficulty: data.difficulty
                        });
                    })
                    .catch((err) => {
                        reject(err);
                    });
                }
                else 
                {
                    resolve(null);
                }
            }); 
        }
    }
});