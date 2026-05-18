// ---------- CORE NAVIGATION & UI ----------
function showPage(page) {
  // Access control
  if (page === "teacherDashboard") {
    if (!localStorage.getItem("isTeacher")) {
      alert("Access denied!");
      return;
    }
    loadTeacherData();
  }

  if (page === "adminPanel") {
    if (!localStorage.getItem("isAdmin")) {
      alert("Access denied!");
      return;
    }
    loadAdminData();
  }

  // Auto-close menu after selection[cite: 2]
  const navMenu = document.getElementById("navMenu");
  if (navMenu && navMenu.classList.contains("show")) {
    navMenu.classList.remove("show");
  }

  document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
  const targetPage = document.getElementById(page);
  if (targetPage) targetPage.classList.add("active");

  if (page === "leaderboards") updateLeaderboards();
  if (page === "home") loadStudentActivities(); // Load teacher posts on home[cite: 1]
}

function toggleMenu() {
  document.getElementById("navMenu").classList.toggle("show");
}

function updateMenuVisibility() {
  const username = localStorage.getItem("username");
  const menuBtn = document.getElementById("menuBtn");
  if (menuBtn) {
    menuBtn.style.display = (username && username.trim() !== "") ? "block" : "none";
  }
}

function updateHeaderUsername() {
  const username = localStorage.getItem("username");
  const headerName = document.getElementById("headerUsername");
  if (headerName) {
    headerName.innerText = username ? " | " + username : "";
  }
}

// ---------- AUTHENTICATION (STUDENT, TEACHER, ADMIN) ----------
let isRegisterMode = false;

function toggleAuthMode() {
  isRegisterMode = !isRegisterMode;
  document.getElementById("registerFields").style.display = isRegisterMode ? "block" : "none";
  document.getElementById("formTitle").innerText = isRegisterMode ? "Student Register" : "Student Login";
  document.getElementById("authBtn").innerText = isRegisterMode ? "Register" : "Login";
  document.getElementById("toggleText").innerText = isRegisterMode ? "Already have an account?" : "Don't have an account?";
  document.getElementById("toggleLink").innerText = isRegisterMode ? "Login" : "Register";
}

function handleStudentAuth(event) {
  event.preventDefault();
  const name = document.getElementById("loginName").value.trim();
  const pass = document.getElementById("loginPass").value.trim();
  const section = document.getElementById("loginSection").value;

  // 1. Check for Admin Credentials
  if (!isRegisterMode && name === "admin" && pass === "admin123") {
    localStorage.setItem("isAdmin", "true");
    showPage("adminPanel");
    return;
  }

  // 2. Check for Teacher Credentials
  if (!isRegisterMode && name === "teacher" && pass === "1234") {
    localStorage.setItem("isTeacher", "true");
    showPage("teacherDashboard");
    return;
  }

  let users = JSON.parse(localStorage.getItem("registeredStudents")) || [];

  if (isRegisterMode) {
    if (!section) return alert("Please select a section!");
    if (users.find(u => u.name === name)) return alert("Username already exists!");

    users.push({ name, password: pass, section });
    localStorage.setItem("registeredStudents", JSON.stringify(users));
    alert("Registration successful! Please login.");
    toggleAuthMode();
  } else {
    // 3. Regular Student Login
    const user = users.find(u => u.name === name && u.password === pass);
    if (user) {
      localStorage.setItem("username", user.name);
      localStorage.setItem("section", user.section);
      completeLogin();
    } else {
      alert("Invalid credentials!");
    }
  }
}

function teacherLogin(event) {
  event.preventDefault();
  const user = document.getElementById("teacherUser").value;
  const pass = document.getElementById("teacherPass").value;
  if (name === "teacher" && pass === "1234") {
    localStorage.setItem("isTeacher", "true"); // Must be string "true"
    localStorage.setItem("username", "Teacher");
    showPage("teacherDashboard");
    return;
  }
}

function adminLogin(event) {
  event.preventDefault();
  const user = document.getElementById("adminUser").value;
  const pass = document.getElementById("adminPass").value;
  // Default credentials
  if (user === "admin" && pass === "admin123") {
    localStorage.setItem("isAdmin", "true");
    showPage("adminPanel");
  } else {
    alert("Invalid admin credentials!");
  }
}

