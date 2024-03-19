const rootPathIndex = require('electron-root-path').rootPath;
const pathIndex = require('path');
const { fs, getCurrentLine, ipcRenderer, dialog, shell, Store, google, config } = require(pathIndex.join(rootPathIndex, 'utils.js'));
const devConsoleClass = require('../console');

document.addEventListener('DOMContentLoaded', () => {
    const devConsole = new devConsoleClass('console_output');
    const store = new Store();

    const role = store.get('role');
    const lang = store.get('lang');

    const studentFeatures = document.getElementById('student');
    const teacherFeatures = document.getElementById('teacher');
    const devFeatures = document.getElementById('dev');

    // * User display
    const username_display = document.getElementById('username');
    const orga_role = document.getElementById('school_role');

    username_display.textContent = store.get('username');
    
    const orga_role_text = `${store.get('school')} - ${role.charAt(0).toUpperCase() + role.slice(1)}`;
    orga_role.textContent = orga_role_text;

    const command_input = document.getElementById('command_input');

    // * Teacher student base:
    const students_list = document.getElementById('students-list');

    // * Dev Schools base:
    const schools_list = document.getElementById('schools_list');

    if (role == 'student')
    {
        studentFeatures.style.display = 'block';
    }
    else if (role == 'teacher')
    {
        // * ID: 1; Get all students
        const school = store.get('school');
        const schoolName = ({ school: school });

        fetch(`${config.apiUrl}/teacher/get-students`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(schoolName)
        })
        .then(response => response.json())
        .then(data => {
            const students = data.students;

            students.forEach(async (student) => {
                let isExpanded = false;

                const student_list_button = document.createElement('div');
                student_list_button.classList.add('student-list-button');
            
                student_list_button.textContent = student;
            
                student_list_button.addEventListener('click', async () => {
                    student_list_button.classList.remove('expanded');
                    try 
                    {
                        const studentData = await getStudentsData(student, school);
                        
                        if (isExpanded)
                        {
                            student_list_button.classList.remove('expanded');
                            isExpanded = false;

                            const p_elements = student_list_button.querySelectorAll('.student-info-p');
                            const update_button = student_list_button.querySelector('.update-students');

                            p_elements.forEach(element => {
                                element.remove();
                            });

                            update_button.remove();
                        }
                        else
                        {
                            student_list_button.classList.add('expanded');
                            isExpanded = true;

                            const grade_p = document.createElement('p');
                            const graduationYear_p = document.createElement('p');
                            const update_student_btn = document.createElement('button');

                            update_student_btn.textContent = 'Update';
                            if (lang == 'en')
                            {
                                grade_p.textContent = `Grade: ${studentData.studentInfo.grade}`;
                                graduationYear_p.textContent = `Expected Graduation Year: ${studentData.studentInfo.expectedGraduationYear}`;
                            }
                            else if (lang == 'de')
                            {
                                grade_p.textContent = `Klasse: ${studentData.studentInfo.grade}`;
                                graduationYear_p.textContent = `Abschlussjahr: ${studentData.studentInfo.expectedGraduationYear}`;
                            }

                            grade_p.classList.add('student-info-p');
                            graduationYear_p.classList.add('student-info-p');
                            update_student_btn.classList.add('button');
                            update_student_btn.classList.add('update-students');

                            update_student_btn.addEventListener('click', () => {
                                openStudentManager();
                            });

                            student_list_button.appendChild(grade_p);
                            student_list_button.appendChild(graduationYear_p);
                            student_list_button.appendChild(update_student_btn);
                        }
                    } 
                    catch (error) 
                    {
                        console.error('Error loading student data: ', error);
                    }
                });
            
                students_list.appendChild(student_list_button);
            });
        })
        .catch(error => {
            console.error('Fetch error', error);
        });

        teacherFeatures.style.display = 'block';
    }
    else if (role == 'developer')
    {
        // * Get all stored school names and display them in the schools list
        fetch(`${config.apiUrl}/dev/get-schools`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            }
        })
        .then(response => response.json())
        .then(data => {
            const schools = data.schools;

            schools.forEach(school => {
                const schoolListItem = document.createElement('p');
                schoolListItem.classList.add('school-list-item');

                schoolListItem.textContent = school;

                schools_list.appendChild(schoolListItem);
            });
        })
        .catch(error => {
            devConsole.error('Fetch error');
            console.error('Fetch error: ', error);
        });

        devFeatures.style.display = 'block';
    }

    const background = document.getElementById('background');

    // ! Student:


    // ! Teacher:
    // * Open / Close student manager:
    const update_students = document.getElementById('update_students');
    const student_manager = document.getElementById('student_manager');
    const close_student_manager = document.getElementById('close_student_manager');

    update_students.addEventListener('click', () => {
        openStudentManager();
    });

    // * Search students:
    const input_student = document.getElementById('search_student_input');

    input_student.addEventListener('keyup', (event) => {
        if (event.key === "Enter")
        {
            students_list.innerHTML = '';

            const input = input_student.value;
            const school = store.get('school');
    
            const queryData = ({ input: input, school: school });
    
            fetch(`${config.apiUrl}/teacher/search-student`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(queryData)
            })
            .then(response => response.json())
            .then(data => {
                const searchResults = data.searchResults;

                if (searchResults.length != 0)
                {
                    searchResults.forEach(result => {
                        const student_list_button = document.createElement('button');
                        student_list_button.classList.add('student-list-button');

                        student_list_button.textContent = result.name;
                    
                        student_list_button.addEventListener('click', async () => {
                            student_list_button.classList.remove('expanded');
                            try 
                            {
                                const studentData = await getStudentsData(student, school);
                                
                                if (isExpanded)
                                {
                                    student_list_button.classList.remove('expanded');
                                    isExpanded = false;
        
                                    const p_elements = student_list_button.querySelectorAll('.student-info-p');
                                    const update_button = student_list_button.querySelector('.update-students');
        
                                    p_elements.forEach(element => {
                                        element.remove();
                                    });
        
                                    update_button.remove();
                                }
                                else
                                {
                                    student_list_button.classList.add('expanded');
                                    isExpanded = true;
        
                                    const grade_p = document.createElement('p');
                                    const graduationYear_p = document.createElement('p');
                                    const update_student_btn = document.createElement('button');
        
                                    if (lang == 'en')
                                    {
                                        grade_p.textContent = `Grade: ${studentData.studentInfo.grade}`;
                                        graduationYear_p.textContent = `Expected Graduation Year: ${studentData.studentInfo.expectedGraduationYear}`;
                                        edit_btn.textContent = 'Edit';
                                    }
                                    else if (lang == 'de')
                                    {
                                        grade_p.textContent = `Klasse: ${studentData.studentInfo.grade}`;
                                        graduationYear_p.textContent = `Abschlussjahr: ${studentData.studentInfo.expectedGraduationYear}`;
                                        edit_btn.textContent = 'Bearbeiten';
                                    }
        
                                    grade_p.classList.add('student-info-p');
                                    graduationYear_p.classList.add('student-info-p');
                                    update_student_btn.classList.add('button');
                                    update_student_btn.classList.add('update-students');
        
                                    update_student_btn.addEventListener('click', () => {
                                        openStudentManager();
                                    });
        
                                    student_list_button.appendChild(grade_p);
                                    student_list_button.appendChild(graduationYear_p);
                                    student_list_button.appendChild(update_student_btn);
                                }
                            } 
                            catch (error) 
                            {
                                console.error('Error loading student data: ', error);
                            }
                        });
                    
                        students_list.appendChild(student_list_button);
                    });
                }
            })
            .catch(error => {
                console.error('Fetch error: ', error);
            });
        }
    });

    async function getStudentsData(student, school) 
    {
        const studentQueryData = { student: student, school: school };
    
        try 
        {
            const response = await fetch(`${config.apiUrl}/teacher/get-student-info`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(studentQueryData)
            });
    
            const data = await response.json();
            return data;
        } 
        catch (error) 
        {
            console.error('Fetch error: ', error);
            throw error;
        }
    }

    async function getStudents(school) 
    {
        const schoolQueryData = { school: school };
        
        try 
        {
            const response = await fetch(`${config.apiUrl}/teacher/get-students`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(schoolQueryData),
            });

            const data = await response.json();
            return data;
        }
        catch (error) 
        {
            console.error('Fetch error: ', error);
            throw error;
        }
    }

    async function openStudentManager()
    {
        let isExpanded = false;

        student_manager.style.display = 'block';
        background.style.display = 'block';

        // * Load students:

        const school = store.get('school');
        const studentsResult = await getStudents(school);

        const students = studentsResult.students;

        const gradeDivs = Array.from({ length: 10 }, (_, index) => document.getElementById(`grade_${index + 1}`));

        for (const student of students)
        {
            const name = student;

            const student_list_button = document.createElement('button');
            student_list_button.classList.add('student-list-button');
            student_list_button.classList.add('student-manager-student')
            student_list_button.classList.add('draggable');

            student_list_button.id = generateUniqueId();
        
            student_list_button.setAttribute('draggable', true);

            student_list_button.textContent = name;

            const studentData = await getStudentsData(name, school);

            student_list_button.addEventListener('dragstart', (event) => {
                drag(event);
            });

            student_list_button.addEventListener('click', async () => {
                student_list_button.classList.remove('expanded');
                try 
                {
                    const studentData = await getStudentsData(name, school);
                    
                    if (isExpanded)
                    {
                        student_list_button.classList.remove('expanded');
                        isExpanded = false;
    
                        const p_elements = student_list_button.querySelectorAll('.student-info-p');
                        const button = student_list_button.querySelectorAll('.button');

                        p_elements.forEach(element => {
                            element.remove();
                        });

                        button.forEach(element => {
                            element.remove();
                        });
                    }
                    else
                    {
                        student_list_button.classList.add('expanded');
                        isExpanded = true;
    
                        const grade_p = document.createElement('p');
                        const graduationYear_p = document.createElement('p');
                        const btn_div = document.createElement('div');
                        const edit_btn = document.createElement('button');
                        const delete_btn = document.createElement('button');
    
                        if (lang == 'en')
                        {
                            grade_p.textContent = `Grade: ${studentData.studentInfo.grade}`;
                            graduationYear_p.textContent = `Expected Graduation Year: ${studentData.studentInfo.expectedGraduationYear}`;
                            edit_btn.textContent = 'Edit';
                            delete_btn.textContent = 'Delete';
                        }
                        else if (lang == 'de')
                        {
                            grade_p.textContent = `Klasse: ${studentData.studentInfo.grade}`;
                            graduationYear_p.textContent = `Abschlussjahr: ${studentData.studentInfo.expectedGraduationYear}`;
                            edit_btn.textContent = 'Bearbeiten';
                            delete_btn.textContent = 'Löschen';
                        }
    
                        grade_p.classList.add('student-info-p');
                        grade_p.classList.add('exclude');
                        graduationYear_p.classList.add('student-info-p');
                        graduationYear_p.classList.add('exclude');
                        btn_div.classList.add('btn-div');
                        edit_btn.classList.add('update-students');
                        edit_btn.classList.add('button');
                        edit_btn.classList.add('edit-student-manager');
                        edit_btn.classList.add('exclude');
                        delete_btn.classList.add('delete-student');
                        delete_btn.classList.add('button');
                        delete_btn.classList.add('exclude');

                        edit_btn.addEventListener('click', () => {
                            const student_name = getTextContentRecursive(student_list_button, 'exclude');
                
                            openStudentEditor(student_name);
                        });

                        delete_btn.addEventListener('click', () => {
                            const student_name = getTextContentRecursive(student_list_button, 'exclude');
    
                            openDeleteWarning(student_name);
                        });
    
    
                        btn_div.appendChild(edit_btn);
                        btn_div.appendChild(delete_btn);

                        student_list_button.appendChild(grade_p);
                        student_list_button.appendChild(graduationYear_p);
                        student_list_button.appendChild(btn_div);
                    }
                } 
                catch (error) 
                {
                    console.error('Error loading student data: ', error);
                }
            });
        
            const gradeDiv = gradeDivs[studentData.studentInfo.grade - 1];

            if (gradeDiv) 
            {
                const existingButton = gradeDiv.querySelector('.add-student');

                gradeDiv.insertBefore(student_list_button, existingButton);
            } 
            else 
            {
                console.error(`Invalid grade: ${studentData.studentInfo.grade}`);
            }

            // students_list.appendChild(student_list_button);
        }
    }

    close_student_manager.addEventListener('click', () => {
        student_manager.style.display = 'none';
        background.style.display = 'none';

        //* Unload students:
        const students = document.querySelectorAll('.student-manager-student');

        students.forEach(element => {
            element.remove();
        });
    });

    function allowDrop(event)
    {
        event.preventDefault();
    }

    function drag(event)
    {
        if (event.target.classList.contains('draggable'))
        {
            event.dataTransfer.setData('text', event.target.id)
        }
    }

    const gradeDivs = document.querySelectorAll('.grade');

    function drop(event) 
    {
        event.preventDefault();
        var data = event.dataTransfer.getData('text');
        var draggableElement = document.getElementById(data);
        
        if (draggableElement.classList.contains('draggable') && event.target.classList.contains('valid-drop-target')) 
        {
            const existingButton = event.target.querySelector('.add-student');
            event.target.insertBefore(draggableElement, existingButton);

            const school = store.get('school');
            const student = draggableElement.textContent;
            const gradeRaw = event.target.id;

            const gradeNumber = parseInt(gradeRaw.replace(/^grade_/, ''), 10);

            updateStudentData(student, school, gradeNumber);
        }
    }

    gradeDivs.forEach(div => {
        div.addEventListener('dragover', (event) => {
            allowDrop(event);
        });

        div.addEventListener('drop', (event) => {
            drop(event);
        });
    });

    function updateStudentData(student, school, grade)
    {
        const updateData = ({ student: student, school: school, grade: grade });

        fetch(`${config.apiUrl}/teacher/update-student-info`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updateData)
        });
    }

    const open_add_school_btns = document.querySelectorAll('.add-student');
    const add_student_win = document.getElementById('add_student_win');
    const close_student_win = document.getElementById('close_add_student');
    const add_student = document.getElementById('add-student-data');

    open_add_school_btns.forEach(button => {
        button.addEventListener('click', () => {
            add_student_win.style.display = 'block';

            const grade_input = document.getElementById('student_grade');
            
            const classList = button.classList;
            
            let gradeNumber = null;

            for (const className of classList) 
            {
                if (className.startsWith('grade_')) 
                {
                    gradeNumber = parseInt(className.replace(/^grade_/, ''), 10);
                    break;
                }
            }

            grade_input.value = gradeNumber;
        });
    })

    close_student_win.addEventListener('click', () => {
        add_student_win.style.display = 'none';
    });

    add_student.addEventListener('click', async () => {
        const name = document.getElementById('student_name').value;
        const grade = document.getElementById('student_grade').value;
        const school = store.get('school');

        const studentData = ({ name: name, grade: grade, school: school });

        fetch(`${config.apiUrl}/teacher/add-student`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(studentData)
        })
        .then(response => response.json())
        .then(data => {
            addStudent(name, school, grade);
        })
        .catch(err => {
            console.error('Fetch error: ', err);
        });
    });

    async function addStudent(name, school, grade) 
    {
        const gradeDiv = document.getElementById(`grade_${grade}`);

        const student_list_button = document.createElement('button');
        student_list_button.classList.add('student-list-button');
        student_list_button.classList.add('student-manager-student')
        student_list_button.classList.add('draggable');

        student_list_button.id = generateUniqueId();
    
        student_list_button.setAttribute('draggable', true);

        student_list_button.textContent = name;

        student_list_button.addEventListener('dragstart', (event) => {
            drag(event);
        });

        student_list_button.addEventListener('click', async () => {
            student_list_button.classList.remove('expanded');
            try 
            {
                const studentData = await getStudentsData(name, school);

                if (isExpanded)
                {
                    student_list_button.classList.remove('expanded');
                    isExpanded = false;
                
                    const p_elements = student_list_button.querySelectorAll('.student-info-p');
                    const button = student_list_button.querySelectorAll('.button');

                    p_elements.forEach(element => {
                        element.remove();
                    });

                    button.forEach(element => {
                        element.remove();
                    });
                }
                else
                {
                    student_list_button.classList.add('expanded');
                    isExpanded = true;

                    const grade_p = document.createElement('p');
                    const graduationYear_p = document.createElement('p');
                    const btn_div = document.createElement('div');
                    const edit_btn = document.createElement('button');
                    const delete_btn = document.createElement('button');

                    if (lang == 'en')
                    {
                        grade_p.textContent = `Grade: ${studentData.studentInfo.grade}`;
                        graduationYear_p.textContent = `Expected Graduation Year: ${studentData.studentInfo.expectedGraduationYear}`;
                        edit_btn.textContent = 'Edit';
                        delete_btn.textContent = 'Delete';
                    }
                    else if (lang == 'de')
                    {
                        grade_p.textContent = `Klasse: ${studentData.studentInfo.grade}`;
                        graduationYear_p.textContent = `Abschlussjahr: ${studentData.studentInfo.expectedGraduationYear}`;
                        edit_btn.textContent = 'Bearbeiten';
                        delete_btn.textContent = 'Löschen';
                    }

                    grade_p.classList.add('student-info-p');
                    grade_p.classList.add('exclude');
                    graduationYear_p.classList.add('student-info-p');
                    graduationYear_p.classList.add('exclude');
                    btn_div.classList.add('btn-div');
                    edit_btn.classList.add('update-students');
                    edit_btn.classList.add('button');
                    edit_btn.classList.add('edit-student-manager');
                    edit_btn.classList.add('exclude');
                    delete_btn.classList.add('delete-student');
                    delete_btn.classList.add('button');
                    delete_btn.classList.add('exclude');

                    edit_btn.addEventListener('click', () => {
                        const student_name = getTextContentRecursive(student_list_button, 'exclude');
            
                        openStudentEditor(student_name);
                    });

                    delete_btn.addEventListener('click', () => {
                        const student_name = getTextContentRecursive(student_list_button, 'exclude');

                        openDeleteWarning(student_name);
                    });

                    btn_div.appendChild(edit_btn);
                    btn_div.appendChild(delete_btn);

                    student_list_button.appendChild(grade_p);
                    student_list_button.appendChild(graduationYear_p);
                    student_list_button.appendChild(btn_div);
                }
            } 
            catch (error) 
            {
                console.error('Error loading student data: ', error);
            }
        });
    
        const add_student = gradeDiv.querySelector('.add-student');

        gradeDiv.insertBefore(student_list_button, add_student);
    }

    const edit_student_win = document.getElementById('edit_student_win');
    const close_edit_win = document.getElementById('close_edit_student');
    const update_student_data = document.getElementById('edit-student-data');

    async function openStudentEditor(name)
    {
        edit_student_win.style.display = 'block';

        // * Load student data
        const school = store.get('school');

        const studentData = await getStudentsData(name, school);
        
        const name_input = document.getElementById('student_name_edit');
        const grade_input = document.getElementById('student_grade_edit');
        const year_input = document.getElementById('student_grad_year_edit');

        name_input.value = name;
        grade_input.value = studentData.studentInfo.grade;
        year_input.value = studentData.studentInfo.expectedGraduationYear;
    }

    close_edit_win.addEventListener('click', () => {
        edit_student_win.style.display = 'none';

        // * Unload data
        const name_input = document.getElementById('student_name_edit');
        const grade_input = document.getElementById('student_grade_edit');
        const year_input = document.getElementById('student_grad_year_edit');
        
        name_input.value = '';
        grade_input.value = '';
        year_input.value = '';
    });

    update_student_data.addEventListener('click', () => {
        const school = store.get('school');
        const name = document.getElementById('student_name_edit').value;
        const grade = document.getElementById('student_grade_edit').value;
        const year = document.getElementById('student_grad_year_edit').value;

        const updatedData = ({ school: school, name: name, grade: grade, year: year });

        fetch(`${config.apiUrl}/teacher/update-student`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedData)
        })
        .then(response => response.json())
        .then(data => {
            const updated = data.updated;
            const grade_updated = data.grade; 

            if (updated)
            {
                const buttons = student_manager.querySelectorAll('button');
                
                let student;
                buttons.forEach(button => {
                    if (button.textContent.trim() === name)
                    {
                      student = button;
                    }
                });

                const gradeDiv = document.getElementById(`grade_${grade_updated}`);
                const add_student = gradeDiv.querySelector('.add-student');

                gradeDiv.insertBefore(student, add_student);

                edit_student_win.style.display = 'none';

                // * Unload data
                const name_input = document.getElementById('student_name_edit');
                const grade_input = document.getElementById('student_grade_edit');
                const year_input = document.getElementById('student_grad_year_edit');
                
                name_input.value = '';
                grade_input.value = '';
                year_input.value = '';
            }
        })
        .catch(err => {
            console.error('Fetch error: ', err);
        });
    });

    const delete_warning = document.getElementById('delete_warning');
    const delete_warning_cancel = document.getElementById('delete_warning_cancel');
    const delete_warning_delete = document.getElementById('delete_warning_delete');

    function openDeleteWarning(name)
    {
        delete_warning.style.display = 'block';
        store.set('delete-student', name);
    }

    delete_warning_cancel.addEventListener('click', () => {
        delete_warning.style.display = 'none';
    });

    delete_warning_delete.addEventListener('click', () => {
        const name = store.get('delete-student');
        const school = store.get('school');

        if (name.length != 0)
        {
            store.delete('delete-student');
            
            const studentRemoveData = ({ school: school, name: name });

            fetch(`${config.apiUrl}/teacher/delete-student`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(studentRemoveData)
            })
            .then(response => response.json())
            .then(data => {
                const removed = data.removed;

                if (removed)
                {
                    delete_warning.style.display = 'none';

                    const buttons = student_manager.querySelectorAll('button');
                
                    let student;
                    buttons.forEach(button => {
                        if (button.textContent.trim() === name)
                        {
                          student = button;
                        }
                    });

                    student.remove();
                }
            })
            .catch(err => {
                console.error('Fetch error: ', err);
            });
        }
        else
        {
            delete_warning.style.display = 'none';
        }
    });
        
    // ! Developer:

    // * Add School:
    const open_add_school = document.getElementById('add-school');
    const add_school_win = document.getElementById('add-school-win');
    const load_school_data = document.getElementById('load_school_data');
    const submit_data = document.getElementById('submit_data');
    const cancel_adding_school = document.getElementById('cancel_adding_school');

    let schoolDataFile = '';

    open_add_school.addEventListener('click', () => {
        background.style.display = 'block';
        add_school_win.style.display = 'flex';
    });

    cancel_adding_school.addEventListener('click', () => {
        background.style.display = 'none';
        add_school_win.style.display = 'none';
    });

    load_school_data.addEventListener('click', () => {
        ipcRenderer.send('open-file-dialog');
                
        ipcRenderer.on('selected-file', (event, filePath) => {
            schoolDataFile = filePath;
        });

        ipcRenderer.on('file-dialog-canceled', (event) => {
            schoolDataFile = '';
            background.style.display = 'none';
            add_school_win.style.display = 'none';
        });
    });

    submit_data.addEventListener('click', () => {
        if (schoolDataFile.length != 0) 
        {
            load_school_data.style.border = "none";
    
            fs.readFile(schoolDataFile, 'utf-8', (err, fileData) => {
                if (err) 
                {
                    console.error('Error reading file: ', err);
                } 
                else 
                {
                    try 
                    {
                        const jsonData = JSON.parse(fileData);
    
                        fetch(`${config.apiUrl}/dev/add-school`, {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
                            body: JSON.stringify(jsonData)
                        })
                        .then(response => response.json())
                        .then(data => {
                            console.log(data);
                            const schoolAdded = data != null ? data.schoolAdded : null;

                            if (schoolAdded)
                            {
                                const schoolListItem = document.createElement('p');
                                schoolListItem.classList.add('school-list-item');
                                
                                schoolListItem.textContent = jsonData.schoolName;

                                schools_list.appendChild(schoolListItem);

                                background.style.display = 'none';
                                add_school_win.style.display = 'none';
                            }
                            else
                            {
                                console.error('Unable to add school!');
                                devConsole.error('Unable to add school!');
                            }
                        })
                        .catch(error => {
                            console.error('Fetch error: ', error);
                            devConsole.error('Fetch error');
                        });
                    } 
                    catch (parseError) 
                    {
                        console.error('Error parsing JSON: ', parseError);
                        devConsole.error(`Error parsing JSON: ${parseError}`);
                    }
                }
            });
        } 
        else 
        {
            load_school_data.style.border = "2px solid #ab0000";
        }
    });

    function generateUniqueId() 
    {
        return 'btn_' + Math.floor(Math.random() * 1000);
    }

    function getTextContentRecursive(element, excludeClassName) 
    {
        let textContent = '';
    
        for (const node of element.childNodes) 
        {
          if (node.nodeType === 3) 
          {
            textContent += node.textContent.trim();
          } 
          else if (node.nodeType === 1 && !node.classList.contains(excludeClassName)) 
          {
            textContent += getTextContentRecursive(node, excludeClassName);
          }
        }
    
        return textContent;
    }

    // * Delete school:



    // * Dev Console:
    const toggle_console = document.getElementById('toggle_console');
    const dev_console = document.getElementById('dev-console');

    const user_card = document.getElementById('user');
    const user_options = document.getElementById('user_options');

    toggle_console.addEventListener('click', () => {
        dev_console.style.display = dev_console.style.display === 'flex' ? 'none' : 'flex';

        if (dev_console.style.display == 'flex')
        {
            user_card.style.marginRight = '46%';
            user_options.style.marginRight = '46%';

            // * Load data:
            devConsole.openConsole();
            devConsole.loadMessages();
        }
        else if (dev_console.style.display == 'none')
        {
            user_card.style.marginRight = '1%';
            user_options.style.marginRight = '1%';

            // * Unload data:
            devConsole.closeConsole();
            document.getElementById('console_output');
            console_output.innerHTML = '';
        }
    });

    command_input.addEventListener('keydown', (event) => {
        if (event.key == 'Enter')
        {
            const command = command_input.value;

            if (command == 'clear')
            {
                devConsole.clear();
                command_input.value = '';
            }
            else if (command == 'getDOM')
            {
                devConsole.getDOM();
                command_input.value = '';
            }
            else if (command == 'displayNetwork')
            {
                devConsole.displayNetwork();
                command_input.value = '';
            }
        }
    });
});

/*
    * Video feed Functionality

    const rootPathIndex = require('electron-root-path').rootPath;
    const pathIndex = require('path');
    const { fs, path, ipcRenderer, dialog, shell, Store, google, config } = require(pathIndex.join(rootPathIndex, 'utils.js'));

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
*/