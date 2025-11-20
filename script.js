// Universal navigation management for all pages
function updateNavigation() {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  
  // Common navigation elements that might exist on any page
  const navElements = {
    // Home page specific IDs
    loginNavLink: document.getElementById("loginNavLink"),
    quizNavLink: document.getElementById("quizNavLink"),
    profileNavLink: document.getElementById("profileNavLink"),
    logoutNavLink: document.getElementById("logoutNavLink"),
    galleryNavLink: document.getElementById("galleryNavLink"),
    
    // Quiz page specific IDs
    loginNavLinkQuiz: document.getElementById("loginNavLinkQuiz"),
    profileNavLinkQuiz: document.getElementById("profileNavLinkQuiz"),
    logoutNavLinkQuiz: document.getElementById("logoutNavLinkQuiz"),
    
    // Profile page logout button
    logoutBtn: document.getElementById("logoutBtn"),
    
    // Generic login/logout links that might exist on any page
    loginLink: document.querySelector('a[href="login.html"]'),
    profileLink: document.querySelector('a[href="profile.html"]'),
    logoutLink: document.querySelector('a[href="#"][id*="logout"], a[href="#logout"]')
  };
  
  if (isLoggedIn) {
    // User is logged in - show profile/logout, hide login
    
    // Hide all login links
    if (navElements.loginNavLink) navElements.loginNavLink.style.display = "none";
    if (navElements.loginNavLinkQuiz) navElements.loginNavLinkQuiz.style.display = "none";
    
    // Show quiz link (always available when logged in)
    if (navElements.quizNavLink) navElements.quizNavLink.style.display = "inline";
    
    // Show profile links
    if (navElements.profileNavLink) navElements.profileNavLink.style.display = "inline";
    if (navElements.profileNavLinkQuiz) navElements.profileNavLinkQuiz.style.display = "inline";
    
    // Show logout links
    if (navElements.logoutNavLink) navElements.logoutNavLink.style.display = "inline";
    if (navElements.logoutNavLinkQuiz) navElements.logoutNavLinkQuiz.style.display = "inline";
    if (navElements.logoutBtn) navElements.logoutBtn.style.display = "inline";
    
    // Show gallery link (available to everyone)
    if (navElements.galleryNavLink) navElements.galleryNavLink.style.display = "inline";
    
  } else {
    // User is not logged in - show login, hide profile/logout
    
    // Show login links
    if (navElements.loginNavLink) navElements.loginNavLink.style.display = "inline";
    if (navElements.loginNavLinkQuiz) navElements.loginNavLinkQuiz.style.display = "inline";
    
    // Show quiz link (available to everyone, but results require login)
    if (navElements.quizNavLink) navElements.quizNavLink.style.display = "inline";
    
    // Hide profile links
    if (navElements.profileNavLink) navElements.profileNavLink.style.display = "none";
    if (navElements.profileNavLinkQuiz) navElements.profileNavLinkQuiz.style.display = "none";
    
    // Hide logout links
    if (navElements.logoutNavLink) navElements.logoutNavLink.style.display = "none";
    if (navElements.logoutNavLinkQuiz) navElements.logoutNavLinkQuiz.style.display = "none";
    if (navElements.logoutBtn) navElements.logoutBtn.style.display = "none";
    
    // Show gallery link (available to everyone)
    if (navElements.galleryNavLink) navElements.galleryNavLink.style.display = "inline";
  }
}

// Call updateNavigation on page load and when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
  updateNavigation();
  updateWelcomeContent();
});
// Also call immediately in case DOM is already loaded
updateNavigation();

// Update welcome content based on login status
function updateWelcomeContent() {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const welcomeText = document.querySelector('.welcome-text');
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  // Only update home page welcome content
  if ((currentPage === 'index.html' || currentPage === '') && welcomeText && isLoggedIn) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const firstName = currentUser.firstName || 'there';
    
    welcomeText.innerHTML = `
      <h1>Welcome back, ${firstName}!</h1>
      <p>Ready to discover new styles? Browse our gallery for outfit inspiration, or retake your style quiz to update your preferences.</p>
      <div class="logged-in-actions">
        <a href="gallery.html" class="cta-button primary">Browse Gallery</a>
        <a href="quiz.html" class="cta-button secondary">Retake Quiz</a>
        <a href="profile.html" class="cta-button secondary">View Profile</a>
      </div>
    `;
  }
}

