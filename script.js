let students = [
    {
        id: "STU001",
        name: "Arun Kumar",
        department: "CSE",
        year: "III Year",
        points: 420,
        penalty: 12
    },
    {
        id: "STU002",
        name: "Nalan Gilli",
        department: "CSE",
        year: "III Year",
        points: 385,
        penalty: 8
    },
    {
        id: "STU003",
        name: "Karthik Raj",
        department: "ECE",
        year: "II Year",
        points: 350,
        penalty: 20
    },
    {
        id: "STU004",
        name: "Vijay Kumar",
        department: "IT",
        year: "III Year",
        points: 398,
        penalty: 10
    },
    {
        id: "STU005",
        name: "Rahul S",
        department: "MECH",
        year: "II Year",
        points: 315,
        penalty: 15
    }
];

let activities = [
    {
        student: "Arun Kumar",
        action: "Event Participation",
        points: 10,
        staff: "Administrator",
        date: "07 Oct 2026",
        time: "10:25 AM"
    },
    {
        student: "Nalan Gilli",
        action: "Late Comer",
        points: -2,
        staff: "Administrator",
        date: "07 Oct 2026",
        time: "09:18 AM"
    },
    {
        student: "Karthik Raj",
        action: "Assignment Submission",
        points: 5,
        staff: "Staff 01",
        date: "06 Oct 2026",
        time: "02:40 PM"
    }
];

(function loadSaved() {
    try {
        const savedStudents = JSON.parse(localStorage.getItem("sp_students"));
        const savedActivities = JSON.parse(localStorage.getItem("sp_activities"));
        if (Array.isArray(savedStudents) && savedStudents.length) { students = savedStudents; }
        if (Array.isArray(savedActivities)) { activities = savedActivities; }
    } catch (error) {}
})();

let selectedIds = new Set();
let previousPage = "dashboard";

let pendingScanId = "";
let quickType = "point";
const norm = v => String(v).toUpperCase().replace(/[^A-Z0-9]/g, "");

const POINT_OPTIONS = [
    ["Assignment Submitted", 5],
    ["Event Participation", 10],
    ["Academic Achievement", 15],
    ["College Activity", 10],
    ["Helping / Volunteering", 5]
];

const PENALTY_OPTIONS = [
    ["Late Comer", -2],
    ["Unauthorized Absence", -5],
    ["Late Assignment", -3],
    ["Rule Violation", -10],
    ["Other Minor Violation", -2]
];

let scanner = null;
let scannerControls = null;
let scannerRunning = false;
let scanMode = "barcode";

function showPage(pageId, button) {

    stopScanner();

    pendingPhoto = "";

    const currentPage = document.querySelector(".page.active-page");

    if (currentPage && currentPage.id !== pageId) {
        previousPage = currentPage.id;
    }

    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active-page");
    });

    const page = document.getElementById(pageId);

    if (page) {
        page.classList.add("active-page");
    }

    document.querySelectorAll(".nav-item").forEach(item => {
        item.classList.remove("active");
    });

    if (button) {
        button.classList.add("active");
    }

    const titles = {
        dashboard: "Dashboard",
        scanner: "Scan Student ID",
        students: "Students",
        studentDetails: "Student Details",
        activity: "Activity Log",
        leaderboard: "Leaderboard"
    };

    document.getElementById("pageTitle").textContent =
        titles[pageId] || "Dashboard";

    if (pageId === "studentDetails") {
        renderStudentDetails(true);
    }
}

function showPageById(pageId) {

    const index = {
        dashboard: 0,
        scanner: 1,
        students: 2,
        studentDetails: 3,
        activity: 4,
        leaderboard: 5
    };

    const button =
        document.querySelectorAll(".nav-item")[index[pageId]];

    showPage(pageId, button);
}

function openScanner() {

    showPageById("scanner");

    setTimeout(() => {
        startScanner();
    }, 300);
}

function findStudentByScannedValue(value) {

    const student =
        students.find(
            student =>
                norm(student.id) === norm(value)
        );

    if (student) {

        displayStudent(student);

        updateScannerMessage(
            "Student identified successfully"
        );

        setTimeout(() => openQuickAction(student.id), 350);

        return;
    }

    showUnknownStudent(value);
}

function showUnknownStudent(value) {

    pendingScanId = value;

    const result =
        document.getElementById("studentResult");

    result.innerHTML = `

        <div class="empty-result">

            <div class="empty-icon">?</div>

            <h3>Student Not Found</h3>

            <p>
                Scanned value: ${escapeHtml(value)}
            </p>

            <button
                class="primary-btn"
                onclick="startScanner()"
                style="margin-top:18px;"
            >
                Scan Again
            </button>

            <button
                class="secondary-btn"
                onclick="openAddStudent(pendingScanId)"
                style="margin-top:10px;"
            >
                Register this ID
            </button>

        </div>
    `;

    updateScannerMessage(
        "Barcode/QR detected but student was not found",
        true
    );
}

function findStudent() {

    const input =
        document.getElementById("studentIdInput")
            .value
            .trim()
            .toUpperCase();

    if (!input) {

        updateScannerMessage(
            "Enter a Student ID",
            true
        );

        return;
    }

    findStudentByScannedValue(input);
}

function handleManualKey(event) {

    if (event.key === "Enter") {
        findStudent();
    }
}

function updateScannerMessage(message, error = false) {

    const element =
        document.getElementById("scannerMessage");

    if (!element) {
        return;
    }

    element.textContent = message;

    element.classList.toggle(
        "scan-error",
        error
    );

    element.classList.toggle(
        "scan-success",
        !error &&
        message.includes("successfully")
    );
}

function displayStudent(student) {

    const result =
        document.getElementById("studentResult");

    const score =
        student.points - student.penalty;

    result.innerHTML = `

        <div class="student-profile ${genderClass(student)}">

            ${student.photo
                ? `<img class="card-photo" src="${student.photo}" alt="ID card photo">`
                : `<div class="student-avatar-large ${genderClass(student)}">${getInitials(student.name)}</div>`}

            <h2>${escapeHtml(student.name)}</h2>

            <p>
                ${escapeHtml(student.id)}
                •
                ${escapeHtml(student.department)}
                •
                ${escapeHtml(student.year)}
            </p>

            <div class="score-box">

                <span>Current Score</span>

                <strong>${score}</strong>

            </div>

            <div class="score-details">

                <div class="score-detail">

                    <small>Points Earned</small>

                    <strong class="plus">
                        +${student.points}
                    </strong>

                </div>

                <div class="score-detail">

                    <small>Penalty</small>

                    <strong class="minus">
                        -${student.penalty}
                    </strong>

                </div>

            </div>

            <div class="action-buttons">

                <button
                    class="add-point"
                    onclick="openAction('${student.id}', 'point')"
                >
                    + Add Points
                </button>

                <button
                    class="add-penalty"
                    onclick="openAction('${student.id}', 'penalty')"
                >
                    − Add Penalty
                </button>

                <button class="record-btn" onclick="openRecord('${student.id}')">
                    View Record
                </button>

                <button class="record-btn" onclick="retakePhoto('${student.id}')">
                    ${student.photo ? "Retake Photo" : "Take Photo"}
                </button>

            </div>

        </div>
    `;
}