function completeLogin() {
  updateMenuVisibility();
  updateHeaderUsername();
  loadUserStats();
  document.getElementById("aboutPopup").style.display = "flex";
  startTeacherIntro();
}

function logoutUser() {
  localStorage.removeItem("username");
  localStorage.removeItem("section");
  updateMenuVisibility();
  updateHeaderUsername();
  showPage("user");
}

function teacherLogout() {
  localStorage.removeItem("isTeacher");
  showPage("user");
}

function adminLogout() {
  localStorage.removeItem("isAdmin");
  showPage("user");
}

// --- Updated Teacher Data Loading ---
function loadTeacherData() {
  let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
  renderTeacherTable(leaderboard);
  loadSections(); // Populates the dropdown
}

// Populate the "Select Section" dropdown based on existing student data
function loadSections() {
  const leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
  const sections = [...new Set(leaderboard.map(u => u.section).filter(s => s))];
  const select = document.getElementById("sectionFilter");

  if (select) {
    select.innerHTML = '<option value="all">All Sections</option>' +
      sections.map(s => `<option value="${s}">${s}</option>`).join('');
  }
}

// Filter the table by section or search name
function filterBySection() {
  const searchTerm = document.getElementById("teacherSearch").value.toLowerCase();
  const sectionTerm = document.getElementById("sectionFilter").value;
  let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];

  const filtered = leaderboard.filter(user => {
    const matchesName = user.name.toLowerCase().includes(searchTerm);
    const matchesSection = (sectionTerm === "all" || user.section === sectionTerm);
    return matchesName && matchesSection;
  });

  renderTeacherTable(filtered);
}

// Sort logic for the Teacher Dashboard buttons
function sortTeacher(criteria) {
  let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
  if (criteria === 'score') {
    leaderboard.sort((a, b) => b.score - a.score);
  } else if (criteria === 'practice') {
    leaderboard.sort((a, b) => b.practice - a.practice);
  }
  renderTeacherTable(leaderboard);
}

function loadAdminData() {
  let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
  document.getElementById("totalUsers").innerText = leaderboard.length;
  if (leaderboard.length > 0) {
    document.getElementById("topPlayer").innerText = leaderboard[0].name;
  }
  renderAdminTable(leaderboard);
}

function renderTeacherTable(data) {
  const tbody = document.getElementById("teacherTableBody");
  tbody.innerHTML = data.map(user => `
    <tr style="text-align:center; border-bottom:1px solid #ddd;">
      <td>${user.name}</td>
      <td>${user.section || "N/A"}</td>
      <td>${user.score}%</td>
      <td>${user.practice}</td>
    </tr>
  `).join('');
}

function renderAdminTable(data) {
  const tbody = document.getElementById("adminTableBody");
  tbody.innerHTML = data.map(user => `
    <tr>
      <td>${user.name}</td>
      <td>${user.section || "N/A"}</td>
      <td>${user.score}%</td>
      <td>${user.practice}</td>
      <td><button class="logout-btn" onclick="deleteUser('${user.name}')">Delete</button></td>
    </tr>
  `).join('');
}

function deleteUser(username) {
  if (confirm(`Are you sure you want to delete ${username}? This will permanently remove their account.`)) {
    // 1. Remove from Leaderboard data
    let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
    leaderboard = leaderboard.filter(u => u.name !== username);
    localStorage.setItem("leaderboard", JSON.stringify(leaderboard));

    // 2. Remove from the Registration list to prevent re-login
    let registeredUsers = JSON.parse(localStorage.getItem("registeredStudents")) || [];
    registeredUsers = registeredUsers.filter(u => u.name !== username);
    localStorage.setItem("registeredStudents", JSON.stringify(registeredUsers));

    // 3. Clear their specific stats
    localStorage.removeItem("stats_" + username);

    // Refresh the admin view
    loadAdminData();
    alert(`${username} has been completely removed from the system.`);
  }
}

function clearLeaderboard() {
  if (confirm("Clear all student data? This cannot be undone.")) {
    localStorage.removeItem("leaderboard");
    loadAdminData();
  }
}

