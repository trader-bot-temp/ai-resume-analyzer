let selectedFiles = [];

// ================= FILE ADD =================
document.getElementById("resumeInput").addEventListener("change", (e) => {
  const files = Array.from(e.target.files);

  files.forEach(file => {
    if (selectedFiles.length < 5) {
      selectedFiles.push(file);
    }
  });

  renderFileList();
  e.target.value = "";
});

// ================= FILE LIST =================
function renderFileList() {
  const list = document.getElementById("fileList");
  list.innerHTML = "";

  selectedFiles.forEach((file, index) => {
    const div = document.createElement("div");
    div.className = "file-item";

    div.innerHTML = `
      <span>${file.name}</span>
      <button class="remove-btn" onclick="removeFile(${index})">✖</button>
    `;

    list.appendChild(div);
  });
}

// ================= REMOVE =================
function removeFile(index) {
  selectedFiles.splice(index, 1);
  renderFileList();
}

// ================= ANALYZE =================
async function analyze() {
  const jd = document.getElementById("jd").files[0];

  if (!selectedFiles.length || !jd) {
    alert("Upload resumes + JD");
    return;
  }

  const formData = new FormData();

  selectedFiles.forEach(file => {
    formData.append("resumes", file);
  });

  formData.append("jd", jd);

  document.getElementById("output").innerHTML = "Analyzing resumes...";

  try {
    const response = await fetch(
      "https://ominous-dollop-vpvvgp6q5w742p94r-5000.app.github.dev/analyze-multiple",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    renderResults(data.results || []);
  } catch (err) {
    document.getElementById("output").innerHTML = err.message;
  }
}

// ================= RESULTS =================
function renderResults(results) {
  const container = document.getElementById("output");
  container.innerHTML = "";

  results.forEach((r, index) => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <div class="card-header">
        <h3>#${index + 1} ${r.name}</h3>
        <span class="score">${r.score}%</span>
      </div>

      <p class="summary">${r.summary}</p>

      <div class="grid">
        <div>
          <h4>Strengths</h4>
          <ul>
            ${(r.matched_skills || []).map(s => `<li>${s}</li>`).join("")}
          </ul>
        </div>

        <div>
          <h4>Missing Skills</h4>
          <ul>
            ${(r.missing_skills || []).map(s => `<li>${s}</li>`).join("")}
          </ul>
        </div>
      </div>

      <div class="metrics">
        <span>Experience: ${r.experience_match}%</span>
        <span>Skills: ${r.skill_match}%</span>
        <span>Tools: ${r.tools_match}%</span>
      </div>

      <button class="secondary-btn" onclick="generateQuestions(${index})">
        Generate Questions
      </button>

      <div id="questions-${index}"></div>
    `;

    container.appendChild(div);
  });
}

// ================= QUESTIONS =================
function generateQuestions(index) {
  const box = document.getElementById(`questions-${index}`);

  box.innerHTML = `<p>Generating questions...</p>`;

  setTimeout(() => {
    box.innerHTML = `
      <h4>Screening Questions</h4>
      <ul>
        <li>Explain your strongest skill with example.</li>
        <li>Describe a real-world project.</li>
        <li>How would you learn a missing skill?</li>
      </ul>
    `;
  }, 600);
}