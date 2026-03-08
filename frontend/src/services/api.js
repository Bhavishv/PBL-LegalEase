export const uploadContract = async (file) => {

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/analyze", {
    method: "POST",
    body: formData
  });

  return response.json();
};