// ---------- TEACHER ACTIVITIES ----------
// Update this function to refresh the teacher's management table
function addActivity() {
  const title = document.getElementById("newActivityTitle").value.trim();
  const text = document.getElementById("newActivityText").value.trim();

  if (!title || !text) return alert("Please enter both a title and practice text.");

  let activities = JSON.parse(localStorage.getItem("teacherActivities")) || [];
  activities.push({
    title,
    text,
    date: new Date().toLocaleDateString(),
    id: Date.now() // Unique ID for tracking
  });
  localStorage.setItem("teacherActivities", JSON.stringify(activities));

  alert("Activity added successfully!");
  document.getElementById("newActivityTitle").value = "";
  document.getElementById("newActivityText").value = "";
  renderTeacherActivityManager();
}

function renderTeacherActivityManager() {
  const tbody = document.getElementById("teacherActivityTableBody");
  const activities = JSON.parse(localStorage.getItem("teacherActivities")) || [];
  if (!tbody) return;

  tbody.innerHTML = activities.map((act, index) => `
    <tr>
      <td><input type="text" value="${act.title}" onchange="updateActivity(${index}, 'title', this.value)"></td>
      <td><textarea onchange="updateActivity(${index}, 'text', this.value)">${act.text}</textarea></td>
      <td>
        <button class="logout-btn" onclick="deleteActivityFromManager(${index})">Delete</button>
      </td>
    </tr>
  `).join('');
}

function updateActivity(index, field, value) {
  let activities = JSON.parse(localStorage.getItem("teacherActivities")) || [];
  activities[index][field] = value;
  localStorage.setItem("teacherActivities", JSON.stringify(activities));
}

// New function to render the activity list with delete buttons in the Teacher Panel
function renderTeacherActivityManager() {
  const tbody = document.getElementById("teacherActivityTableBody");
  const activities = JSON.parse(localStorage.getItem("teacherActivities")) || [];

  if (!tbody) return;

  if (activities.length === 0) {
    tbody.innerHTML = `<tr><td colspan="3">No active activities.</td></tr>`;
    return;
  }

  tbody.innerHTML = activities.map((act, index) => `
    <tr>
      <td>${act.title}</td>
      <td>${act.date}</td>
      <td>
        <button class="logout-btn" onclick="deleteActivityFromManager(${index})" 
                style="padding: 5px 10px; font-size: 12px;">
          Delete Activity
        </button>
      </td>
    </tr>
  `).join('');
}

// Dedicated delete function for the teacher manager
function deleteActivityFromManager(index) {
  if (confirm("Are you sure you want to delete this activity?")) {
    let activities = JSON.parse(localStorage.getItem("teacherActivities")) || [];
    activities.splice(index, 1);
    localStorage.setItem("teacherActivities", JSON.stringify(activities));

    renderTeacherActivityManager(); // Refresh teacher view
    if (document.getElementById("studentActivityList")) {
      loadStudentActivities(); // Refresh student view if they are on the home page
    }
  }
}

// Update the existing loadTeacherData to include the new table
function loadTeacherData() {
  let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
  renderTeacherTable(leaderboard);
  loadSections();
  renderTeacherActivityManager(); // Add this line
}

// --- ACTIVITY MANAGEMENT ---

// Delete a specific activity
function deleteActivity(index) {
  if (confirm("Are you sure you want to delete this activity?")) {
    let activities = JSON.parse(localStorage.getItem("teacherActivities")) || [];
    activities.splice(index, 1);
    localStorage.setItem("teacherActivities", JSON.stringify(activities));

    // Refresh both the teacher view (if logic exists) and student view
    loadStudentActivities();
    alert("Activity deleted.");
  }
}

// --- TEACHER TABLE ENHANCEMENTS ---

