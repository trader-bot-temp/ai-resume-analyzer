const supabase = require("../db");

async function uploadFile(file, path) {
  const { data, error } = await supabase.storage
    .from("resumes")
    .upload(path, file.buffer);

  if (error) throw error;

  return data;
}

module.exports = { uploadFile };