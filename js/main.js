// -------------------------
// LOAD STUDENTS
// -------------------------
let students = JSON.parse(localStorage.getItem('students')) || [];

// Ensure all students have consistent structure
students = students.map(s => ({
    roll: s.roll,
    name: s.name,
    class: s.class,
    photo: s.photo || '',
    present: s.present || 0,
    absent: s.absent || 0,
    marks: s.marks || null,
    grade: s.grade || null
}));

// -------------------------
// DOM ELEMENTS
// -------------------------
const studentForm = document.getElementById('studentForm');
const studentList = document.getElementById('studentList');
const marksForm = document.getElementById('marksForm');
const studentSelect = document.getElementById('studentSelect');
const performanceChart = document.getElementById('performanceChart').getContext('2d');
const classFilter = document.getElementById("classFilter");
const searchInput = document.getElementById('searchStudent');
const searchResultsDiv = document.getElementById('searchResults');
let chartInstance;

// -------------------------
// ADD STUDENT
// -------------------------
studentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const file = document.getElementById('photo').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            addStudent(event.target.result);
        }
        reader.readAsDataURL(file);
    } else {
        addStudent('');
    }
});

function addStudent(photo){
    const classValue = document.getElementById('class').value;
    const student = {
        roll: document.getElementById('roll').value,
        name: document.getElementById('name').value,
        class: classValue.startsWith('Class ') ? classValue : `Class ${classValue}`,
        photo: photo,
        present: 0,
        absent: 0,
        marks: null,
        grade: null
    };
    students.push(student);
    localStorage.setItem('students', JSON.stringify(students));
    studentForm.reset();
    renderStudents();
}

// -------------------------
// DELETE STUDENT
// -------------------------
function deleteStudent(index){
    if(confirm("Are you sure you want to delete this student?")){
        students.splice(index, 1);
        localStorage.setItem('students', JSON.stringify(students));
        renderStudents();
    }
}