function renderTeacherTable(data) {
  const tbody = document.getElementById("teacherTableBody");
  tbody.innerHTML = data.map(user => {
    // Determine color based on score
    const barColor = user.score >= 80 ? "#58cc02" : (user.score >= 50 ? "#ffc800" : "#ff4b4b");

    return `
    <tr style="text-align:center; border-bottom:1px solid #ddd;">
      <td>${user.name}</td>
      <td>${user.section || "N/A"}</td>
      <td>
        <div style="display: flex; align-items: center; gap: 10px;">
          <div style="flex: 1; background: #eee; height: 10px; border-radius: 5px; overflow: hidden;">
            <div style="width: ${user.score}%; background: ${barColor}; height: 100%;"></div>
          </div>
          <span>${user.score}%</span>
        </div>
      </td>
      <td>${user.practice}</td>
    </tr>
  `}).join('');
}

function loadStudentActivities() {
  const container = document.getElementById("studentActivityList");
  const activities = JSON.parse(localStorage.getItem("teacherActivities")) || [];
  if (!container) return;

  container.innerHTML = activities.map((act, index) => `
    <div class="feature-card" style="border-top: 5px solid #1cb0f6;">
      <h3>${act.title}</h3>
      <p>${act.text.substring(0, 50)}...</p>
      <button class="main-btn" onclick="startTeacherActivity(${index})">Start Practice</button>
    </div>
  `).join('');
}

// Global variable to hold recognition for the activity
let activityRecognition;

function startTeacherActivity(index) {
  const activities = JSON.parse(localStorage.getItem("teacherActivities")) || [];
  const selected = activities[index];

  if (!selected) return;

  // Set UI elements in the new panel
  document.getElementById("activityPracticeTitle").innerText = selected.title;
  document.getElementById("activityTargetText").innerText = selected.text;
  document.getElementById("activityProgressBar").style.width = "0%";
  document.getElementById("activityFeedbackText").innerText = "Ready to practice!";

  // Store current activity info
  localStorage.setItem("currentActivityId", selected.id);
  localStorage.setItem("currentActivityText", selected.text);

  showPage('activityPractice');
}

function toggleActivitySpeech() {
  const micBtn = document.getElementById("activityMicBtn");
  const targetText = localStorage.getItem("currentActivityText");

  if (micBtn.classList.contains("recording")) {
    activityRecognition.stop();
    micBtn.classList.remove("recording");
    micBtn.innerText = "🎤 Start Practice";
  } else {
    startActivityRecognition(targetText);
    micBtn.classList.add("recording");
    micBtn.innerText = "🛑 Stop & Check";
  }
}

function startActivityRecognition(target) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) return alert("Browser does not support speech recognition.");

  activityRecognition = new SpeechRecognition();
  activityRecognition.lang = "en-US";
  activityRecognition.interimResults = false;

  activityRecognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript.toLowerCase();
    compareActivitySpeech(transcript, target.toLowerCase());
  };

  activityRecognition.onend = () => {
    document.getElementById("activityMicBtn").classList.remove("recording");
    document.getElementById("activityMicBtn").innerText = "🎤 Start Practice";
  };

  activityRecognition.start();
}

function compareActivitySpeech(spoken, target) {
  const feedback = document.getElementById("activityFeedbackText");
  const progressBar = document.getElementById("activityProgressBar");

  const spokenWords = spoken.toLowerCase().trim().split(/\s+/);
  const targetWords = target.toLowerCase().trim().split(/\s+/);

  let matches = 0;

  targetWords.forEach(word => {
    if (spokenWords.includes(word)) matches++;
  });

  // Calculate percentage
  const accuracy = Math.round((matches / targetWords.length) * 100);

  // Smart AI Feedback
  let aiComment = "";

  if (accuracy >= 90) {
    aiComment = "Excellent pronunciation! Your speech is very clear.";
  } else if (accuracy >= 75) {
    aiComment = "Very good speaking. Try improving your pacing slightly.";
  } else if (accuracy >= 50) {
    aiComment = "Good try. Focus more on pronunciation and missing words.";
  } else {
    aiComment = "Keep practicing slowly and clearly.";
  }

  // Detect missed words
  const missedWords = targetWords.filter(
    word => !spokenWords.includes(word)
  );

  if (missedWords.length > 0) {
    aiComment += " Missing words: " +
      missedWords.slice(0, 3).join(", ");
  }

  // Update feedback UI
  feedback.innerHTML = `
    <div class="feedback-percentage">
      ${accuracy}% Accuracy
    </div>

    <p class="transcript">
      "${spoken}"
    </p>

    <div class="activity-ai-feedback">
      🤖 ${aiComment}
    </div>
  `;

  // Speak AI feedback aloud
  speakAIFeedback(aiComment);

  // Update progress bar
  if (progressBar) {
    progressBar.style.width = accuracy + "%";

    progressBar.style.background =
      accuracy >= 80
        ? "#58cc02"
        : accuracy >= 50
          ? "#ffc800"
          : "#ff4b4b";
  }

  // Save progress
  saveDetailedProgress(accuracy);
}

