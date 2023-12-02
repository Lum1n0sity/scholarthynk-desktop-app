const Store = require('electron-store');
const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const { cursorTo } = require('readline');

document.addEventListener('DOMContentLoaded', function () 
{
    const store = new Store();
    const api_addr = "http://192.168.5.21:3000";

    const nav_home = document.getElementById('nav_home');
    const nav_courses = document.getElementById('nav_courses');

    const add_topic = document.getElementById('add_topic');
    const add_topic_win = document.getElementById('add_topic_win');
    const close_add_topic = document.getElementById('close_add_topic');

    const topic_input = document.getElementById('topic_input');
    const select_image = document.getElementById('select_image');
    const add_topic_btn = document.getElementById('add_topic_btn');

    const pop_up_background = document.getElementById('background');

    let new_selected_image;

    nav_home.addEventListener('click', (event) => {
        event.preventDefault();

        window.location.href = '../Home/index.html';
    });

    nav_courses.addEventListener('click', (event) => {
        event.preventDefault();

        window.location.href = '../Courses/courses.html';
    });

    add_topic.addEventListener('click', () => {
        add_topic_win.style.display = 'block';
        pop_up_background.style.display = 'block';
    });

    close_add_topic.addEventListener('click', () => {
        add_topic_win.style.display = 'none';
        pop_up_background.style.display = 'none';
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
                            const template = document.getElementById('topic_list_template');

                            const clonedTemplate = document.importNode(template.content, true);

                            const imgElement = clonedTemplate.querySelector('img');
                            imgElement.src = new_selected_image;

                            const title = clonedTemplate.querySelector('h3');
                            title.textContent = topic_name;

                            document.getElementById('topic_list').appendChild(clonedTemplate);
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
});