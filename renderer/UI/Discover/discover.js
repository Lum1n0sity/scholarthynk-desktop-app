const Store = require('electron-store');
const { ipcRenderer } = require('electron');

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
            new_selected_image = filePath;
        });

        ipcRenderer.on('file-dialog-canceled', (event) => {
            new_selected_image = null;
        });
    });

    add_topic_btn.addEventListener('click', () => {
        const topic_name = topic_input.value;

        if (topic_name != null)
        {
            const formData = new FormData();
            formData.append('file', new_selected_image);
            formData.append('name', topic_name);

            fetch(`${api_addr}/discover/topic/add`)
        }
    });
});