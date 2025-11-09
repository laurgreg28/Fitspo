// Show Profile link if user is logged in
const isLoggedIn = localStorage.getItem("isLoggedIn");
const profileLink = document.getElementById("profileLink");
if (isLoggedIn === "true" && profileLink) {
  profileLink.style.display = "inline";
}

// Simulate login (for login.html)
function loginUser() {
  localStorage.setItem("isLoggedIn", "true");
  window.location.href = "profile.html";
}

const loginForm = document.querySelector("form");
if (loginForm) {
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    loginUser();
  });
}
