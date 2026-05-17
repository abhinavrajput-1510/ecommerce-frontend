const userStatus = document.getElementById("user-status");

function renderUserStatus() {
  if (!userStatus) {
    return;
  }

  const storedUser = localStorage.getItem("currentUser");

  if (!storedUser) {
    userStatus.textContent = "Hello, Guest";
    userStatus.href = "auth.html";
    return;
  }

  try {
    const currentUser = JSON.parse(storedUser);
    const displayName =
      currentUser.displayName || currentUser.email.split("@")[0];
    userStatus.textContent = `Hello, ${displayName}`;
    userStatus.href = "auth.html";
  } catch (error) {
    userStatus.textContent = "Hello, Guest";
    userStatus.href = "auth.html";
  }
}

renderUserStatus();

window.addEventListener("storage", (event) => {
  if (event.key === "currentUser") {
    renderUserStatus();
  }
});
