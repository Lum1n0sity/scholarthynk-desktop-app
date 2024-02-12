const rootPathIndex = require('electron-root-path').rootPath;
const pathIndex = require('path');
const { fs, path, ipcRenderer, dialog, shell, Store, google, config } = require(pathIndex.join(rootPathIndex, 'utils.js'));

document.addEventListener('DOMContentLoaded', async () => {
    const store = new Store();

    fetch(`${config.apiUrl}/vocab/load`, {
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

    const subject_select = document.getElementById('subject_select');
    const english = document.getElementById('english');
    const german = document.getElementById('german');
    const math = document.getElementById('math');
    
    // * English:

    // * Vocabulary features

    const vocabopen = document.getElementById('vocabopen');
    const vocab_popup = document.getElementById('vocab_popup');
    const close_vocab = document.getElementById('close_vocab');

    const add_words_add = document.getElementById('add_words_add');
    const delete_words_delete = document.getElementById('delete_words_delete');

    const search_words_input = document.getElementById('search_words_input');
    const search_words_search = document.getElementById('search_words_search');
    const search_words_output_display = document.getElementById('search_words_output_display');

    // * Grammar Checker

    const grammarchecker = document.getElementById('grammarchecker');
    const grammarchecker_popup = document.getElementById('grammarchecker_popup');
    const close_grammarchecker = document.getElementById('close_grammarchecker');

    const start_check = document.getElementById('start_check');
    const text_input = document.getElementById('text_input');

    let subjectLang;

    // * Video feed

    const scrollBar = document.getElementById('scroll-bar');
    const navigatorLeft = document.getElementById('navigator-left');
    const navigatorRight = document.getElementById('navigator-right');

    const videoContainer = document.getElementById('video-container');

    // * Subject select Functionality

    subject_select.addEventListener('change', () => {
        const subjectI = subject_select.selectedIndex;
        const subject = subject_select.options[subjectI].value;

        if (subject == 'english')
        {
            english.style.display = 'block';
            german.style.display = 'none';
            math.style.display = 'none';
            subjectLang = 'en';
        }
        else if (subject == 'german')
        {
            english.style.display = 'none';
            german.style.display = 'block';
            math.style.display = 'none';
            subjectLang = 'de';
        }
        else if (subject == 'math')
        {
            english.style.display = 'none';
            german.style.display = 'none';
            math.style.display = 'block';
        }
    });

    // * Vocabulary features Functionality

    vocabopen.addEventListener('click', () => {vocab_popup.style.display = 'block';});
    close_vocab.addEventListener('click', () => {vocab_popup.style.display = 'none';});

    function hideSearchOutput()
    {
        search_words_output_display.style.display = 'none'
        search_words_input.style.borderRadius = '6px 6px 6px 6px';
    }

    document.addEventListener('click', (event) => {
        if (!search_words_output_display.contains(event.target))
        {
            hideSearchOutput();
        }
    });

    add_words_add.addEventListener('click', () => {
        const german_word = document.getElementById('add_words_german_input').value;
        const english_word = document.getElementById('add_words_english_input').value;

        const username = store.get('username');

        if (german_word && english_word != null)
        {
            const dataToSendAddVocab = ({ word1: german_word, word2: english_word, username: username });

            console.log(dataToSendAddVocab);
            fetch(`${config.apiUrl}/vocab/add`, {
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

        fetch(`${config.apiUrl}/vocab/delete`, {
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

                const options = delete_words_select.options;
                for (let i = options.length - 1; i >= 0; i--)
                {
                    if (options[i].value == wordPair)
                    {
                        options[i].remove();
                    }
                }

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
        
                    fetch(`${config.apiUrl}/search`, {
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

    // * Grammarchecker Functionality
    // ! Grammarchecker features is on Hold! View ClickUp Board (App-ScholarThynk);

    grammarchecker.addEventListener('click', () => {
        grammarchecker_popup.style.display = 'block';
    });

    close_grammarchecker.addEventListener('click', () => {
        grammarchecker_popup.style.display = 'none';
    });

    start_check.addEventListener('click', () => {
        const text = text_input.value;

        if (text.length != 0)
        {
            const dataToSendGrammarCheck = ({ text: text, lang: subjectLang });

            fetch(`${config.apiUrl}/grammar/check`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dataToSendGrammarCheck)
            })
            .then(response => response.json())
            .then(data => {
                console.log(data);
            })
            .catch(error => {
                console.error('Fetch error: ', error);
            });
        }
    });

    // * Video feed Functionality

    async function getVideos() 
    {
        const apiKey = 'AIzaSyAvoQu_3_sTw9soEv2w7qtOwVXQSELxqM4';
      
        const service = google.youtube({ version: 'v3', auth: apiKey });
      
        const request = {
            part: 'snippet',
            q: 'funny',
            type: 'video',
            maxResults: 50,
            chart: 'mostPopular',
            regionCode: 'US',
            relevanceLanguage: 'en',
            contentType: 'VIDEO',
            musicFilter: 1,
        };     

        const response = await service.videos.list(request);
        const allVideos = response.data.items;

        allVideos.forEach((video) => {
            const videoId = video.id;
            const videoTitle = video.snippet.title;
            const thumbnailUrl = video.snippet.thumbnails.medium.url;
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

            const videoElement = document.createElement('a');
            videoElement.href = videoUrl;
            videoElement.className = 'video';

            videoElement.addEventListener('click', (event) => {
                event.preventDefault();
                shell.openExternal(videoUrl);
            });

            const thumbnailElement = document.createElement('img');
            thumbnailElement.src = thumbnailUrl;
            thumbnailElement.className = 'thumbnail';

            const titleElement = document.createElement('p');
            titleElement.textContent = videoTitle;
            titleElement.className = 'vid_title';

            if (videoTitle.length > 16.8) 
            {
                titleElement.style.whiteSpace = 'normal';
            }

            videoElement.appendChild(thumbnailElement);
            videoElement.appendChild(titleElement);

            videoContainer.appendChild(videoElement);
        });
    }

    getVideos();

    let currentFeedIndex = 0;

    function scrollVideos(direction) 
    {
        const videos = document.querySelectorAll('.video');
        const videoWidth = videos.length > 0 ? videos[0].offsetWidth : 0;
        const containerWidth = scrollBar.offsetWidth;
        const maxIndex = videos.length - Math.floor(containerWidth / videoWidth);
    
        if (direction == 'left' && currentFeedIndex > 0) 
        {
            currentFeedIndex--;
        } 
        else if (direction == 'right' && currentFeedIndex < maxIndex) 
        {
            currentFeedIndex++;
        }
    
        const newPosition = -currentFeedIndex * videoWidth;
        videoContainer.style.transform = `translateX(${newPosition}px)`;
    
        navigatorLeft.disabled = currentFeedIndex == 0;
        navigatorRight.disabled = currentFeedIndex == maxIndex;
    }
    
    navigatorLeft.addEventListener('click', () => {
        scrollVideos('left');
    });
    
    navigatorRight.addEventListener('click', () => {
        scrollVideos('right');
    });    
});