function saveDetailedProgress(score) {
  const username = localStorage.getItem("username");
  const activityId = localStorage.getItem("currentActivityId");

  if (username && activityId) {
    // 1. Update the specific Activity Score Ledger
    let activityScores = JSON.parse(localStorage.getItem(`activity_scores_${username}`)) || {};
    if (!activityScores[activityId] || score > activityScores[activityId]) {
      activityScores[activityId] = score;
      localStorage.setItem(`activity_scores_${username}`, JSON.stringify(activityScores));
    }

    // 2. Update the Student's master record for the Dashboard
    let students = JSON.parse(localStorage.getItem("students")) || [];
    let studentIndex = students.findIndex(s => s.username === username);

    if (studentIndex !== -1) {
      // Update average score logic
      let currentTotal = students[studentIndex].totalScore || 0;
      let currentCount = students[studentIndex].practiceCount || 0;

      students[studentIndex].totalScore = currentTotal + score;
      students[studentIndex].practiceCount = currentCount + 1;
      // Calculate new average
      students[studentIndex].avgScore = Math.round(students[studentIndex].totalScore / students[studentIndex].practiceCount);

      localStorage.setItem("students", JSON.stringify(students));
    }
  }
}

function saveActivityProgress(score) {
  const username = localStorage.getItem("username");
  const activityId = localStorage.getItem("currentActivityId");

  if (username && activityId) {
    let scores = JSON.parse(localStorage.getItem(`activity_scores_${username}`)) || {};
    // Save only if it's a higher score
    if (!scores[activityId] || score > scores[activityId]) {
      scores[activityId] = score;
      localStorage.setItem(`activity_scores_${username}`, JSON.stringify(scores));
    }

    // Update general stats for teacher view
    let students = JSON.parse(localStorage.getItem("leaderboard")) || [];
    let student = students.find(s => s.name === username);
    if (student) {
      student.score = score; // Or an average
      student.practice++;
      localStorage.setItem("leaderboard", JSON.stringify(students));
    }
  }
}

// Delete Function
function deleteActivity(index) {
  if (confirm("Delete this activity?")) {
    let activities = JSON.parse(localStorage.getItem("teacherActivities")) || [];
    activities.splice(index, 1);
    localStorage.setItem("teacherActivities", JSON.stringify(activities));
    loadStudentActivities(); // Refresh the list immediately
  }
}
// ---------- SPEECH & PRACTICE LOGIC ----------
let level = 1;
let totalPractice = 0, totalScore = 0;

const levelTexts = {
  1: ["Hello", "Good morning", "Thank you"],
  2: ["Practice speaking every day", "Learning languages is fun"],
  3: ["Technology helps us learn faster by giving us quick and easy access to information.", "Learning apps and digital tools also make studying more interactive and enjoyable.", "Because of technology, people can communicate with teachers and classmates instantly, which helps them understand lessons better."]
};

// ---------- AI TUTOR LOGIC ----------
let aiConversation = [];

function startConversation() {
  const chatBox = document.getElementById("chatBox");
  chatBox.innerHTML = ""; // Clear previous chat
  aiConversation = [];

  const initialMsg = "Hello! I am your Smart Tutor. How can I help you practice your English today?";
  appendChatMessage("ai", initialMsg);
  speakTextAloud(initialMsg);
}