function openAction(studentId, type) {

    const student =
        students.find(
            student => student.id === studentId
        );

    if (!student) {
        return;
    }

    const modal =
        document.getElementById("actionModal");

    const content =
        document.getElementById("modalContent");

    let options;

    if (type === "point") {

        options = [
            ["Assignment Submitted", 5],
            ["Event Participation", 10],
            ["Academic Achievement", 15],
            ["College Activity", 10],
            ["Helping / Volunteering", 5]
        ];

    } else {

        options = [
            ["Late Comer", -2],
            ["Unauthorized Absence", -5],
            ["Late Assignment", -3],
            ["Rule Violation", -10],
            ["Other Minor Violation", -2]
        ];
    }

    content.innerHTML = `

        <h2>
            ${type === "point"
                ? "Add Positive Points"
                : "Add Penalty"}
        </h2>

        <p style="color:#6b7280;font-size:11px;margin-top:5px;">
            Student: ${escapeHtml(student.name)}
        </p>

        <div class="action-options">

            ${options.map(option => `

                <button
                    class="action-option"
                    onclick="applyAction(
                        '${student.id}',
                        '${escapeHtml(option[0])}',
                        ${option[1]}
                    )"
                >

                    <strong>
                        ${escapeHtml(option[0])}
                    </strong>

                    <span style="
                        float:right;
                        color:${option[1] > 0 ? '#16a34a' : '#dc2626'};
                    ">

                        ${option[1] > 0 ? "+" : ""}
                        ${option[1]}

                    </span>

                </button>

            `).join("")}

        </div>
    `;

    modal.style.display = "flex";
}

function applyAction(studentId, action, value) {

    const student =
        students.find(
            student => student.id === studentId
        );

    if (!student) {
        return;
    }

    if (value > 0) {
        student.points += value;
    } else {
        student.penalty += Math.abs(value);
    }

    const now = new Date();

    activities.unshift({
        studentId: student.id,
        student: student.name,
        action: action,
        points: value,
        staff: "Administrator",
        date: now.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric"
        }),
        time: now.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit"
        })
    });

    saveData();

    closeModal();

    displayStudent(student);
    updateDashboard();
    renderActivities();
    renderStudents();
    renderLeaderboard();
}

function closeModal() {

    document.getElementById("actionModal")
        .style.display = "none";
}