// -------------------------
// RENDER STUDENTS
// -------------------------
function renderStudents(list = students){
    list = [...list].sort((a,b) => parseInt(a.class.replace('Class ','')) - parseInt(b.class.replace('Class ','')));
    studentList.innerHTML = '';
    list.forEach(s => {
        const index = students.findIndex(st => st.roll === s.roll);
        const total = s.present + s.absent;
        const percent = total === 0 ? 0 : ((s.present / total) * 100).toFixed(1);
        let color = 'text-red-600';
        if (percent >= 75) color = 'text-green-600';
        else if (percent >= 50) color = 'text-orange-600';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td class="border p-3 text-center font-semibold text-gray-800">${s.roll}</td>
            <td class="border p-3">
                <div class="flex items-center space-x-4">
                    ${s.photo ? `<img src="${s.photo}" class="w-12 h-12 rounded-full object-cover shadow-sm"/>`
                               : `<div class="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">N/A</div>`}
                    <div class="flex flex-col">
                        <span class="text-lg font-bold text-gray-900">${s.name}</span>
                        ${s.marks ? `<span class="text-sm text-gray-600 mt-1">
                            <span class="font-medium text-blue-600">Math: ${s.marks.maths}</span>,
                            <span class="font-medium text-green-600">Science: ${s.marks.science}</span>,
                            <span class="font-medium text-purple-600">English: ${s.marks.english}</span>
                            <span class="ml-2 px-2 py-0.5 bg-gray-200 rounded text-xs font-semibold text-gray-700">
                                Grade: ${s.grade}
                            </span>
                        </span>` : ''}
                    </div>
                </div>
            </td>
            <td class="border p-3 text-center"><span class="px-3 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold">${s.class}</span></td>
            <td class="border p-3">
                <div class="flex flex-col gap-2">
                    <div class="flex space-x-2">
                        <button onclick="markAttendance(${index},'present')" class="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded shadow">Present</button>
                        <button onclick="markAttendance(${index},'absent')" class="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded shadow">Absent</button>
                        <button onclick="resetAttendance(${index})" class="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1.5 rounded shadow">Reset</button>
                    </div>
                    <div class="bg-gray-50 border rounded p-2 text-sm shadow-inner">
                        <span class="text-gray-700">
                            Present: <span class="font-bold text-green-700">${s.present}</span> |
                            Absent: <span class="font-bold text-red-700">${s.absent}</span> |
                            Total: <span class="font-bold text-blue-700">${total}</span> |
                            Attendance: <span class="font-bold ${color}">${percent}%</span>
                        </span>
                    </div>
                </div>
            </td>
            <td class="border p-3 text-center">
                <button onclick="deleteStudent(${index})" class="bg-red-600 hover:bg-red-700 text-white px-4 py-1.5 rounded shadow">Delete</button>
            </td>
        `;
        studentList.appendChild(row);
    });

    updateStudentSelect(list);
    renderChart(list);
}

// -------------------------
// UPDATE STUDENT DROPDOWN
// -------------------------
function updateStudentSelect(list = students){
    studentSelect.innerHTML = `<option value="">Select Student</option>`;
    list.forEach(s => {
        const index = students.findIndex(st => st.roll === s.roll);
        studentSelect.innerHTML += `<option value="${index}">${s.name} (${s.roll})</option>`;
    });
}

// -------------------------
// ATTENDANCE
// -------------------------
function markAttendance(index, type){
    if(type === 'present') students[index].present++;
    else students[index].absent++;
    localStorage.setItem('students', JSON.stringify(students));
    renderStudents();
}

function resetAttendance(index){
    students[index].present = 0;
    students[index].absent = 0;
    localStorage.setItem('students', JSON.stringify(students));
    renderStudents();
}

// -------------------------
// MARKS
// -------------------------
marksForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const index = studentSelect.value;
    if(index === '') return alert('Select a student!');
    const maths = parseFloat(document.getElementById('maths').value);
    const science = parseFloat(document.getElementById('science').value);
    const english = parseFloat(document.getElementById('english').value);
    students[index].marks = {maths, science, english};
    students[index].grade = calculateGrade((maths+science+english)/3);
    localStorage.setItem('students', JSON.stringify(students));
    marksForm.reset();
    renderStudents();
});

function calculateGrade(avg){
    if(avg >= 90) return "A+";
    if(avg >= 80) return "A";
    if(avg >= 70) return "B";
    if(avg >= 60) return "C";
    return "Fail";
}

// -------------------------
// PERFORMANCE CHART
// -------------------------
function renderChart(list = students){
    const labels = list.map(s => s.name);
    const data = list.map(s => s.marks ? (s.marks.maths + s.marks.science + s.marks.english)/3 : 0);
    if(chartInstance) chartInstance.destroy();
    chartInstance = new Chart(performanceChart, {
        type: 'bar',
        data: { labels, datasets: [{label: "Average Marks", data, backgroundColor:"rgba(59,130,246,0.7)"}] },
        options:{ scales:{ y:{ beginAtZero:true, max:100 }}}
    });
}

// -------------------------
// CLASS FILTER
// -------------------------
classFilter.addEventListener("change", () => {
    const selectedClass = classFilter.value;
    renderStudents(
        selectedClass === "All Classes" 
        ? students 
        : students.filter(s => s.class.replace('Class ','') === selectedClass.replace('Class ',''))
    );
});

// -------------------------
// SEARCH STUDENT
// -------------------------
searchInput.addEventListener('input', () => {
    const query = searchInput.value.toLowerCase().trim();
    searchResultsDiv.innerHTML = ''; // clear previous results

    if(query === '') return; // do not render anything if empty

    const filtered = students.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.roll.toLowerCase().includes(query)
    );

    if(filtered.length === 0){
        searchResultsDiv.innerHTML = '<p class="text-gray-600">No student found.</p>';
        return;
    }

    filtered.forEach(s => {
        const card = document.createElement('div');
        card.className = 'border p-3 rounded flex items-center gap-4 mb-2';
        card.innerHTML = `
            ${s.photo 
                ? `<img src="${s.photo}" class="w-12 h-12 rounded-full object-cover shadow-sm"/>`
                : `<div class="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">N/A</div>`}
            <div>
                <p class="font-bold text-gray-900">${s.name} (${s.roll})</p>
                <p class="text-sm text-gray-600">${s.class}</p>
                ${s.marks ? `<p class="text-sm text-gray-700">
                                Maths: ${s.marks.maths}, Science: ${s.marks.science}, English: ${s.marks.english} - Grade: ${s.grade}
                              </p>` : ''}
            </div>
        `;
        searchResultsDiv.appendChild(card);
    });
});

// -------------------------
// INITIAL RENDER
// -------------------------
renderStudents();
