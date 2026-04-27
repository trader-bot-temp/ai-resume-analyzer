async function analyze() {
  const resume = document.getElementById("resume").files[0];
  const jd = document.getElementById("jd").files[0];

  if (!resume || !jd) {
    alert("Please upload both files");
    return;
  }

  const formData = new FormData();
  formData.append("resume", resume);
  formData.append("jd", jd);

  document.getElementById("output").innerText = "Analyzing...";

  try {
    const response = await fetch("https://ominous-dollop-vpvvgp6q5w742p94r-5000.app.github.dev/", {
      method: "POST",
      body: formData
    });

    const data = await response.json();

    document.getElementById("output").innerText =
      JSON.stringify(data, null, 2);

  } catch (err) {
    document.getElementById("output").innerText =
      "Error: " + err.message;
  }
}