// Handle login with user verification
function loginUser() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  
  // Get stored users
  const existingUsers = JSON.parse(localStorage.getItem('styleAssistUsers') || '[]');
  
  // Find user with matching email and password
  const user = existingUsers.find(u => u.email === email && u.password === password);
  
  if (user) {
    // Set login state
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("currentUser", JSON.stringify(user));
    
    // Update navigation immediately
    updateNavigation();
    
    // Refresh gallery if on gallery page
    if (typeof window.galleryManager !== 'undefined' && window.galleryManager.refreshGallery) {
      window.galleryManager.refreshGallery();
    }
    
    // Check for pending quiz answers
    const pendingQuizAnswers = sessionStorage.getItem('pendingQuizAnswers');
    if (pendingQuizAnswers) {
      // Process pending quiz results
      processPendingQuiz(JSON.parse(pendingQuizAnswers), user);
      sessionStorage.removeItem('pendingQuizAnswers');
      
      showMessage(`Login successful! Redirecting to your quiz results...`, 'success');
      
      // Redirect to quiz results
      setTimeout(() => {
        window.location.href = "quiz.html?showResults=true";
      }, 1000);
    } else {
      showMessage(`Login successful! Welcome back, ${user.firstName}!`, 'success');
      // Normal redirect to profile
      setTimeout(() => {
        window.location.href = "profile.html";
      }, 1000);
    }
  } else {
    // Check if email exists but password is wrong
    const emailExists = existingUsers.find(u => u.email === email);
    if (emailExists) {
      showMessage("Incorrect password. Please try again.", 'error');
    } else {
      showMessage("Account not found. Please sign up first or check your email address.", 'error');
    }
  }
}

const loginForm = document.querySelector("form");
if (loginForm) {
  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();
    loginUser();
  });
}

// Logout functionality
function logoutUser() {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("currentUser");
  showMessage("You have been logged out successfully.", "info");
  
  // Update navigation immediately
  updateNavigation();
  
  // Refresh gallery if on gallery page
  if (typeof window.galleryManager !== 'undefined' && window.galleryManager.refreshGallery) {
    window.galleryManager.refreshGallery();
  }
  
  // Redirect to home page after a short delay
  setTimeout(() => {
    window.location.href = "index.html";
  }, 1000);
}

// Process pending quiz results after login/signup
function processPendingQuiz(quizAnswers, user) {
  // Create quiz result object
  const quizResult = {
    ...quizAnswers,
    completedDate: new Date().toISOString(),
    userId: user.userId
  };
  
  // Update user's quiz results
  user.quizResults = quizResult;
  user.hasCompletedQuiz = true;
  
  // Update currentUser in localStorage
  localStorage.setItem('currentUser', JSON.stringify(user));
  
  // Update the user in the users array
  const users = JSON.parse(localStorage.getItem('styleAssistUsers') || '[]');
  const userIndex = users.findIndex(u => u.userId === user.userId);
  if (userIndex !== -1) {
    users[userIndex] = user;
    localStorage.setItem('styleAssistUsers', JSON.stringify(users));
  }
}