function appendChatMessage(sender, text) {
  const chatBox = document.getElementById("chatBox");
  const msgDiv = document.createElement("div");
  msgDiv.className = sender === "ai" ? "ai-msg" : "user-msg";
  msgDiv.innerText = text;
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

function speakToAI() {
  const micBtn = event.target;
  micBtn.classList.add('recording');

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    alert("Browser does not support Speech Recognition");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";

  recognition.onresult = function (event) {
    const userSpeech = event.results[0][0].transcript;
    appendChatMessage("user", userSpeech);
    generateAIResponse(userSpeech);
  };

  recognition.onend = () => micBtn.classList.remove('recording');
  recognition.start();
}

function generateAIResponse(userInput) {
  // Simple logic to simulate AI "understanding"
  let response = "";
  const input = userInput.toLowerCase();

  if (input.includes("hello") || input.includes("hi")) {
    response = "Hi there! Would you like to practice some common phrases or a specific topic?";
  } else if (input.includes("practice")) {
    response = "Sure! Let's try saying: 'The quick brown fox jumps over the lazy dog.'";
  } else if (input.includes("weather")) {
    response = "It's a great day to practice English! How is the weather where you are?";
  } else {
    response = "That's interesting! Tell me more about that, or ask me for a practice sentence.";
  }

  setTimeout(() => {
    appendChatMessage("ai", response);
    speakTextAloud(response);

    // Provide feedback on their speaking clarity
    document.getElementById("aiFeedback").innerText = "AI Tip: Your pronunciation sounds clear!";
  }, 1000);
}

// Helper to make the AI speak
function speakTextAloud(text) {
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 1.0;

  // Visual animation for AI mouth if it exists
  const mouth = document.querySelector(".ai-mouth");
  utterance.onstart = () => mouth?.classList.add("talking");
  utterance.onend = () => mouth?.classList.remove("talking");

  window.speechSynthesis.speak(utterance);
}

function selectLevel(l) {
  level = l;
  const levelDisplay = document.getElementById("currentLevel");
  if (levelDisplay) levelDisplay.innerText = l;
  showPage("practice");
  generateText();
}

function generateText() {
  let texts = levelTexts[level];
  document.getElementById("practiceTargetText").innerText = texts[Math.floor(Math.random() * texts.length)];
}

// Function to read the target text aloud using the browser's speech synthesis
function speakText() {
  const targetText = document.getElementById("practiceTargetText").innerText;

  if (!targetText || targetText === "Press Generate to Start") {
    alert("Please generate text first!");
    return;
  }

  // Stop current speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(targetText);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  utterance.pitch = 1;

  window.speechSynthesis.speak(utterance);
}

// Function to read teacher activity text aloud
function speakActivityText() {
  const activityText = document.getElementById("activityTargetText").innerText;

  if (!activityText || activityText === "Loading activity...") {
    alert("No activity text available.");
    return;
  }

  // Stop current speech first
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(activityText);
  utterance.lang = "en-US";
  utterance.rate = 0.9;
  utterance.pitch = 1;

  window.speechSynthesis.speak(utterance);
}
function startSpeechRecognition() {
  const micBtn = event.target;
  micBtn.classList.add('recording');

  const target = document.getElementById("practiceTargetText").innerText;

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Browser does not support Speech Recognition");
    micBtn.classList.remove('recording');
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;

  recognition.start();

  recognition.onresult = function (event) {
    const speech = event.results[0][0].transcript;

    document.getElementById("speechResult").innerText =
      "You said: " + speech;

    let score = similarity(speech, target);

    updateScore(score);

    // Show score
    const accuracyText = document.getElementById("accuracyText");
    if (accuracyText) {
      accuracyText.innerText = "Accuracy: " + score + "%";
    }

    // AI FEEDBACK
    generatePronunciationFeedback(score, speech, target);
  };

  recognition.onend = () => {
    micBtn.classList.remove('recording');
  };
}

// ---------- AI AUDIO FEEDBACK ----------

// Speak AI feedback aloud
function speakAIFeedback(message) {
  window.speechSynthesis.cancel();

  const feedbackVoice = new SpeechSynthesisUtterance(message);
  feedbackVoice.lang = "en-US";
  feedbackVoice.rate = 0.95;
  feedbackVoice.pitch = 1;

  window.speechSynthesis.speak(feedbackVoice);
}

// Generate smart pronunciation feedback
function generatePronunciationFeedback(score, spoken, target) {
  let feedback = "";

  if (score >= 90) {
    feedback = "Excellent pronunciation! Your speech was very clear and accurate.";
  } else if (score >= 75) {
    feedback = "Very good job! Try to improve your pacing and word clarity.";
  } else if (score >= 50) {
    feedback = "Good attempt. Focus more on correct pronunciation of each word.";
  } else {
    feedback = "Keep practicing. Listen carefully and repeat the sentence slowly.";
  }

  // Extra AI tips
  const spokenWords = spoken.toLowerCase().split(" ");
  const targetWords = target.toLowerCase().split(" ");

  let missedWords = targetWords.filter(word => !spokenWords.includes(word));

  if (missedWords.length > 0) {
    feedback += " You missed these words: " + missedWords.slice(0, 3).join(", ");
  }

  // Display on screen
  const feedbackBox = document.getElementById("aiFeedback");
  if (feedbackBox) {
    feedbackBox.innerHTML = `
      <strong>AI Feedback:</strong><br>
      ${feedback}
    `;
  }

  // Speak feedback aloud
  speakAIFeedback(feedback);
}

// ---------- STATS & STORAGE ----------
function saveUserStats() {
  const username = localStorage.getItem("username");
  if (!username) return;
  localStorage.setItem("stats_" + username, JSON.stringify({ practice: totalPractice, score: totalScore }));
}

function loadUserStats() {
  const username = localStorage.getItem("username");
  const stats = JSON.parse(localStorage.getItem("stats_" + username)) || { practice: 0, score: 0 };

  totalPractice = stats.practice;
  totalScore = stats.score;

  // Update UI for practice and score
  document.getElementById("totalPractice").innerText = totalPractice;
  document.getElementById("averageScore").innerText = totalPractice > 0 ? Math.floor(totalScore / totalPractice) + "%" : "0%";

  // ADD THIS: Load and display the existing streak from storage
  const savedStreak = localStorage.getItem("userStreak") || 0;
  const streakText = document.getElementById("streakText");
  if (streakText) {
    streakText.innerText = savedStreak;
  }
}

function updateScore(score) {
  totalPractice++;
  totalScore += score;
  saveUserStats();

  // --- ADD THIS LINE HERE ---
  if (score > 0) {
    updateStreak();
  }

  // --------------------------

  document.getElementById("totalPractice").innerText = totalPractice;
  document.getElementById("averageScore").innerText = Math.floor(totalScore / totalPractice) + "%";

  let bar = document.getElementById("progressBar");
  if (bar) {
    bar.style.width = score + "%";
    bar.style.background = score >= 80 ? "#58cc02" : (score >= 50 ? "#ffc800" : "#ff4b4b");
  }

  updateLeaderboards();
}

function updateLeaderboards() {
  let leaderboard = JSON.parse(localStorage.getItem("leaderboard")) || [];
  const username = localStorage.getItem("username");
  if (!username) return;

  const avgScore = totalPractice > 0 ? Math.floor(totalScore / totalPractice) : 0;
  let userIndex = leaderboard.findIndex(u => u.name === username);

  if (userIndex > -1) {
    leaderboard[userIndex].practice = totalPractice;
    leaderboard[userIndex].score = avgScore;
  } else {
    leaderboard.push({ name: username, practice: totalPractice, score: avgScore, section: localStorage.getItem("section") });
  }

  leaderboard.sort((a, b) => b.score - a.score);
  localStorage.setItem("leaderboard", JSON.stringify(leaderboard));

  const container = document.getElementById("leaderboardContainer");
  const podium = document.getElementById("podium");
  if (!container || !podium) return;

  container.innerHTML = ""; podium.innerHTML = "";

  leaderboard.slice(0, 3).forEach((user, i) => {
    podium.innerHTML += `<div class="podium-card podium-${i + 1}"><h2>${["🥇", "🥈", "🥉"][i]}</h2><h3>${user.name}</h3><p>${user.score}%</p></div>`;
  });

  leaderboard.slice(3).forEach((user, i) => {
    container.innerHTML += `<div class="leaderboard-row"><div class="rank">#${i + 4}</div><div class="player-info"><b>${user.name}</b><br><small>${user.practice} practices</small></div><div class="player-score">${user.score}%</div></div>`;
  });
}

function updateStreak() {
  const lastDate = localStorage.getItem("lastPracticeDate");
  const today = new Date().toDateString();
  let streak = parseInt(localStorage.getItem("userStreak")) || 0;

  if (lastDate === today) {
    return; // Already updated today
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  if (lastDate === yesterday.toDateString()) {
    streak++; // Consecutive day
  } else {
    streak = 1; // Reset to 1 (first day or missed a day)
  }

  localStorage.setItem("userStreak", streak);
  localStorage.setItem("lastPracticeDate", today);

  const streakText = document.getElementById("streakText");
  if (streakText) streakText.innerText = streak;
}
// CALL THIS inside your "Practice" completion logic (where the score is calculated)
// Example: if (score > 50) { updateStreak(); }

// ---------- UTILITIES ----------
function similarity(user, target) {
  let userArr = user.toLowerCase().split(" "), targetArr = target.toLowerCase().split(" ");
  let correct = 0;
  targetArr.forEach((word, i) => {
    if (userArr[i] === word) correct++;
  });
  return Math.floor((correct / targetArr.length) * 100);
}

function startTeacherIntro() {
  const speech = new SpeechSynthesisUtterance("Welcome to Smart Speech. Practice daily to improve.");
  speechSynthesis.speak(speech);
}

function continueToSystem() {
  document.getElementById("aboutPopup").style.display = "none";
  showPage("home");
}

window.onload = function () {
  updateMenuVisibility();
  updateHeaderUsername();
  if (localStorage.getItem("username")) {
    loadUserStats();
    showPage("home");
  } else {
    showPage("user");
  }
  updateLeaderboards();
};

function setupPracticeSession(text) {
  const practiceTextElement = document.getElementById("practiceText");
  if (practiceTextElement) {
    practiceTextElement.innerText = text;
  }

  // Check if this is a teacher-assigned activity
  const activityId = localStorage.getItem("currentActivityId");
  if (activityId) {
    console.log("Teacher activity mode active for ID:", activityId);
  } else {
    console.log("Standard practice mode active.");
  }

  // Clear any previous results
  document.getElementById("userSpeechText").innerText = "Waiting for speech...";
  document.getElementById("accuracyResult").innerText = "0%";
}

function processPracticeResult(userText, targetText) {
  const score = similarity(userText, targetText);
  const username = localStorage.getItem("username");
  const activityId = localStorage.getItem("currentActivityId");

  // Display result
  document.getElementById("accuracyResult").innerText = score + "%";

  if (score > 50) {
    updateStreak(); // Existing streak logic

    // 1. Update Global Progress (for Leaderboards)
    let students = JSON.parse(localStorage.getItem("students")) || [];
    let studentIndex = students.findIndex(s => s.username === username);

    if (studentIndex !== -1) {
      students[studentIndex].totalScore = (students[studentIndex].totalScore || 0) + score;
      students[studentIndex].practiceCount = (students[studentIndex].practiceCount || 0) + 1;
      localStorage.setItem("students", JSON.stringify(students));
    }

    // 2. Update Specific Teacher Activity Progress
    if (activityId) {
      let activityProgress = JSON.parse(localStorage.getItem(`activity_scores_${username}`)) || {};

      // Only update if the new score is higher than the previous attempt
      if (!activityProgress[activityId] || score > activityProgress[activityId]) {
        activityProgress[activityId] = score;
        localStorage.setItem(`activity_scores_${username}`, JSON.stringify(activityProgress));
      }

      // Clean up: remove the activity ID so the next standard practice isn't counted as an activity
      localStorage.removeItem("currentActivityId");
      alert(`Activity Completed! Score: ${score}% saved to your progress.`);
    }
  }

  if (typeof updateLeaderboards === "function") updateLeaderboards();
}

function loadStudentDashboard() {
  const username = localStorage.getItem("username");
  const students = JSON.parse(localStorage.getItem("students")) || [];
  const student = students.find(s => s.username === username);

  if (student) {
    // Display the percentage in the dashboard
    document.getElementById("avgScoreText").innerText = (student.avgScore || 0) + "%";
    document.getElementById("streakText").innerText = student.streak || 0;
    // ... update other stats
  }
}