export async function getTaskById(taskId) {
  try {
    const res = await fetch(`http://localhost:5000/task/${taskId}`);
    if (!res.ok) throw new Error("Failed to fetch task");
    return await res.json();
  } catch (err) {
    console.error(err);
    return null;
  }
}