// Helper function to show messages
function showMessage(message, type) {
  // Remove any existing message
  const existingMessage = document.querySelector('.auth-message');
  if (existingMessage) {
    existingMessage.remove();
  }

  const messageDiv = document.createElement('div');
  messageDiv.className = `auth-message ${type}`;
  messageDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    color: white;
    font-weight: 600;
    z-index: 3000;
    max-width: 400px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    ${type === 'error' ? 'background-color: #e74c3c;' : 
      type === 'success' ? 'background-color: #27ae60;' : 'background-color: #3498db;'}
  `;
  messageDiv.textContent = message;
  
  document.body.appendChild(messageDiv);
  
  setTimeout(() => {
    if (messageDiv.parentNode) {
      messageDiv.remove();
    }
  }, 3000);
}

// Add logout event listeners for all logout buttons
function setupLogoutEventListeners() {
  const logoutButtons = [
    document.getElementById("logoutBtn"), // Profile page
    document.getElementById("logoutNavLink"), // Home page
    document.getElementById("logoutNavLinkQuiz") // Quiz page
  ];

  logoutButtons.forEach(button => {
    if (button) {
      // Remove existing event listener to avoid duplicates
      button.removeEventListener("click", handleLogoutClick);
      button.addEventListener("click", handleLogoutClick);
    }
  });
}

function handleLogoutClick(e) {
  e.preventDefault();
  logoutUser();
}

// Setup logout listeners when DOM is loaded
document.addEventListener('DOMContentLoaded', setupLogoutEventListeners);
// Also setup immediately in case DOM is already loaded
setupLogoutEventListeners();

// Prevent access to profile if not logged in
document.addEventListener('click', function(e) {
  if (e.target.matches('a[href="profile.html"]')) {
    const currentLoggedIn = localStorage.getItem("isLoggedIn");
    if (currentLoggedIn !== "true") {
      e.preventDefault();
      alert("Please log in to access your profile.");
      window.location.href = "login.html";
    }
  }
});

// Image Modal Functionality
document.addEventListener('DOMContentLoaded', function() {
  const trendCards = document.querySelectorAll('.trend-card');
  const imageOverlay = document.getElementById('imageOverlay');
  const overlayImage = document.getElementById('overlayImage');
  const closeOverlay = document.getElementById('closeOverlay');
  const prevArrow = document.getElementById('prevArrow');
  const nextArrow = document.getElementById('nextArrow');
  const imageCounter = document.getElementById('imageCounter');
  
  let currentImageIndex = 0;
  let images = [];

  // Collect all trend card images
  trendCards.forEach(card => {
    const img = card.querySelector('img');
    if (img) {
      images.push({
        src: img.src,
        alt: img.alt
      });
    }
  });

  // Add click event to all trend card images
  trendCards.forEach((card, index) => {
    const img = card.querySelector('img');
    if (img) {
      img.addEventListener('click', function(e) {
        e.stopPropagation(); // Prevent event bubbling
        currentImageIndex = index;
        openImageOverlay();
      });
    }
  });

  // Navigation arrow events
  if (prevArrow) {
    prevArrow.addEventListener('click', function(e) {
      e.stopPropagation();
      if (currentImageIndex > 0) {
        currentImageIndex--;
      } else {
        // Loop to last image when at first image
        currentImageIndex = images.length - 1;
      }
      updateOverlayImage();
    });
  }

  if (nextArrow) {
    nextArrow.addEventListener('click', function(e) {
      e.stopPropagation();
      if (currentImageIndex < images.length - 1) {
        currentImageIndex++;
      } else {
        // Loop to first image when at last image
        currentImageIndex = 0;
      }
      updateOverlayImage();
    });
  }

  // Keyboard navigation
  document.addEventListener('keydown', function(e) {
    if (imageOverlay.classList.contains('active')) {
      switch(e.key) {
        case 'Escape':
          closeImageOverlay();
          break;
        case 'ArrowLeft':
          if (currentImageIndex > 0) {
            currentImageIndex--;
          } else {
            // Loop to last image when at first image
            currentImageIndex = images.length - 1;
          }
          updateOverlayImage();
          break;
        case 'ArrowRight':
          if (currentImageIndex < images.length - 1) {
            currentImageIndex++;
          } else {
            // Loop to first image when at last image
            currentImageIndex = 0;
          }
          updateOverlayImage();
          break;
      }
    }
  });

  // Close overlay when clicking the X button
  if (closeOverlay) {
    closeOverlay.addEventListener('click', function() {
      closeImageOverlay();
    });
  }

  // Close overlay when clicking outside the image
  if (imageOverlay) {
    imageOverlay.addEventListener('click', function(e) {
      if (e.target === imageOverlay) {
        closeImageOverlay();
      }
    });
  }

  function openImageOverlay() {
    updateOverlayImage();
    imageOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function updateOverlayImage() {
    if (images[currentImageIndex]) {
      overlayImage.src = images[currentImageIndex].src;
      overlayImage.alt = images[currentImageIndex].alt;
      
      // Update counter
      imageCounter.textContent = `${currentImageIndex + 1} / ${images.length}`;
      
      // Remove disabled states since we're looping continuously
      prevArrow.classList.remove('disabled');
      nextArrow.classList.remove('disabled');
    }
  }

// Keep these utility functions for emergency use (accessible via console)
window.recoverPassword = function(email) {
  const users = JSON.parse(localStorage.getItem('styleAssistUsers') || '[]');
  const user = users.find(u => u.email === email);
  if (user) {
    console.log('Full user data:', user);
    console.log('Email:', user.email);
    console.log('Username:', user.username);
    console.log('Password:', user.password);
    
    if (!user.password || user.password === undefined) {
      alert(`Account found but password is missing!\n\nEmail: ${email}\nUsername: ${user.username || 'Not set'}\n\nPlease use the forgot password page to reset your password.`);
    } else {
      alert(`Password for ${email}: ${user.password}`);
    }
  } else {
    alert('No account found with that email');
  }
};

window.resetPassword = function(email, newPassword) {
  const users = JSON.parse(localStorage.getItem('styleAssistUsers') || '[]');
  const userIndex = users.findIndex(u => u.email === email);
  
  if (userIndex !== -1) {
    users[userIndex].password = newPassword;
    localStorage.setItem('styleAssistUsers', JSON.stringify(users));
    
    // Also update current user if logged in as this user
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser.email === email) {
      currentUser.password = newPassword;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
    
    alert(`Password successfully reset for ${email}\nNew password: ${newPassword}`);
    return true;
  } else {
    alert('No account found with that email');
    return false;
  }
};

// Function to find user by username
window.findUserByUsername = function(username) {
  const users = JSON.parse(localStorage.getItem('styleAssistUsers') || '[]');
  const user = users.find(u => u.username === username);
  
  if (user) {
    console.log('User found:', {
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    });
    alert(`User found!\n\nUsername: ${user.username}\nEmail: ${user.email}\nName: ${user.firstName} ${user.lastName}`);
    return user;
  } else {
    alert(`No user found with username: ${username}`);
    return null;
  }
};

// Function to list all users (for debugging)
window.listAllUsers = function() {
  const users = JSON.parse(localStorage.getItem('styleAssistUsers') || '[]');
  console.log('All users:', users);
  
  if (users.length === 0) {
    alert('No users found in the system');
    return;
  }
  
  let userList = 'All registered users:\n\n';
  users.forEach((user, index) => {
    userList += `${index + 1}. Username: ${user.username || 'Not set'} | Email: ${user.email}\n`;
  });
  
  alert(userList);
  return users;
};

  function closeImageOverlay() {
    imageOverlay.classList.remove('active');
    document.body.style.overflow = ''; // Restore body scrolling
  }
});
