const API = "http://localhost:5000";

const form = document.getElementById("jobForm");

// ================= VALIDATION =================
function validate(data) {
  if (!data.title) return "Job title required";
  if (!data.jd_text) return "Job description required";
  if (data.openings < 1) return "Openings must be at least 1";
  return null;
}

// ================= CREATE JOB =================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const data = {
    title: document.getElementById("title").value,
    department: document.getElementById("department").value,
    openings: Number(document.getElementById("openings").value),
    jd_text: document.getElementById("jdText").value,
    deadline: document.getElementById("deadline").value,
  };

  const error = validate(data);
  if (error) return alert(error);

  try {
    const res = await fetch(`${API}/api/jobs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) throw new Error(result.error);

    alert("Job created successfully 🚀");
    form.reset();
  } catch (err) {
    alert(err.message);
  }
});


// ================= SAVE DRAFT =================
document.getElementById("draftBtn").onclick = async () => {
  const data = {
    title: title.value,
    department: department.value,
    openings: Number(openings.value),
    jd_text: jdText.value,
  };

  try {
    await fetch(`${API}/api/jobs/draft`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    alert("Draft saved");
  } catch {
    alert("Failed to save draft");
  }
};


// ================= AI ENHANCE JD =================
document.getElementById("enhanceBtn").onclick = async () => {
  try {
    const res = await fetch(`${API}/api/ai/enhance-jd`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        jd_text: jdText.value,
      }),
    });

    const data = await res.json();

    jdText.value = data.enhanced;
  } catch {
    alert("AI failed");
  }
};