function getInitials(name) {

    return name
        .split(" ")
        .map(word => word[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();
}

function updateDashboard() {

    const totalPoints =
        students.reduce(
            (sum, student) =>
                sum + student.points,
            0
        );

    const totalPenalty =
        students.reduce(
            (sum, student) =>
                sum + student.penalty,
            0
        );

    const topScore =
        Math.max(
            ...students.map(
                student =>
                    student.points - student.penalty
            )
        );

    document.getElementById("totalStudents")
        .textContent = students.length;

    document.getElementById("totalPoints")
        .textContent = totalPoints.toLocaleString();

    document.getElementById("totalPenalty")
        .textContent = totalPenalty.toLocaleString();

    document.getElementById("topScore")
        .textContent = topScore;
}

function renderActivities() {

    const recent =
        document.getElementById("recentActivity");

    recent.innerHTML =
        activities
            .slice(0, 5)
            .map(activity => `

                <div class="activity-item">

                    <div class="activity-info">

                        <div class="activity-avatar">
                            ${getInitials(activity.student)}
                        </div>

                        <div>

                            <strong>
                                ${escapeHtml(activity.student)}
                            </strong>

                            <small>
                                ${escapeHtml(activity.action)}
                            </small>

                        </div>

                    </div>

                    <div class="
                        activity-points
                        ${activity.points > 0
                            ? "plus"
                            : "minus"}
                    ">

                        ${activity.points > 0 ? "+" : ""}
                        ${activity.points}

                    </div>

                </div>

            `)
            .join("");

    const table =
        document.getElementById("activityTable");

    table.innerHTML =
        activities
            .map(activity => `

                <tr>

                    <td>
                        <strong>
                            ${escapeHtml(activity.student)}
                        </strong>
                    </td>

                    <td>
                        ${escapeHtml(activity.action)}
                    </td>

                    <td class="
                        ${activity.points > 0
                            ? "plus"
                            : "minus"}
                    ">

                        <strong>
                            ${activity.points > 0 ? "+" : ""}
                            ${activity.points}
                        </strong>

                    </td>

                    <td>
                        ${escapeHtml(activity.staff)}
                    </td>

                    <td>
                        ${escapeHtml(activity.date)}
                    </td>

                    <td>
                        ${escapeHtml(activity.time)}
                    </td>

                </tr>

            `)
            .join("");
}

function searchStudents() {
    filterStudents();
}

function filterStudents() {

    const query =
        document.getElementById("studentSearch")
            .value
            .toLowerCase();

    const department =
        document.getElementById("departmentFilter")
            .value;

    const rows =
        document.querySelectorAll("#studentTable tr");

    rows.forEach(row => {

        const text =
            row.textContent.toLowerCase();

        const departmentMatch =
            department === "all" ||
            (row.children[3] ? row.children[3].textContent.trim().toLowerCase() === department.toLowerCase() : false);

        const searchMatch =
            text.includes(query);

        row.style.display =
            departmentMatch && searchMatch
                ? ""
                : "none";
    });

    updateBulkBar();
}

function renderLeaderboard() {

    const container =
        document.getElementById("leaderboardList");

    const sorted =
        [...students].sort(
            (a, b) =>
                (b.points - b.penalty) -
                (a.points - a.penalty)
        );

    container.innerHTML =
        sorted.map((student, index) => {

            const score =
                student.points - student.penalty;

            return `

                <div class="rank-card">

                    <div class="rank-number">
                        #${index + 1}
                    </div>

                    <div class="rank-avatar">
                        ${getInitials(student.name)}
                    </div>

                    <div class="rank-info">

                        <strong>
                            ${escapeHtml(student.name)}
                        </strong>

                        <small>
                            ${escapeHtml(student.department)}
                            •
                            ${escapeHtml(student.id)}
                        </small>

                    </div>

                    <div class="rank-score">
                        ${score}
                    </div>

                </div>

            `;

        }).join("");
}

function openAddStudent(prefillId = "", prefillName = "", prefillDept = "", prefillYear = "") {

    if (prefillName && !prefillId) {
        prefillId = nextStudentId();
    }


    const modal =
        document.getElementById("actionModal");

    const content =
        document.getElementById("modalContent");

    content.innerHTML = `

        <h2>Add Student</h2>

        ${pendingPhoto ? `<img class="card-photo" src="${pendingPhoto}" alt="Captured ID card" style="margin-top:12px;">` : ""}

        <div class="add-student-form">

            <input
                id="newStudentId"
                placeholder="Student ID"
                value="${escapeHtml(prefillId)}"
            >

            <input
                id="newStudentName"
                placeholder="Student Name"
                value="${escapeHtml(prefillName)}"
            >

            <select id="newStudentDepartment">

                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="IT">IT</option>
                <option value="MECH">MECH</option>

            </select>

            <select id="newStudentYear">

                <option value="I Year">I Year</option>
                <option value="II Year">II Year</option>
                <option value="III Year">III Year</option>
                <option value="IV Year">IV Year</option>

            </select>

            <select id="newStudentGender">
                <option value="">Gender (blue = male, pink = female)</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
            </select>

            <button
                class="primary-btn"
                onclick="addStudent()"
            >
                Add Student
            </button>

        </div>
    `;

    modal.style.display = "flex";

    const deptSelect = document.getElementById("newStudentDepartment");
    const yearSelect = document.getElementById("newStudentYear");

    if (prefillDept) { deptSelect.value = prefillDept; }
    if (prefillYear) { yearSelect.value = prefillYear; }

    setTimeout(() => {
        const f = document.getElementById("newStudentName");
        if (f) f.focus();
    }, 50);
}

// ===== Import students from Excel / CSV / Google Sheet =====

const IS_PHONE = window.matchMedia("(max-width: 750px)").matches;

let importRows = [];
let importHeaders = [];

function setImportMsg(text, isError = true) {

    const box = document.getElementById("importMsg");

    if (box) {
        box.textContent = text;
        box.style.color = isError ? "#dc2626" : "#16a34a";
    }
}

function openImport() {

    document.getElementById("modalContent").innerHTML = `

        <div class="import-box">

            <h2>Import Students</h2>

            <p class="import-help">
                Upload your Excel / CSV file, or paste a Google Sheet link.
                Google Form answers are saved in a Google Sheet
                (Responses tab, then Link to Sheets).
            </p>

            <label class="import-file">
                <input type="file" accept=".xlsx,.xls,.csv" onchange="handleImportFile(this)">
                <span>Choose Excel or CSV file</span>
            </label>

            <div class="import-or">or</div>

            <div class="input-group">
                <input type="text" id="sheetLink" placeholder="Paste Google Sheet link">
                <button onclick="loadSheetLink()">Load</button>
            </div>

            <small>The sheet must be shared as "Anyone with the link can view".</small>

            <p id="importMsg" class="import-msg"></p>

        </div>
    `;

    document.getElementById("actionModal").style.display = "flex";
}

async function handleImportFile(input) {

    const file = input.files && input.files[0];

    if (!file) {
        return;
    }

    if (typeof XLSX === "undefined") {
        setImportMsg("Spreadsheet reader could not load. Check internet.");
        return;
    }

    try {
        setImportMsg("Reading file...", false);
        const buffer = await file.arrayBuffer();
        loadWorkbook(XLSX.read(buffer, { type: "array" }));
    } catch (error) {
        console.error(error);
        setImportMsg("Could not read this file. Use .xlsx, .xls or .csv.");
    }
}

async function loadSheetLink() {

    const url = document.getElementById("sheetLink").value.trim();
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/);

    if (!match) {
        setImportMsg("Paste the full Google Sheet link.");
        return;
    }

    if (typeof XLSX === "undefined") {
        setImportMsg("Spreadsheet reader could not load. Check internet.");
        return;
    }

    const gid = (url.match(/[#&?]gid=(\d+)/) || [])[1];

    const api =
        "https://docs.google.com/spreadsheets/d/" + match[1] +
        "/gviz/tq?tqx=out:csv" + (gid ? "&gid=" + gid : "");

    try {

        setImportMsg("Loading sheet...", false);

        const response = await fetch(api);
        const text = await response.text();

        if (!response.ok || text.trim().startsWith("<")) {
            throw new Error("Sheet is private");
        }

        loadWorkbook(XLSX.read(text, { type: "string" }));

    } catch (error) {
        console.error(error);
        setImportMsg(
            "Could not open the sheet. Set sharing to 'Anyone with the link can view', or download it as Excel and upload the file."
        );
    }
}

function loadWorkbook(workbook) {

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (!rows.length) {
        setImportMsg("No rows found in the first sheet.");
        return;
    }

    importRows = rows;
    importHeaders = Object.keys(rows[0]);

    showImportMapping();
}

function guessColumn(patterns, taken) {

    for (const pattern of patterns) {
        const hit = importHeaders.find(h => pattern.test(h) && !taken.includes(h));
        if (hit) {
            return hit;
        }
    }

    return "";
}

function showImportMapping() {

    const name = guessColumn([/name/i], []);
    const reg = guessColumn([/reg|roll|enrol|admission/i, /\bid\b|number|\bno\b/i], [name]);
    const dept = guessColumn([/dept|department|branch|course|stream/i], [name, reg]);
    const year = guessColumn([/year|class/i], [name, reg, dept]);
    const gender = guessColumn([/gender|sex/i], [name, reg, dept, year]);

    const select = (id, value, optional) => `
        <select id="${id}" onchange="updateImportPreview()">
            ${optional ? '<option value="">None</option>' : ""}
            ${importHeaders.map(h => `
                <option value="${escapeHtml(h)}" ${h === value ? "selected" : ""}>${escapeHtml(h)}</option>
            `).join("")}
        </select>
    `;

    document.getElementById("modalContent").innerHTML = `

        <div class="import-box">

            <h2>Match the columns</h2>

            <p class="import-help">
                Found ${importRows.length} rows. Check each field points to the right column.
            </p>

            <div class="import-map">
                <label>Name ${select("mapName", name, false)}</label>
                <label>Register Number ${select("mapReg", reg, false)}</label>
                <label>Department ${select("mapDept", dept, true)}</label>
                <label>Year ${select("mapYear", year, true)}</label>
                <label>Gender ${select("mapGender", gender, true)}</label>
            </div>

            <div id="importPreview" class="import-preview"></div>

            <button class="primary-btn" style="width:100%;margin-top:14px;" onclick="runImport()">
                Import Students
            </button>

        </div>
    `;

    updateImportPreview();
}

function fixCase(text) {

    return text === text.toUpperCase() || text === text.toLowerCase()
        ? text.toLowerCase().replace(/\b\w/g, c => c.toUpperCase())
        : text;
}

function normDept(text) {

    const raw = String(text).trim();
    const up = raw.toUpperCase();

    if (!up) { return ""; }
    if (/COMPUTER SCIENCE|\bCSE\b|\bCS\b/.test(up)) { return "CSE"; }
    if (/ELECTRONICS.*COMM|\bECE\b/.test(up)) { return "ECE"; }
    if (/INFORMATION TECH|\bIT\b/.test(up)) { return "IT"; }
    if (/MECH/.test(up)) { return "MECH"; }

    return raw.length <= 8 ? up : raw;
}

function normYear(text) {

    const up = String(text).toUpperCase();

    const words = { FIRST: "I", SECOND: "II", THIRD: "III", FOURTH: "IV" };

    for (const word in words) {
        if (up.includes(word)) { return words[word] + " Year"; }
    }

    let m = up.match(/\b(IV|III|II|I)\b/);
    if (m) { return m[1] + " Year"; }

    m = up.match(/[1-4]/);
    if (m) { return ["I", "II", "III", "IV"][m[0] - 1] + " Year"; }

    return "";
}

function buildImportList() {

    const col = id => document.getElementById(id).value;

    const nameCol = col("mapName");
    const regCol = col("mapReg");
    const deptCol = col("mapDept");
    const yearCol = col("mapYear");
    const genderCol = col("mapGender");

    const seen = new Set();
    const list = [];

    importRows.forEach(row => {

        const name = fixCase(String(row[nameCol] ?? "").replace(/\s+/g, " ").trim());
        const id = String(row[regCol] ?? "").replace(/[\s'"<>]+/g, "").toUpperCase();

        if (!name || !id || seen.has(norm(id))) {
            return;
        }

        seen.add(norm(id));

        list.push({
            id: id,
            name: name,
            department: deptCol ? normDept(row[deptCol] ?? "") : "",
            year: yearCol ? normYear(row[yearCol] ?? "") : "",
            gender: genderCol ? normGender(row[genderCol] ?? "") : ""
        });
    });

    return list;
}

function updateImportPreview() {

    const list = buildImportList();

    const existing = list.filter(item =>
        findDuplicate(item.id, item.name)
    ).length;

    const skipped = importRows.length - list.length;

    document.getElementById("importPreview").innerHTML = `
        <div><strong>${list.length - existing} new</strong>, ${existing} already saved (skipped, not changed)${skipped ? `, ${skipped} rows skipped` : ""}</div>
        ${list.slice(0, 3).map(item => `
            <div>${escapeHtml(item.name)} · ${escapeHtml(item.id)} · ${escapeHtml(item.department || "-")}</div>
        `).join("")}
    `;
}

function refreshDepartmentFilter() {

    const select = document.getElementById("departmentFilter");

    if (!select) {
        return;
    }

    const current = select.value;

    const departments = [...new Set(students.map(s => s.department).filter(Boolean))].sort();

    select.innerHTML =
        '<option value="all">All Departments</option>' +
        departments.map(d => `<option value="${escapeHtml(d)}">${escapeHtml(d)}</option>`).join("");

    select.value = departments.includes(current) ? current : "all";
}

// ===== Students table: multi-select delete =====

function renderStudents() {

    const table = document.getElementById("studentTable");

    table.innerHTML = students.map(student => {

        const score = student.points - student.penalty;

        return `<tr class="clickable" data-id="${escapeHtml(student.id)}" onclick="openRecord('${student.id}')">

            <td class="check-col" onclick="event.stopPropagation()">
                <input type="checkbox" class="row-check" aria-label="Select ${escapeHtml(student.name)}"
                    ${selectedIds.has(student.id) ? "checked" : ""}
                    onchange="toggleSelect('${student.id}', this.checked)">
            </td>

            <td>
                <div class="student-cell">
                    <div class="student-mini ${genderClass(student)}">
                        ${student.photo ? `<img class="mini-photo" src="${student.photo}" alt="">` : getInitials(student.name)}
                    </div>
                    <strong>${escapeHtml(student.name)}</strong>
                </div>
            </td>

            <td>${escapeHtml(student.id)}</td>

            <td>${escapeHtml(student.department)}</td>

            <td class="plus">+${student.points}</td>

            <td class="minus">-${student.penalty}</td>

            <td><strong>${score}</strong></td>

            <td><span class="status">Active</span></td>

        </tr>`;

    }).join("");

    updateBulkBar();
}

function updateBulkBar() {

    selectedIds.forEach(id => {
        if (!students.some(s => s.id === id)) {
            selectedIds.delete(id);
        }
    });

    const bar = document.getElementById("bulkBar");

    if (!bar) {
        return;
    }

    bar.style.display = selectedIds.size ? "flex" : "none";

    document.getElementById("bulkCount").textContent = selectedIds.size + " selected";

    const all = document.getElementById("selectAllStudents");

    if (all) {

        const visible = [...document.querySelectorAll("#studentTable tr")]
            .filter(row => row.style.display !== "none");

        all.checked = visible.length > 0 && visible.every(row => selectedIds.has(row.dataset.id));
    }
}

function toggleSelect(id, checked) {

    if (checked) {
        selectedIds.add(id);
    } else {
        selectedIds.delete(id);
    }

    updateBulkBar();
}

// Selects every student currently shown (respects search and department filter)
function toggleSelectAll(checked) {

    document.querySelectorAll("#studentTable tr").forEach(row => {

        if (row.style.display === "none") {
            return;
        }

        if (checked) {
            selectedIds.add(row.dataset.id);
        } else {
            selectedIds.delete(row.dataset.id);
        }

        const box = row.querySelector(".row-check");

        if (box) {
            box.checked = checked;
        }
    });

    updateBulkBar();
}

function clearSelection() {

    selectedIds.clear();

    document.querySelectorAll(".row-check").forEach(box => {
        box.checked = false;
    });

    updateBulkBar();
}

function deleteSelected() {

    const chosen = [...selectedIds]
        .map(id => students.find(s => s.id === id))
        .filter(Boolean);

    if (!chosen.length) {
        return;
    }

    const preview =
        chosen.slice(0, 5).map(s => "• " + s.name + " (" + s.id + ")").join("\n") +
        (chosen.length > 5 ? "\n• and " + (chosen.length - 5) + " more" : "");

    const ok = confirm(
        "Delete " + chosen.length + " selected student" + (chosen.length === 1 ? "" : "s") + "?\n\n" +
        preview + "\n\n" +
        "Their points, penalty, photos and activity history will be removed. This cannot be undone."
    );

    if (!ok) {
        return;
    }

    const names = new Set(chosen.map(s => s.name));

    students = students.filter(s => !selectedIds.has(s.id));

    activities = activities.filter(a =>
        a.studentId ? !selectedIds.has(a.studentId) : !names.has(a.student)
    );

    selectedIds.clear();

    saveData();
    refreshAll();
    resetStudentPanel();
}

// ===== Student Details: department -> year -> list, with search =====

let sd = { dept: null, year: null };
let sdDepts = [];
let sdYears = [];

const YEAR_ORDER = ["I Year", "II Year", "III Year", "IV Year"];

function sdBack(level) {

    sd.year = null;

    if (level === "home") {
        sd.dept = null;
    }

    renderStudentDetails();
}

// Back arrow: clear search -> year list -> department list -> previous page
function sdGoBack() {

    const search = document.getElementById("sdSearch");

    if (search && search.value.trim()) {
        search.value = "";
        renderStudentDetails();
        return;
    }

    if (sd.year) {
        sdBack("dept");
        return;
    }

    if (sd.dept) {
        sdBack("home");
        return;
    }

    showPageById(previousPage && previousPage !== "studentDetails" ? previousPage : "dashboard");
}

// Backspace key does the same, but never while typing or with a popup open
document.addEventListener("keydown", event => {

    if (event.key !== "Backspace") {
        return;
    }

    const tag = (event.target.tagName || "").toLowerCase();

    if (tag === "input" || tag === "textarea" || tag === "select" || event.target.isContentEditable) {
        return;
    }

    const page = document.getElementById("studentDetails");
    const modal = document.getElementById("actionModal");

    if (!page || !page.classList.contains("active-page")) {
        return;
    }

    if (modal && getComputedStyle(modal).display !== "none") {
        return;
    }

    event.preventDefault();
    sdGoBack();
});

function sdPickDept(index) {
    sd.dept = sdDepts[index];
    sd.year = null;
    renderStudentDetails();
}

function sdPickYear(index) {
    sd.year = sdYears[index];
    renderStudentDetails();
}

function sdMatches(student, query) {

    return (
        student.name.toLowerCase().includes(query) ||
        student.id.toLowerCase().includes(query) ||
        String(student.department).toLowerCase().includes(query)
    );
}

function sdTable(list, title) {

    if (!list.length) {
        return `<div class="panel"><div class="sd-empty">No students found.</div></div>`;
    }

    const sorted = list.slice().sort((a, b) => a.name.localeCompare(b.name));

    return `
        <div class="panel">

            <div class="sd-head">
                <h3>${escapeHtml(title)}</h3>
                <span>${sorted.length} student${sorted.length === 1 ? "" : "s"}</span>
            </div>

            <div class="table-wrapper">
                <table>

                    <thead>
                        <tr>
                            <th>Student</th>
                            <th>Register No.</th>
                            <th>Department</th>
                            <th>Year</th>
                            <th>Points</th>
                            <th>Penalty</th>
                            <th>Score</th>
                        </tr>
                    </thead>

                    <tbody>
                        ${sorted.map(student => `
                            <tr class="clickable" onclick="openRecord('${student.id}')">
                                <td>
                                    <div class="student-cell">
                                        <div class="student-mini ${genderClass(student)}">
                                            ${student.photo ? `<img class="mini-photo" src="${student.photo}" alt="">` : getInitials(student.name)}
                                        </div>
                                        <strong>${escapeHtml(student.name)}</strong>
                                    </div>
                                </td>
                                <td>${escapeHtml(student.id)}</td>
                                <td>${escapeHtml(student.department)}</td>
                                <td>${escapeHtml(student.year)}</td>
                                <td class="plus">+${student.points}</td>
                                <td class="minus">-${student.penalty}</td>
                                <td><strong>${student.points - student.penalty}</strong></td>
                            </tr>
                        `).join("")}
                    </tbody>

                </table>
            </div>

        </div>
    `;
}

function renderStudentDetails(reset = false) {

    const search = document.getElementById("sdSearch");
    const body = document.getElementById("sdBody");
    const crumb = document.getElementById("sdCrumb");

    if (!search || !body) {
        return;
    }

    if (reset === true) {
        sd = { dept: null, year: null };
        search.value = "";
    }

    if (!students.length) {
        crumb.innerHTML = "";
        body.innerHTML = `<div class="panel"><div class="sd-empty">No students yet. Add or import students first.</div></div>`;
        return;
    }

    sdDepts = [...new Set(students.map(s => s.department || "-"))].sort();

    if (sd.dept && !sdDepts.includes(sd.dept)) {
        sd = { dept: null, year: null };
    }

    const query = search.value.trim().toLowerCase();
    const yearLabel = sd.year === "ALL" ? "All Years" : sd.year;

    crumb.innerHTML =
        `<button class="${sd.dept ? "" : "current"}" onclick="sdBack('home')">Departments</button>` +
        (sd.dept
            ? `<span>›</span><button class="${sd.year ? "" : "current"}" onclick="sdBack('dept')">${escapeHtml(sd.dept)}</button>`
            : "") +
        (sd.year ? `<span>›</span><button class="current">${escapeHtml(yearLabel)}</button>` : "");

    const picking = !(sd.dept && sd.year);

    if (query && picking) {
        body.innerHTML = sdTable(students.filter(s => sdMatches(s, query)), "Search results");
        return;
    }

    if (!sd.dept) {

        body.innerHTML = `
            <p class="sd-step">Choose a department</p>
            <div class="sd-grid">
                ${sdDepts.map((dept, i) => {
                    const n = students.filter(s => (s.department || "-") === dept).length;
                    return `
                        <button class="sd-card" onclick="sdPickDept(${i})">
                            <span class="sd-count">${n}</span>
                            <strong>${escapeHtml(dept)}</strong>
                            <small>${n} student${n === 1 ? "" : "s"}</small>
                        </button>`;
                }).join("")}
            </div>
        `;

        return;
    }

    const inDept = students.filter(s => (s.department || "-") === sd.dept);

    if (!sd.year) {

        const extra = [...new Set(inDept.map(s => s.year))]
            .filter(y => y && !YEAR_ORDER.includes(y));

        sdYears = ["ALL", ...YEAR_ORDER, ...extra];

        body.innerHTML = `
            <p class="sd-step">Choose a year in ${escapeHtml(sd.dept)}</p>
            <div class="sd-grid">
                ${sdYears.map((year, i) => {
                    const n = year === "ALL" ? inDept.length : inDept.filter(s => s.year === year).length;
                    return `
                        <button class="sd-card ${n ? "" : "empty"}" onclick="sdPickYear(${i})">
                            <span class="sd-count">${n}</span>
                            <strong>${year === "ALL" ? "All Years" : escapeHtml(year)}</strong>
                            <small>${n} student${n === 1 ? "" : "s"}</small>
                        </button>`;
                }).join("")}
            </div>
        `;

        return;
    }

    let list = inDept.filter(s => sd.year === "ALL" || s.year === sd.year);

    if (query) {
        list = list.filter(s => sdMatches(s, query));
    }

    body.innerHTML = sdTable(list, sd.dept + " · " + yearLabel);
}

// ===== Duplicates, delete, theme =====

let pendingNewStudent = null;

function findDuplicate(id, name) {

    return (
        students.find(s => norm(s.id) === norm(id)) ||
        students.find(s => s.name.trim().toLowerCase() === String(name).trim().toLowerCase()) ||
        null
    );
}

function refreshAll() {
    updateDashboard();
    renderStudents();
    renderLeaderboard();
    renderActivities();
    refreshDepartmentFilter();

    const details = document.getElementById("studentDetails");

    if (details && details.classList.contains("active-page")) {
        renderStudentDetails();
    }
}

function addStudent() {

    const id = document.getElementById("newStudentId").value.trim().toUpperCase();
    const name = document.getElementById("newStudentName").value.trim();
    const department = document.getElementById("newStudentDepartment").value;
    const year = document.getElementById("newStudentYear").value;
    const gender = document.getElementById("newStudentGender").value;

    if (!id || !name) {
        alert("Please enter Register Number and Name.");
        return;
    }

    const dup = findDuplicate(id, name);

    if (dup) {

        const sameReg = norm(dup.id) === norm(id);

        // Same person scanned again: keep the new photo if they had none
        if (sameReg && pendingPhoto && !dup.photo) {
            setStudentPhoto(dup, pendingPhoto);
            pendingPhoto = "";
        }

        pendingNewStudent = sameReg ? null : { id, name, department, year, gender };

        showExisting(
            dup,
            sameReg
                ? "This register number is already registered. Showing the saved student."
                : "A student with this name is already registered. Showing the saved student.",
            !sameReg
        );

        return;
    }

    commitStudent({ id, name, department, year, gender });
}

function commitStudent(data) {

    students.push({
        id: data.id,
        name: data.name,
        department: data.department,
        year: data.year,
        gender: data.gender || "",
        points: 0,
        penalty: 0,
        photo: pendingPhoto || ""
    });

    pendingPhoto = "";
    saveData();

    closeModal();
    refreshAll();

    if (document.getElementById("scanner").classList.contains("active-page")) {
        const added = students[students.length - 1];
        displayStudent(added);
        setTimeout(() => openQuickAction(added.id), 250);
    }
}

function addAnyway() {

    if (!pendingNewStudent) {
        return;
    }

    const data = pendingNewStudent;
    pendingNewStudent = null;

    if (students.some(s => norm(s.id) === norm(data.id))) {
        return;
    }

    commitStudent(data);
}

// Show the saved student's profile in front of the admin
function showExisting(student, message, anyway) {

    if (document.getElementById("scanner").classList.contains("active-page")) {
        displayStudent(student);
    }

    openRecord(student.id, message, anyway);
}

function resetStudentPanel() {

    document.getElementById("studentResult").innerHTML = `
        <div class="empty-result">
            <div class="empty-icon"><svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
            <h3>No Student Selected</h3>
            <p>Scan a student ID to view their profile.</p>
        </div>
    `;
}

function deleteStudent(studentId) {

    const student = students.find(s => s.id === studentId);

    if (!student) {
        return;
    }

    const ok = confirm(
        "Delete " + student.name + " (" + student.id + ")?\n\n" +
        "Their points, penalty, photo and activity history will be removed. This cannot be undone."
    );

    if (!ok) {
        return;
    }

    students = students.filter(s => s.id !== studentId);

    activities = activities.filter(a =>
        a.studentId ? a.studentId !== studentId : a.student !== student.name
    );

    saveData();
    closeModal();
    refreshAll();
    resetStudentPanel();
}

function toggleTheme() {

    const next =
        document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";

    document.documentElement.setAttribute("data-theme", next);

    try {
        localStorage.setItem("sp_theme", next);
    } catch (error) {}
}

function runImport() {

    const list = buildImportList();

    if (!list.length) {
        updateImportPreview();
        alert("No valid students found. Check the column matching.");
        return;
    }

    let added = 0;
    const existing = [];

    list.forEach(item => {

        const found = findDuplicate(item.id, item.name);

        if (found) {

            if (!existing.includes(found)) {
                existing.push(found);
            }

            return;
        }

        students.push({
            id: item.id,
            name: item.name,
            department: item.department || "-",
            year: item.year || "I Year",
            gender: item.gender || "",
            points: 0,
            penalty: 0,
            photo: ""
        });

        added++;
    });

    saveData();
    refreshAll();

    document.getElementById("modalContent").innerHTML = `

        <div class="import-box">

            <h2>Import complete</h2>

            <p class="import-help">
                <strong>${added}</strong> students added${existing.length
                    ? `, <strong>${existing.length}</strong> already existed and were not changed. Tap a name to see the saved profile.`
                    : "."}
            </p>

            ${existing.length ? `
                <div class="dup-list">
                    ${existing.slice(0, 50).map(student => `
                        <button class="dup-item" onclick="openRecord('${student.id}', 'Already registered')">
                            <strong>${escapeHtml(student.name)}</strong>
                            <span>${escapeHtml(student.id)} · ${escapeHtml(student.department)}</span>
                        </button>
                    `).join("")}
                </div>
            ` : ""}

            <button class="primary-btn" style="width:100%;" onclick="closeModal()">Done</button>

        </div>
    `;
}

// ===== Gender colours: male = blue, female = pink =====

function genderClass(student) {
    return student.gender === "Male" ? "gm" : student.gender === "Female" ? "gf" : "";
}

function normGender(text) {

    const t = String(text).trim();

    if (/^(f|female|girl|woman)\b/i.test(t)) { return "Female"; }
    if (/^(m|male|boy|man)\b/i.test(t)) { return "Male"; }

    return "";
}

function setGender(studentId, gender) {

    const student = students.find(s => s.id === studentId);

    if (!student) {
        return;
    }

    // pressing the same button again clears it
    student.gender = student.gender === gender ? "" : gender;

    saveData();
    refreshAll();

    if (document.getElementById("scanner").classList.contains("active-page")) {
        displayStudent(student);
    }

    openRecord(studentId);
}

// ===== Photos, records and export =====

let pendingPhoto = "";
let photoTargetId = null;

function saveData() {
    try {
        localStorage.setItem("sp_students", JSON.stringify(students));
        localStorage.setItem("sp_activities", JSON.stringify(activities));
    } catch (error) {
        alert("Browser storage is full, so the latest photo could not be saved. Download the records and remove old photos.");
    }
}

function setStudentPhoto(student, photo) {

    student.photo = photo;

    student.photoTime = new Date().toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    });

    saveData();
    renderStudents();
}

function retakePhoto(studentId) {

    photoTargetId = studentId;

    updateScannerMessage("Hold the ID card in front of the camera, then press Capture ID Card");

    startScanner();
}

function openRecord(studentId, notice = "", anyway = false) {

    const student = students.find(s => s.id === studentId);

    if (!student) {
        return;
    }

    const history = activities
        .filter(a => a.studentId === student.id || (!a.studentId && a.student === student.name))
        .slice(0, 5);

    const fileName = (student.name + "_" + student.id).replace(/[^A-Za-z0-9_-]+/g, "_") + ".jpg";

    document.getElementById("modalContent").innerHTML = `

        <div class="record ${genderClass(student)}">

            ${notice ? `<div class="record-notice">${escapeHtml(notice)}</div>` : ""}

            ${student.photo
                ? `<img class="record-photo" src="${student.photo}" alt="ID card photo">`
                : `<div class="record-photo empty">No ID card photo yet</div>`}

            <h2>${escapeHtml(student.name)}</h2>

            <div class="gender-row">
                <button class="g-btn m ${student.gender === "Male" ? "on" : ""}" onclick="setGender('${student.id}', 'Male')">Male</button>
                <button class="g-btn f ${student.gender === "Female" ? "on" : ""}" onclick="setGender('${student.id}', 'Female')">Female</button>
            </div>


            <dl class="record-grid">
                <div><dt>Register No.</dt><dd>${escapeHtml(student.id)}</dd></div>
                <div><dt>Department</dt><dd>${escapeHtml(student.department)}</dd></div>
                <div><dt>Year</dt><dd>${escapeHtml(student.year)}</dd></div>
                <div><dt>Score</dt><dd>${student.points - student.penalty}</dd></div>
                <div><dt>Points Earned</dt><dd class="plus">+${student.points}</dd></div>
                <div><dt>Penalty</dt><dd class="minus">-${student.penalty}</dd></div>
            </dl>

            ${student.photoTime ? `<small style="color:#6b7280;">Photo taken ${escapeHtml(student.photoTime)}</small>` : ""}

            <h3>Recent activity</h3>

            ${history.length
                ? history.map(a => `
                    <div class="record-history">
                        <span>${escapeHtml(a.action)}</span>
                        <strong class="${a.points > 0 ? "plus" : "minus"}">${a.points > 0 ? "+" : ""}${a.points}</strong>
                    </div>`).join("")
                : `<small style="color:#6b7280;">No activity yet</small>`}

            <div class="record-actions">
                <button class="primary-btn" onclick="openQuickAction('${student.id}')">Points / Penalty</button>
                ${anyway ? `<button class="secondary-btn" onclick="addAnyway()">Add as different student</button>` : ""}
                <button class="danger-btn" onclick="deleteStudent('${student.id}')">Delete Student</button>
                ${student.photo
                    ? `<a class="secondary-btn" href="${student.photo}" download="${fileName}">Download Photo</a>`
                    : ""}
            </div>

        </div>
    `;

    document.getElementById("actionModal").style.display = "flex";
}

function exportRecords() {

    const rows = [["Register No", "Name", "Department", "Year", "Gender", "Points Earned", "Penalty", "Score", "ID Card Photo"]];

    students.forEach(s => rows.push([
        s.id, s.name, s.department, s.year, s.gender || "",
        s.points, s.penalty, s.points - s.penalty,
        s.photo ? "Yes" : "No"
    ]));

    const csv = rows
        .map(row => row.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(","))
        .join("\r\n");

    const link = document.createElement("a");

    link.href = URL.createObjectURL(new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" }));
    link.download = "studentpoint-records.csv";
    link.click();

    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

// ===== ID card scanner: reads the printed name on the full card =====

let ocrWorker = null;
let ocrTimer = null;
let ocrBusy = false;
let cameraStream = null;
let matchId = null;
let matchCount = 0;
let missFrames = 0;
let pendingLines = [];

async function getOcrWorker() {

    if (typeof Tesseract === "undefined") {
        throw new Error("Text reader not loaded");
    }

    if (!ocrWorker) {
        updateScannerMessage("Loading card reader (first time only)...");
        ocrWorker = await Tesseract.createWorker("eng");
    }

    return ocrWorker;
}

let capturing = false;

// Camera starts on its own. The text reader loads afterwards, and if it
// fails the camera and photo capture still work.
async function startScanner() {

    if (scannerRunning) {
        return;
    }

    const video = document.getElementById("scannerVideo");
    const placeholder = document.getElementById("cameraPlaceholder");

    try {

        updateScannerMessage("Requesting camera access...");

        cameraStream = await navigator.mediaDevices.getUserMedia({
            audio: false,
            video: {
                facingMode: { ideal: "environment" },
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            }
        });

        video.srcObject = cameraStream;
        await video.play();

        video.style.display = "block";
        placeholder.style.display = "none";

        scannerRunning = true;
        matchId = null;
        matchCount = 0;
        missFrames = 0;

    } catch (error) {

        console.error(error);

        stopScanner();

        updateScannerMessage(
            "Camera access failed. Allow the camera, and open the page from localhost or https.",
            true
        );

        return;
    }

    updateScannerMessage("Camera ready. Hold the ID card steady, then press Capture ID Card");

    try {

        await getOcrWorker();

        if (!scannerRunning) {
            return;
        }

        updateScannerMessage("Hold the full ID card steady, then press Capture ID Card");

        ocrLoop();

    } catch (error) {

        console.error(error);

        updateScannerMessage(
            "Camera ready, but the text reader could not load (check internet). You can still capture the photo.",
            true
        );
    }
}

async function takePhoto() {

    if (!scannerRunning) {
        updateScannerMessage("Start the scanner first, then press Capture ID Card", true);
        return;
    }

    const video = document.getElementById("scannerVideo");

    if (capturing || !video.videoWidth) {
        updateScannerMessage("Camera is not ready yet", true);
        return;
    }

    const photo = captureFrame();

    const area = document.querySelector(".camera-area");
    area.classList.add("flash");
    setTimeout(() => area.classList.remove("flash"), 300);

    // Retake mode: only replace the photo of one student
    const target = students.find(student => student.id === photoTargetId);

    if (target) {
        setStudentPhoto(target, photo);
        stopScanner();
        displayStudent(target);
        updateScannerMessage("Photo saved for " + target.name);
        return;
    }

    capturing = true;
    clearTimeout(ocrTimer);

    let text = "";

    try {

        if (ocrWorker) {
            updateScannerMessage("Reading ID card...");
            const result = await ocrWorker.recognize(stillCanvas(video, IS_PHONE ? 1400 : 1800));
            text = result.data.text || "";
        }

    } catch (error) {
        console.error(error);
    }

    capturing = false;

    if (scannerRunning) {
        useCardResult(text, photo, false);
    }
}

const NOT_A_NAME = /(COLLEGE|UNIVERSITY|ENGINEERING|TECHNOLOGY|INSTITUTE|INSTITUTION|SCHOOL|DEPARTMENT|DEPT|STUDENT|IDENTITY|CARD|YEAR|VALID|ADDRESS|BLOOD|PRINCIPAL|SIGNATURE|AUTONOMOUS|AFFILIATED|PHONE|MOBILE|DOB|BIRTH|BATCH|COURSE|BRANCH|REGISTER|ROLL|CHENNAI|TAMIL|NADU|INDIA|ROAD|STREET)/i;

function parseCard(text) {

    const lines = text
        .split("\n")
        .map(line => line.replace(/\s+/g, " ").trim())
        .filter(Boolean);

    const out = { name: "", regNo: "", dept: "", year: "" };
    const up = text.toUpperCase();

    // Register number
    let m = text.match(/(?:reg(?:ister|\.)?\s*(?:no|number|num)?|roll\s*(?:no|number)|id\s*(?:no|number)|admission\s*no|enrol\w*\s*no)\.?\s*[:\-.]?\s*(?=[A-Z0-9\/\-]*\d)([A-Z0-9][A-Z0-9\/\-]{4,})/i);

    if (m) {
        out.regNo = m[1];
    } else {
        m = text.match(/\b[A-Z]{0,4}\d{6,14}[A-Z]{0,2}\b/);
        if (m) {
            out.regNo = m[0];
        }
    }

    out.regNo = out.regNo.toUpperCase().replace(/[^A-Z0-9\/\-]/g, "");

    // Name
    m = text.match(/name\s*[:\-]\s*([A-Za-z][A-Za-z .]{2,40})/i);

    if (m) {
        out.name = m[1];
    } else {
        const guess = lines.find(line =>
            /^[A-Za-z][A-Za-z .]{3,40}$/.test(line) &&
            !NOT_A_NAME.test(line) &&
            line.split(" ").length >= 2 &&
            line.split(" ").length <= 4
        );
        out.name = guess || "";
    }

    out.name = out.name
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, c => c.toUpperCase());

    // Department
    if (/COMPUTER SCIENCE|\bCSE\b/.test(up)) {
        out.dept = "CSE";
    } else if (/ELECTRONICS|\bECE\b/.test(up)) {
        out.dept = "ECE";
    } else if (/INFORMATION TECHNOLOGY|\bIT\b/.test(up)) {
        out.dept = "IT";
    } else if (/MECHANICAL|\bMECH\b/.test(up)) {
        out.dept = "MECH";
    }

    // Year
    m = up.match(/\b(IV|III|II|I)\s*(?:YEAR|YR)\b/);

    if (m) {
        out.year = m[1] + " Year";
    } else {
        m = up.match(/\b([1-4])\s*(?:ST|ND|RD|TH)?\s*YEAR\b/);
        if (m) {
            out.year = ["I", "II", "III", "IV"][m[1] - 1] + " Year";
        }
    }

    return out;
}

// Decide: already registered -> fill in saved details, otherwise register from the card
function useCardResult(text, photo, auto) {

    const info = parseCard(text);

    const lines = text
        .split("\n")
        .map(line => line.trim())
        .filter(line => line.replace(/[^A-Za-z]/g, "").length >= 3);

    const flat = norm(text);

    let found = null;

    if (info.regNo) {
        found = students.find(student => norm(student.id) === norm(info.regNo)) || null;
    }

    if (!found) {
        found = students.find(student =>
            norm(student.id).length >= 4 && flat.includes(norm(student.id))
        ) || null;
    }

    if (!found) {

        let best = 0;

        students.forEach(student => {
            const score = nameScore(student.name, lines);
            if (score >= 0.85 && score > best) {
                best = score;
                found = student;
            }
        });
    }

    // Live scanning should not open a form for random text
    if (auto && !found && !info.name && !info.regNo) {
        missFrames = 0;
        return;
    }

    stopScanner();

    if (found) {

        if (!found.photo && photo) {
            setStudentPhoto(found, photo);
        }

        document.getElementById("studentIdInput").value = found.id;

        displayStudent(found);

        updateScannerMessage("Already registered: " + found.name + ". Saved details filled in.");

        setTimeout(() => openQuickAction(found.id), 350);

        return;
    }

    pendingPhoto = photo || "";

    const readSomething = !!(info.name || info.regNo);

    updateScannerMessage(
        readSomething
            ? "New ID card. Check the details and save."
            : "Could not read the card text. Type the details to save the photo.",
        !readSomething
    );

    openAddStudent(info.regNo, info.name, info.dept, info.year);
}

// The scan frame is ID-card shaped. Photo and text reading use only what is inside it.
function cardCrop(video) {

    const vw = video.videoWidth;
    const vh = video.videoHeight;
    const full = { sx: 0, sy: 0, sw: vw, sh: vh };

    const frame = document.querySelector(".scan-frame");

    if (!frame) {
        return full;
    }

    const vr = video.getBoundingClientRect();
    const fr = frame.getBoundingClientRect();

    if (!vr.width || !vr.height || !fr.width || !fr.height) {
        return full;
    }

    const fit = getComputedStyle(video).objectFit;

    let scaleX = vr.width / vw;
    let scaleY = vr.height / vh;

    if (fit === "cover") {
        scaleX = scaleY = Math.max(scaleX, scaleY);
    } else if (fit === "contain") {
        scaleX = scaleY = Math.min(scaleX, scaleY);
    }

    const offsetX = (vr.width - vw * scaleX) / 2;
    const offsetY = (vr.height - vh * scaleY) / 2;

    let sx = (fr.left - vr.left - offsetX) / scaleX;
    let sy = (fr.top - vr.top - offsetY) / scaleY;
    let sw = fr.width / scaleX;
    let sh = fr.height / scaleY;

    sx = Math.max(0, sx);
    sy = Math.max(0, sy);
    sw = Math.min(sw, vw - sx);
    sh = Math.min(sh, vh - sy);

    return sw > 20 && sh > 20 ? { sx, sy, sw, sh } : full;
}

function captureFrame() {

    const video = document.getElementById("scannerVideo");

    if (!video || !video.videoWidth) {
        return "";
    }

    const crop = cardCrop(video);
    const scale = Math.min(1, 720 / crop.sw);

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(crop.sw * scale);
    canvas.height = Math.round(crop.sh * scale);

    canvas.getContext("2d").drawImage(
        video, crop.sx, crop.sy, crop.sw, crop.sh,
        0, 0, canvas.width, canvas.height
    );

    return canvas.toDataURL("image/jpeg", 0.7);
}

function stillCanvas(video, maxWidth) {

    const crop = cardCrop(video);
    const target = Math.min(maxWidth, crop.sw * 2);
    const scale = target / crop.sw;

    const canvas = document.createElement("canvas");
    canvas.width = Math.round(crop.sw * scale);
    canvas.height = Math.round(crop.sh * scale);

    const ctx = canvas.getContext("2d");
    ctx.filter = "grayscale(1) contrast(1.4)";
    ctx.drawImage(
        video, crop.sx, crop.sy, crop.sw, crop.sh,
        0, 0, canvas.width, canvas.height
    );

    return canvas;
}

async function scanFrame() {

    const video = document.getElementById("scannerVideo");

    if (ocrBusy || capturing || !video.videoWidth) {
        return;
    }

    ocrBusy = true;

    try {

        const result = await ocrWorker.recognize(stillCanvas(video, IS_PHONE ? 900 : 1200));

        if (scannerRunning) {
            handleCardText(result.data.text || "");
        }

    } catch (error) {
        console.error(error);
    } finally {
        ocrBusy = false;
    }
}

function stopScanner() {

    clearTimeout(ocrTimer);
    ocrTimer = null;
    scannerRunning = false;
    photoTargetId = null;

    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }

    const video = document.getElementById("scannerVideo");

    if (video) {
        video.srcObject = null;
        video.style.display = "none";
    }

    const placeholder = document.getElementById("cameraPlaceholder");

    if (placeholder) {
        placeholder.style.display = "flex";
    }
}

function ocrLoop() {

    clearTimeout(ocrTimer);

    ocrTimer = setTimeout(async () => {

        if (!scannerRunning) {
            return;
        }

        await scanFrame();

        if (scannerRunning) {
            ocrLoop();
        }

    }, 500);
}

function handleCardText(text) {

    if (photoTargetId || capturing) {
        return;
    }


    const lines = text
        .split("\n")
        .map(line => line.trim())
        .filter(line => line.replace(/[^A-Za-z]/g, "").length >= 3);

    const flat = norm(text);

    let best = null;
    let bestScore = 0;

    students.forEach(student => {

        const idKey = norm(student.id);

        const score =
            idKey.length >= 4 && flat.includes(idKey)
                ? 1
                : nameScore(student.name, lines);

        if (score > bestScore) {
            bestScore = score;
            best = student;
        }
    });

    // The same student must be read in 2 frames in a row
    if (best && bestScore >= 0.85) {

        matchCount = best.id === matchId ? matchCount + 1 : 1;
        matchId = best.id;
        missFrames = 0;

        updateScannerMessage("Reading card: " + best.name + "...");

        if (matchCount >= 2) {
            const shot = pendingPhoto || (best.photo ? "" : captureFrame());
            pendingPhoto = "";
            stopScanner();
            if (shot) { setStudentPhoto(best, shot); }
            document.getElementById("studentIdInput").value = best.id;
            updateScannerMessage("ID card read: " + best.name);
            findStudentByScannedValue(best.id);
        }

        return;
    }

    matchId = null;
    matchCount = 0;

    if (lines.length >= 4) {
        missFrames++;
    }

    // Card text is clearly readable but nobody matches -> new student
    if (missFrames >= 5) {
        useCardResult(text, captureFrame(), true);
    }
}

function lev(a, b) {

    const dp = Array.from({ length: a.length + 1 }, (_, i) => [i]);

    for (let j = 1; j <= b.length; j++) {
        dp[0][j] = j;
    }

    for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
            );
        }
    }

    return dp[a.length][b.length];
}

function nameScore(name, lines) {

    const n = name.toUpperCase().replace(/[^A-Z]/g, "");

    if (n.length < 3) {
        return 0;
    }

    let best = 0;

    lines.forEach(line => {

        const l = line.toUpperCase().replace(/[^A-Z]/g, "");

        if (l.includes(n)) {
            best = 1;
            return;
        }

        for (const size of [n.length - 1, n.length, n.length + 1]) {
            for (let i = 0; i + size <= l.length; i++) {
                const score = 1 - lev(n, l.substr(i, size)) / n.length;
                if (score > best) {
                    best = score;
                }
            }
        }
    });

    return best;
}

function showUnreadCard(lines) {

    stopScanner();

    document.getElementById("studentResult").innerHTML = `

        <div class="empty-result">

            <div class="empty-icon">?</div>

            <h3>Card not registered</h3>

            <p>Tap the line that is the student's name to register them.</p>

            <div class="line-chips">
                ${lines.map((line, i) => `
                    <button class="line-chip" onclick="registerFromLine(${i})">
                        ${escapeHtml(line)}
                    </button>
                `).join("")}
            </div>

            <button class="primary-btn" onclick="startScanner()" style="margin-top:16px;">
                Scan Again
            </button>

        </div>
    `;

    updateScannerMessage("Card read, but student is not registered", true);
}

function registerFromLine(index) {

    const name = (pendingLines[index] || "")
        .replace(/^(name|student name)\s*[:\-]?\s*/i, "")
        .replace(/[^A-Za-z .]/g, "")
        .trim();

    openAddStudent("", name);
}

function nextStudentId() {

    let n = students.length + 1;
    let id;

    do {
        id = "STU" + String(n++).padStart(3, "0");
    } while (students.some(student => student.id === id));

    return id;
}

function openQuickAction(studentId) {

    const student = students.find(s => s.id === studentId);

    if (!student) {
        return;
    }

    quickType = "point";

    const list = options => options.map(option => `
        <button
            class="action-option"
            onclick="applyAction('${student.id}', '${escapeHtml(option[0])}', ${option[1]})"
        >
            <strong>${escapeHtml(option[0])}</strong>
            <span style="float:right;color:${option[1] > 0 ? '#16a34a' : '#dc2626'};">
                ${option[1] > 0 ? "+" : ""}${option[1]}
            </span>
        </button>
    `).join("");

    document.getElementById("modalContent").innerHTML = `

        <div class="quick-head">
            <div class="student-avatar-large ${genderClass(student)}">${getInitials(student.name)}</div>
            <div>
                <h2>${escapeHtml(student.name)}</h2>
                <p>${escapeHtml(student.id)} • ${escapeHtml(student.department)} • ${escapeHtml(student.year)}</p>
            </div>
            <div class="quick-score">
                <strong>${student.points - student.penalty}</strong>
                <small>Score</small>
            </div>
        </div>

        <div class="quick-tabs">
            <button class="quick-tab active" data-type="point" onclick="setQuickTab('point')">Add Points</button>
            <button class="quick-tab" data-type="penalty" onclick="setQuickTab('penalty')">Add Penalty</button>
        </div>

        <div class="action-options" id="quickPoint">${list(POINT_OPTIONS)}</div>
        <div class="action-options" id="quickPenalty" style="display:none;">${list(PENALTY_OPTIONS)}</div>

        <div class="custom-action">
            <input id="customReason" placeholder="Custom reason" maxlength="40">
            <input id="customValue" type="number" min="1" max="100" placeholder="Pts">
            <button class="primary-btn" onclick="applyCustom('${student.id}')">Apply</button>
        </div>
    `;

    document.getElementById("actionModal").style.display = "flex";
}

function setQuickTab(type) {

    quickType = type;

    document.querySelectorAll(".quick-tab").forEach(tab => {
        tab.classList.toggle("active", tab.dataset.type === type);
    });

    document.getElementById("quickPoint").style.display =
        type === "point" ? "grid" : "none";

    document.getElementById("quickPenalty").style.display =
        type === "penalty" ? "grid" : "none";
}

function applyCustom(studentId) {

    const value = parseInt(document.getElementById("customValue").value, 10);

    if (!value || value < 1) {
        alert("Enter the number of points.");
        return;
    }

    const reason =
        document.getElementById("customReason").value.trim() ||
        (quickType === "point" ? "Custom Points" : "Custom Penalty");

    applyAction(studentId, reason, quickType === "point" ? value : -value);
}

function escapeHtml(value) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

document.getElementById("actionModal")
    .addEventListener("click", function(event) {

        if (event.target === this) {
            closeModal();
        }

    });

updateDashboard();
renderActivities();
renderStudents();
renderLeaderboard();

refreshDepartmentFilter();
