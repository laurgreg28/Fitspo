class GalleryManager {
  constructor() {
    this.currentImageIndex = 0;
    this.images = [];
    this.filteredImages = [];
    this.currentFilter = 'all';
    
    // Mock gallery data (in a real app, this would come from an API)
    this.galleryData = [
      { id: 1, src: 'outfit3.jpg', title: 'Edgy Street-wear', category: 'casual', description: 'Urban fashion forward', uploadDate: '2025-11-09T18:00:00.000Z' },
      { id: 2, src: 'gallery1.jpeg', title: 'Classic Professional', category: 'professional', description: 'Timeless office elegance', uploadDate: '2025-11-09T19:00:00.000Z' },
      { id: 3, src: 'outfit2.jpg', title: 'Bold Print Statement', category: 'casual', description: 'Eye-catching prints for confident style', uploadDate: '2025-11-09T20:00:00.000Z' },
      { id: 4, src: 'outfit1.jpg', title: 'Mini Dress Madness', category: 'trendy', description: 'Soft and elegant styling', uploadDate: '2025-11-09T21:00:00.000Z' },
      { id: 5, src: 'IMG_8793.jpeg', title: 'Urban Drip', category: 'trendy', description: 'Drip with a statement edge', uploadDate: '2025-11-02T09:00:00.000Z' },
      { id: 6, src: 'IMG_8785.jpeg', title: 'Urban Motion', category: 'casual', description: 'Sporty comfort that keep up with every move', uploadDate: '2025-11-04T21:00:00.000Z' },
      { id: 9, src: 'IMG_8799.jpeg', title: 'Denim Distric', category: 'trendy', description: 'The Blue Icon', uploadDate: '2025-11-02T10:00:00.000Z' },
      { id: 8, src: 'IMG_8792.jpeg', title: 'Charm School', category: 'classic', description: 'Serving classy office chic with a Clueless twist', uploadDate: '2025-11-04T19:00:00.000Z' },
      { id: 9, src: 'IMG_8797.jpeg', title: 'The Big City', category: 'trendy', description: 'Layers meets streetwise style', uploadDate: '2025-10-20T21:00:00.000Z' },
      { id: 10, src: 'Attachment.jpeg', title: 'Sharp & Chic', category: 'professional', description: 'Professionalism with a touch of personality', uploadDate: '2025-10-21T21:00:00.000Z' },
      { id: 11, src: 'IMG_8788.jpeg', title: 'Modern Drip', category: 'casual', description: 'The essentials fused with street culture', uploadDate: '2025-10-20T21:00:00.000Z' },
      { id: 12, src: 'IMG_1814.jpeg', title: 'Classical', category: 'trendy', description: 'Soft and elegant styling', uploadDate: '2025-10-19T21:00:00.000Z' }
    ];
    
    this.init();
  }

  init() {
    this.setupNavigation();
    this.loadGallery();
    this.setupEventListeners();
    this.setupUploadFeature();
  }

  setupNavigation() {
    // Use the universal navigation function from script.js
    if (typeof updateNavigation === 'function') {
      updateNavigation();
    }
  }

  loadGallery() {
    this.loadUserUploads(); // Load user uploaded images
    
    // Get all images and sort by most recent first
    let allImages = [...this.galleryData];
    
    // Sort by date added (most recent first)
    // For user uploads, use uploadDate; for preset images, use id as fallback
    allImages.sort((a, b) => {
      const dateA = a.uploadDate ? new Date(a.uploadDate) : new Date(2024, 0, a.id || 0);
      const dateB = b.uploadDate ? new Date(b.uploadDate) : new Date(2024, 0, b.id || 0);
      return dateB - dateA; // Most recent first
    });
    
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    // Limit to 4 most recent items for non-logged-in users
    if (!isLoggedIn) {
      allImages = allImages.slice(0, 4);
    }
    
    this.images = allImages;
    this.filteredImages = [...this.images];
    this.renderGallery();
  }

  // Method to refresh gallery when login status changes
  refreshGallery() {
    this.loadGallery();
  }

  renderGallery() {
    const galleryGrid = document.getElementById('galleryGrid');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    const savedOutfits = this.getSavedOutfits();
    
    galleryGrid.innerHTML = this.filteredImages.map((item, index) => {
      const isSaved = savedOutfits.includes(item.id);
      const saveIcon = isSaved ? '♥' : '♡';
      const savedClass = isSaved ? 'saved' : '';
      
      return `
        <div class="gallery-item" data-id="${item.id}" data-index="${index}">
          <img src="${item.src}" alt="${item.title}" loading="lazy">
          <button class="save-btn ${savedClass}" data-id="${item.id}">
            ${saveIcon}
          </button>
          <div class="gallery-item-overlay">
            <div class="gallery-item-title">${item.title}</div>
            <div class="gallery-item-category">${this.capitalizeFirst(item.category)}</div>
          </div>
        </div>
      `;
    }).join('');
    
    // Show/hide limited view notice and blurred preview for non-logged-in users
    const limitedViewNotice = document.getElementById('limitedViewNotice');
    const blurredPreviewSection = document.getElementById('blurredPreviewSection');
    
    if (limitedViewNotice) {
      if (!isLoggedIn) {
        limitedViewNotice.style.display = 'block';
      } else {
        limitedViewNotice.style.display = 'none';
      }
    }
    
    if (blurredPreviewSection) {
      if (!isLoggedIn) {
        blurredPreviewSection.style.display = 'block';
        this.setupBlurredItemClickHandlers();
      } else {
        blurredPreviewSection.style.display = 'none';
      }
    }
  }

  setupEventListeners() {
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelector('.filter-btn.active').classList.remove('active');
        e.target.classList.add('active');
        this.currentFilter = e.target.dataset.filter;
        this.filterGallery();
      });
    });

    // Gallery item clicks (for image overlay)
    document.addEventListener('click', (e) => {
      const galleryItem = e.target.closest('.gallery-item');
      if (galleryItem && !e.target.classList.contains('save-btn')) {
        const index = parseInt(galleryItem.dataset.index);
        this.openImageOverlay(index);
      }
    });

    // Double-click to show outfit details for user uploads
    document.addEventListener('dblclick', (e) => {
      const galleryItem = e.target.closest('.gallery-item');
      if (galleryItem && !e.target.classList.contains('save-btn') && !e.target.classList.contains('uploader-info')) {
        const outfitId = parseInt(galleryItem.dataset.id);
        const outfit = this.filteredImages.find(item => item.id === outfitId);
        if (outfit && outfit.isUserUpload) {
          this.showOutfitDetails(outfitId);
        }
      }
    });

    // Save button clicks
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('save-btn') || e.target.closest('.save-btn')) {
        e.preventDefault();
        e.stopPropagation();
        const saveBtn = e.target.classList.contains('save-btn') ? e.target : e.target.closest('.save-btn');
        const outfitId = parseInt(saveBtn.dataset.id);
        this.handleSaveOutfit(outfitId, saveBtn);
      }
    });

    // Modal close events
    document.getElementById('closeModal').addEventListener('click', () => {
      this.closeLoginModal();
    });

    document.getElementById('loginPromptModal').addEventListener('click', (e) => {
      if (e.target.id === 'loginPromptModal') {
        this.closeLoginModal();
      }
    });

    // Image overlay events
    this.setupImageOverlayEvents();

    // Logout functionality is now handled by script.js
    // No need to set up logout listener here
  }

  filterGallery() {
    if (this.currentFilter === 'all') {
      this.filteredImages = [...this.images];
    } else {
      this.filteredImages = this.images.filter(item => item.category === this.currentFilter);
    }
    this.renderGallery();
  }

  handleSaveOutfit(outfitId, saveBtn) {
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (!isLoggedIn) {
      this.showLoginModal();
      return;
    }

    const savedOutfits = this.getSavedOutfits();
    const isCurrentlySaved = savedOutfits.includes(outfitId);
    
    if (isCurrentlySaved) {
      // Remove from saved
      this.removeFromSaved(outfitId);
      saveBtn.innerHTML = '♡';
      saveBtn.classList.remove('saved');
      this.showMessage('Outfit removed from saved items', 'info');
    } else {
      // Add to saved
      this.addToSaved(outfitId);
      saveBtn.innerHTML = '♥';
      saveBtn.classList.add('saved');
      this.showMessage('Outfit saved to your profile!', 'success');
    }
  }

  getSavedOutfits() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return currentUser.savedOutfits || [];
  }

  addToSaved(outfitId) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (!currentUser.savedOutfits) {
      currentUser.savedOutfits = [];
    }
    
    if (!currentUser.savedOutfits.includes(outfitId)) {
      currentUser.savedOutfits.push(outfitId);
      this.updateUserData(currentUser);
      this.incrementSaveCount(outfitId, currentUser.userId);
    }
  }

  removeFromSaved(outfitId) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser.savedOutfits) {
      currentUser.savedOutfits = currentUser.savedOutfits.filter(id => id !== outfitId);
      this.updateUserData(currentUser);
      this.decrementSaveCount(outfitId, currentUser.userId);
    }
  }

  updateUserData(currentUser) {
    // Update currentUser in localStorage
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Update the user in the users array
    const users = JSON.parse(localStorage.getItem('styleAssistUsers') || '[]');
    const userIndex = users.findIndex(user => user.userId === currentUser.userId);
    if (userIndex !== -1) {
      users[userIndex] = currentUser;
      localStorage.setItem('styleAssistUsers', JSON.stringify(users));
    }
  }

  showLoginModal() {
    const modal = document.getElementById('loginPromptModal');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  closeLoginModal() {
    const modal = document.getElementById('loginPromptModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }

  // Image overlay functionality (similar to main page)
  setupImageOverlayEvents() {
    const imageOverlay = document.getElementById('imageOverlay');
    const closeOverlay = document.getElementById('closeOverlay');
    const prevArrow = document.getElementById('prevArrow');
    const nextArrow = document.getElementById('nextArrow');

    closeOverlay.addEventListener('click', () => this.closeImageOverlay());
    imageOverlay.addEventListener('click', (e) => {
      if (e.target === imageOverlay) this.closeImageOverlay();
    });

    prevArrow.addEventListener('click', () => this.navigateImage(-1));
    nextArrow.addEventListener('click', () => this.navigateImage(1));

    // Save count button functionality
    const saveCountDisplay = document.getElementById('saveCountDisplay');
    saveCountDisplay.addEventListener('click', () => {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      
      if (!isLoggedIn) {
        this.showLoginModal();
        return;
      }

      const currentImage = this.filteredImages[this.currentImageIndex];
      if (currentImage) {
        const saveBtn = document.querySelector(`[data-id="${currentImage.id}"] .save-btn`);
        this.handleSaveOutfit(currentImage.id, saveBtn);
        
        // Update both the grid save button and overlay display
        this.updateSaveCountDisplay(currentImage.id);
        if (saveBtn) {
          const savedOutfits = this.getSavedOutfits();
          const isSaved = savedOutfits.includes(currentImage.id);
          saveBtn.innerHTML = isSaved ? '♥' : '♡';
          saveBtn.classList.toggle('saved', isSaved);
        }
      }
    });

    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
      if (imageOverlay.classList.contains('active')) {
        switch(e.key) {
          case 'Escape':
            this.closeImageOverlay();
            break;
          case 'ArrowLeft':
            this.navigateImage(-1);
            break;
          case 'ArrowRight':
            this.navigateImage(1);
            break;
        }
      }
    });
  }

  openImageOverlay(index) {
    this.currentImageIndex = index;
    const currentImage = this.filteredImages[index];
    
    const imageOverlay = document.getElementById('imageOverlay');
    const overlayImage = document.getElementById('overlayImage');
    const imageCounter = document.getElementById('imageCounter');
    
    overlayImage.src = currentImage.src;
    overlayImage.alt = currentImage.title;
    imageCounter.textContent = `${index + 1} / ${this.filteredImages.length}`;
    
    this.updateSaveCountDisplay(currentImage.id);
    this.updateProfileOverlay(currentImage);
    
    imageOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  navigateImage(direction) {
    const newIndex = this.currentImageIndex + direction;
    
    if (newIndex < 0) {
      this.currentImageIndex = this.filteredImages.length - 1;
    } else if (newIndex >= this.filteredImages.length) {
      this.currentImageIndex = 0;
    } else {
      this.currentImageIndex = newIndex;
    }
    
    this.updateOverlayImage();
  }

  updateOverlayImage() {
    const currentImage = this.filteredImages[this.currentImageIndex];
    const overlayImage = document.getElementById('overlayImage');
    const imageCounter = document.getElementById('imageCounter');
    
    overlayImage.src = currentImage.src;
    overlayImage.alt = currentImage.title;
    imageCounter.textContent = `${this.currentImageIndex + 1} / ${this.filteredImages.length}`;
    
    this.updateSaveCountDisplay(currentImage.id);
    this.updateProfileOverlay(currentImage);
  }

  closeImageOverlay() {
    const imageOverlay = document.getElementById('imageOverlay');
    imageOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  updateProfileOverlay(currentImage) {
    const profileOverlay = document.getElementById('profileInfoOverlay');
    
    if (currentImage.isUserUpload && currentImage.uploader) {
      // Show compact username logo on top left
      this.showCompactUserProfile(currentImage, profileOverlay);
      profileOverlay.style.display = 'block';
    } else {
      // Hide profile info for default gallery items
      profileOverlay.style.display = 'none';
    }
  }

  showCompactUserProfile(currentImage, profileOverlay) {
    // Get user profile picture
    const users = JSON.parse(localStorage.getItem('styleAssistUsers') || '[]');
    let userDetails = users.find(u => u.userId === currentImage.uploadedByUserId);
    
    // If this is the current user, also check currentUser data (might be more up-to-date)
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser.userId === currentImage.uploadedByUserId) {
      userDetails = currentUser;
    }
    
    const profilePicture = userDetails?.profilePicture;
    
    // Create avatar HTML - either profile picture or letter avatar
    const avatarHtml = profilePicture 
      ? `<img src="${profilePicture}" alt="${currentImage.uploader}" class="user-avatar-img">` 
      : `<div class="user-avatar">${currentImage.uploader.charAt(0).toUpperCase()}</div>`;
    
    // Clear existing content and show compact version
    profileOverlay.innerHTML = `
      <div class="compact-user-profile" id="compactUserProfile">
        ${avatarHtml}
        <div class="username-compact">${currentImage.uploader}</div>
      </div>
    `;

    // Add click handler for expanding profile
    document.getElementById('compactUserProfile').addEventListener('click', () => {
      this.showExpandedProfile(currentImage, profileOverlay);
    });
  }

  showExpandedProfile(currentImage, profileOverlay) {
    // Get user data for expanded view
    const users = JSON.parse(localStorage.getItem('styleAssistUsers') || '[]');
    let userDetails = users.find(u => u.userId === currentImage.uploadedByUserId);
    
    // If this is the current user, also check currentUser data (might be more up-to-date)
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser.userId === currentImage.uploadedByUserId) {
      userDetails = currentUser;
    }
    
    const userOutfits = this.galleryData.filter(item => item.uploadedByUserId === currentImage.uploadedByUserId);
    
    // Get favorite brands
    let favoriteBrandsHtml = '';
    if (userOutfits.length > 0) {
      const allBrands = [];
      userOutfits.forEach(outfit => {
        if (outfit.brands) {
          allBrands.push(...outfit.brands);
        }
      });
      
      if (allBrands.length > 0) {
        const uniqueBrands = [...new Set(allBrands)];
        favoriteBrandsHtml = `
          <div class="profile-section">
            <h5>Favorite Brands</h5>
            <p>${uniqueBrands.slice(0, 5).join(', ')}${uniqueBrands.length > 5 ? '...' : ''}</p>
          </div>
        `;
      }
    }

    // Get measurements if public
    let measurementsHtml = '';
    
    if (userDetails && userDetails.quizResults && userDetails.quizResults.measurementsPublic === true && userDetails.quizResults.measurements) {
      const m = userDetails.quizResults.measurements;
      
      // Build measurements display - only show measurements that have values
      let measurementItems = [];
      
      if (m.height && m.height.feet && m.height.inches) {
        measurementItems.push(`<p><strong>Height:</strong> ${m.height.feet}'${m.height.inches}"</p>`);
      }
      if (m.weight) {
        measurementItems.push(`<p><strong>Weight:</strong> ${m.weight} lbs</p>`);
      }
      if (m.bust) {
        measurementItems.push(`<p><strong>Bust:</strong> ${m.bust}"</p>`);
      }
      if (m.waist) {
        measurementItems.push(`<p><strong>Waist:</strong> ${m.waist}"</p>`);
      }
      if (m.hips) {
        measurementItems.push(`<p><strong>Hips:</strong> ${m.hips}"</p>`);
      }
      if (m.shoes) {
        measurementItems.push(`<p><strong>Shoe Size:</strong> ${m.shoes}</p>`);
      }
      
      // Only show measurements section if we have at least one measurement
      if (measurementItems.length > 0) {
        measurementsHtml = `
          <div class="profile-section">
            <h5>📏 Measurements</h5>
            ${measurementItems.join('')}
          </div>
        `;
      }
    }

    // Format member since date
    const memberDate = (currentImage.memberSince || currentImage.signupDate) ? 
      new Date(currentImage.memberSince || currentImage.signupDate).toLocaleDateString('en-US', { 
        month: 'long', 
        year: 'numeric' 
      }) : 'Recently';

    // Get profile picture for expanded view
    const profilePicture = userDetails?.profilePicture;
    const largeAvatarHtml = profilePicture 
      ? `<img src="${profilePicture}" alt="${currentImage.uploader}" class="profile-avatar-img-large">` 
      : `<div class="profile-avatar-large">${currentImage.uploader.charAt(0).toUpperCase()}</div>`;

    // Show expanded profile
    profileOverlay.innerHTML = `
      <div class="expanded-user-profile">
        <button class="collapse-profile-btn" id="collapseProfile">←</button>
        <div class="profile-header">
          ${largeAvatarHtml}
          <div class="profile-info">
            <h4>${currentImage.uploader}</h4>
            <p class="member-since">Member since ${memberDate}</p>
            <p class="outfits-count">${userOutfits.length} outfit${userOutfits.length !== 1 ? 's' : ''} shared</p>
          </div>
        </div>
        
        ${favoriteBrandsHtml}
        ${measurementsHtml}
        
        <div class="profile-actions">
          <button class="view-full-profile-btn" id="viewFullProfileBtn">View Full Profile</button>
          ${this.shouldShowDeleteButton(currentImage) ? '<button class="delete-outfit-btn" id="deleteOutfitBtn">Delete Outfit</button>' : ''}
        </div>
      </div>
    `;

    // Add event handlers
    document.getElementById('collapseProfile').addEventListener('click', () => {
      this.showCompactUserProfile(currentImage, profileOverlay);
    });

    document.getElementById('viewFullProfileBtn').addEventListener('click', () => {
      this.showFullProfile(currentImage.uploader);
    });

    // Add delete button handler if present
    const deleteBtn = document.getElementById('deleteOutfitBtn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        this.confirmDeleteOutfit(currentImage);
      });
    }
  }

  shouldShowDeleteButton(currentImage) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    // Create current user's name in the same format as uploader name
    const currentUserName = currentUser.firstName && currentUser.lastName 
      ? `${currentUser.firstName} ${currentUser.lastName}`
      : currentUser.username || 'Anonymous';
    
    return isLoggedIn && (currentUserName === currentImage.uploader || currentUser.userId === currentImage.uploadedByUserId);
  }

  showFullProfile(username) {
    // For now, show an alert - can be enhanced to show full profile modal
    this.showMessage(`View full profile for ${username} - Feature coming soon!`, 'info');
  }

  confirmDeleteOutfit(outfit) {
    // Create confirmation modal
    const confirmModal = document.createElement('div');
    confirmModal.className = 'delete-confirm-modal';
    confirmModal.innerHTML = `
      <div class="delete-confirm-content">
        <h3>Delete Outfit</h3>
        <p>Are you sure you want to delete "${outfit.title}"?</p>
        <p class="delete-warning">This action cannot be undone.</p>
        <div class="delete-confirm-actions">
          <button class="btn-cancel" id="cancelDelete">Cancel</button>
          <button class="btn-delete" id="confirmDelete">Delete</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(confirmModal);
    confirmModal.classList.add('active');
    
    // Handle button clicks
    document.getElementById('cancelDelete').onclick = () => {
      confirmModal.remove();
    };
    
    document.getElementById('confirmDelete').onclick = () => {
      this.deleteOutfit(outfit);
      confirmModal.remove();
    };
    
    // Close on background click
    confirmModal.addEventListener('click', (e) => {
      if (e.target === confirmModal) {
        confirmModal.remove();
      }
    });
  }

  deleteOutfit(outfit) {
    // Remove from gallery data
    this.galleryData = this.galleryData.filter(item => item.id !== outfit.id);
    
    // Update localStorage
    this.saveUserUploads();
    
    // Close the image overlay
    this.closeImageOverlay();
    
    // Refresh the gallery display
    this.loadGallery();
    
    // Show success message
    this.showMessage(`"${outfit.title}" has been deleted successfully.`, 'success');
  }

  // logoutUser method removed - now handled by script.js

  showMessage(message, type) {
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
      existingMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}`;
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
      messageDiv.remove();
    }, 3000);
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Get gallery data for other components to use
  getGalleryData() {
    return this.galleryData;
  }

  // Upload Feature Methods
  setupUploadFeature() {
    const addOutfitBtn = document.getElementById('addOutfitBtn');
    const uploadSection = document.getElementById('uploadSection');
    const fileUploadArea = document.getElementById('fileUploadArea');
    const imageUpload = document.getElementById('imageUpload');
    const uploadDetails = document.getElementById('uploadDetails');
    const cancelUpload = document.getElementById('cancelUpload');
    const submitUpload = document.getElementById('submitUpload');

    let selectedFile = null;

    // Show upload section
    addOutfitBtn.addEventListener('click', () => {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      
      if (!isLoggedIn) {
        this.showLoginModal();
        return;
      }

      uploadSection.style.display = 'block';
      uploadSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    // File upload handling
    imageUpload.addEventListener('change', (e) => {
      this.handleFileSelect(e.target.files[0]);
    });

    // Drag and drop handling
    fileUploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      fileUploadArea.classList.add('dragover');
    });

    fileUploadArea.addEventListener('dragleave', (e) => {
      e.preventDefault();
      fileUploadArea.classList.remove('dragover');
    });

    fileUploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      fileUploadArea.classList.remove('dragover');
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        this.handleFileSelect(file);
      } else {
        this.showMessage('Please select a valid image file', 'error');
      }
    });

    // Cancel upload
    cancelUpload.addEventListener('click', () => {
      this.resetUploadForm();
      uploadSection.style.display = 'none';
    });

    // Submit upload
    submitUpload.addEventListener('click', () => {
      this.submitNewOutfit();
    });

    // Add brand functionality
    this.setupBrandInputs();
    
    // Add social media functionality
    this.setupSocialMediaInputs();
  }

  setupBrandInputs() {
    const addBrandBtn = document.getElementById('addBrandBtn');
    
    addBrandBtn.addEventListener('click', () => {
      this.addBrandInput();
    });
  }

  addBrandInput() {
    const brandInputs = document.getElementById('brandInputs');
    const brandCount = brandInputs.children.length;
    
    if (brandCount >= 5) {
      this.showMessage('Maximum 5 brands allowed', 'error');
      return;
    }

    const newBrandGroup = document.createElement('div');
    newBrandGroup.className = 'brand-input-group';
    newBrandGroup.innerHTML = `
      <input type="text" class="brand-name-input" placeholder="Brand name" maxlength="50">
      <button type="button" class="remove-brand-btn" onclick="this.parentElement.remove()">×</button>
    `;
    
    brandInputs.appendChild(newBrandGroup);
    
    // Show remove button on all inputs if more than one
    this.updateRemoveButtons();
  }

  updateRemoveButtons() {
    const brandGroups = document.querySelectorAll('.brand-input-group');
    brandGroups.forEach((group, index) => {
      const removeBtn = group.querySelector('.remove-brand-btn');
      if (brandGroups.length > 1) {
        removeBtn.style.display = 'flex';
      } else {
        removeBtn.style.display = 'none';
      }
    });
  }

  setupSocialMediaInputs() {
    const socialBtns = document.querySelectorAll('.add-social-btn');
    
    socialBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const platform = btn.dataset.platform;
        this.addSocialMediaInput(platform);
        btn.disabled = true; // Prevent duplicate platforms
      });
    });
  }

  addSocialMediaInput(platform) {
    const socialInputs = document.getElementById('socialMediaInputs');
    
    // Check if platform already added
    if (socialInputs.querySelector(`[data-platform="${platform}"]`)) {
      return;
    }

    const platformIcons = {
      instagram: '📷',
      tiktok: '🎵',
      twitter: '🐦',
      pinterest: '📌'
    };

    const platformLabels = {
      instagram: 'Instagram',
      tiktok: 'TikTok',
      twitter: 'Twitter',
      pinterest: 'Pinterest'
    };

    const inputGroup = document.createElement('div');
    inputGroup.className = 'social-media-input-group';
    inputGroup.dataset.platform = platform;
    inputGroup.innerHTML = `
      <span class="social-platform-icon">${platformIcons[platform]}</span>
      <input type="text" class="social-username-input" placeholder="${platformLabels[platform]} username (without @)" maxlength="50">
      <button type="button" class="remove-social-btn">×</button>
    `;
    
    // Add remove functionality
    inputGroup.querySelector('.remove-social-btn').addEventListener('click', () => {
      inputGroup.remove();
      // Re-enable the platform button
      document.querySelector(`[data-platform="${platform}"]`).disabled = false;
    });
    
    socialInputs.appendChild(inputGroup);
  }

  handleFileSelect(file) {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      this.showMessage('Please select a valid image file', 'error');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      this.showMessage('Image file is too large. Please select a file under 10MB.', 'error');
      return;
    }

    this.selectedFile = file;
    
    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      this.showImagePreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Show upload details form
    document.getElementById('uploadDetails').style.display = 'block';
  }

  showImagePreview(imageSrc) {
    const fileUploadArea = document.getElementById('fileUploadArea');
    
    // Clear existing preview
    const existingPreview = fileUploadArea.querySelector('.image-preview');
    if (existingPreview) {
      existingPreview.remove();
    }

    // Add new preview
    const previewDiv = document.createElement('div');
    previewDiv.className = 'image-preview';
    previewDiv.innerHTML = `<img src="${imageSrc}" alt="Preview" class="preview-image">`;
    
    fileUploadArea.appendChild(previewDiv);
  }

  submitNewOutfit() {
    const title = document.getElementById('imageTitle').value.trim();
    const category = document.getElementById('imageCategory').value;
    const description = document.getElementById('imageDescription').value.trim();
    const outfitSize = document.getElementById('outfitSize').value;
    
    // Collect all brand names
    const brandInputs = document.querySelectorAll('.brand-name-input');
    const brands = [];
    brandInputs.forEach(input => {
      const brand = input.value.trim();
      if (brand) {
        brands.push(brand);
      }
    });

    // Collect social media data
    const socialInputs = document.querySelectorAll('.social-media-input-group');
    const socialMedia = {};
    socialInputs.forEach(group => {
      const platform = group.dataset.platform;
      const username = group.querySelector('.social-username-input').value.trim();
      if (username) {
        socialMedia[platform] = username;
      }
    });

    // Validation
    if (!this.selectedFile) {
      this.showMessage('Please select an image', 'error');
      return;
    }

    if (!title) {
      this.showMessage('Please enter a title for your outfit', 'error');
      return;
    }

    if (brands.length === 0) {
      this.showMessage('Please enter at least one brand name', 'error');
      return;
    }

    // Create new gallery item
    const reader = new FileReader();
    reader.onload = (e) => {
      const newId = Math.max(...this.galleryData.map(item => item.id)) + 1;
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const userName = currentUser.firstName && currentUser.lastName 
        ? `${currentUser.firstName} ${currentUser.lastName}`
        : currentUser.username || 'Anonymous';
      
      const newItem = {
        id: newId,
        src: e.target.result, // Use data URL for user uploads
        title: title,
        category: category,
        description: description,
        brands: brands,
        size: outfitSize,
        socialMedia: socialMedia,
        isUserUpload: true,
        uploadedBy: userName,
        uploadedByUserId: currentUser.userId,
        uploadDate: new Date().toISOString(),
        uploader: userName, // For profile display
        memberSince: currentUser.signupDate || new Date().toISOString() // Use signupDate instead of memberSince
      };

      // Add to gallery data
      this.galleryData.push(newItem);
      
      // Save to localStorage for persistence
      this.saveUserUploads();
      
      // Refresh gallery
      this.loadGallery();
      
      // Reset form and hide upload section
      this.resetUploadForm();
      document.getElementById('uploadSection').style.display = 'none';
      
      // Show success message
      this.showMessage('Your outfit has been added to the gallery!', 'success');
      
      // Refresh profile page if available
      if (window.refreshProfile) {
        window.refreshProfile();
      }
      
      // Scroll to show the new item
      setTimeout(() => {
        const newItemElement = document.querySelector(`[data-id="${newId}"]`);
        if (newItemElement) {
          newItemElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    };
    
    reader.readAsDataURL(this.selectedFile);
  }

  resetUploadForm() {
    this.selectedFile = null;
    document.getElementById('imageTitle').value = '';
    document.getElementById('imageCategory').value = 'casual';
    document.getElementById('imageDescription').value = '';
    document.getElementById('outfitSize').value = '';
    
    // Reset brand inputs
    const brandInputs = document.getElementById('brandInputs');
    brandInputs.innerHTML = `
      <div class="brand-input-group">
        <input type="text" class="brand-name-input" placeholder="Brand name" maxlength="50" required>
        <button type="button" class="remove-brand-btn" onclick="this.parentElement.remove()" style="display: none;">×</button>
      </div>
    `;
    
    // Reset social media inputs
    const socialInputs = document.getElementById('socialMediaInputs');
    socialInputs.innerHTML = '';
    
    // Re-enable all social media buttons
    const socialBtns = document.querySelectorAll('.add-social-btn');
    socialBtns.forEach(btn => {
      btn.disabled = false;
    });
    
    document.getElementById('uploadDetails').style.display = 'none';
    
    // Reset file upload area
    const fileUploadArea = document.getElementById('fileUploadArea');
    const preview = fileUploadArea.querySelector('.image-preview');
    if (preview) {
      preview.remove();
    }
    
    document.getElementById('imageUpload').value = '';
  }

  saveUserUploads() {
    const userUploads = this.galleryData.filter(item => item.isUserUpload);
    localStorage.setItem('userGalleryUploads', JSON.stringify(userUploads));
    // Also save the full gallery data for cross-page access
    localStorage.setItem('fullGalleryData', JSON.stringify(this.galleryData));
  }

  loadUserUploads() {
    const savedUploads = JSON.parse(localStorage.getItem('userGalleryUploads') || '[]');
    
    // Fix existing uploads that might have incorrect username format
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const currentUserName = currentUser.firstName && currentUser.lastName 
      ? `${currentUser.firstName} ${currentUser.lastName}`
      : currentUser.username || 'Anonymous';
    
    // Add saved uploads to gallery data if not already present
    savedUploads.forEach(upload => {
      if (!this.galleryData.find(item => item.id === upload.id)) {
        // Fix the uploader name if it's anonymous but belongs to current user
        if (upload.uploadedByUserId === currentUser.userId && (upload.uploadedBy === 'Anonymous' || !upload.uploader)) {
          upload.uploadedBy = currentUserName;
          upload.uploader = currentUserName;
          upload.memberSince = upload.memberSince || currentUser.signupDate || new Date().toISOString();
        }
        this.galleryData.push(upload);
      }
    });
    
    // Save the fixed uploads back to localStorage
    this.saveUserUploads();
  }

  // Save Count Tracking Methods
  getSaveCounts() {
    return JSON.parse(localStorage.getItem('outfitSaveCounts') || '{}');
  }

  setSaveCounts(counts) {
    localStorage.setItem('outfitSaveCounts', JSON.stringify(counts));
  }

  incrementSaveCount(outfitId, userId) {
    const saveCounts = this.getSaveCounts();
    
    // Initialize outfit entry if it doesn't exist
    if (!saveCounts[outfitId]) {
      saveCounts[outfitId] = {
        count: 0,
        users: []
      };
    }

    // Only increment if user hasn't already saved this outfit
    if (!saveCounts[outfitId].users.includes(userId)) {
      saveCounts[outfitId].users.push(userId);
      saveCounts[outfitId].count = saveCounts[outfitId].users.length;
      this.setSaveCounts(saveCounts);
    }
  }

  decrementSaveCount(outfitId, userId) {
    const saveCounts = this.getSaveCounts();
    
    if (saveCounts[outfitId]) {
      // Remove user from the list
      saveCounts[outfitId].users = saveCounts[outfitId].users.filter(id => id !== userId);
      saveCounts[outfitId].count = saveCounts[outfitId].users.length;
      this.setSaveCounts(saveCounts);
    }
  }

  getSaveCount(outfitId) {
    const saveCounts = this.getSaveCounts();
    return saveCounts[outfitId] ? saveCounts[outfitId].count : 0;
  }

  updateSaveCountDisplay(outfitId) {
    const saveCountDisplay = document.getElementById('saveCountDisplay');
    const saveCountText = document.getElementById('saveCountText');
    const saveCountIcon = document.getElementById('saveCountIcon');
    const saveCount = this.getSaveCount(outfitId);
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (saveCountText && saveCountIcon) {
      // Update count text
      if (saveCount === 0) {
        saveCountText.textContent = 'No saves yet';
      } else if (saveCount === 1) {
        saveCountText.textContent = '1 save';
      } else {
        saveCountText.textContent = `${saveCount} saves`;
      }

      // Update visual state based on user's save status
      if (isLoggedIn) {
        const savedOutfits = this.getSavedOutfits();
        const isSavedByUser = savedOutfits.includes(outfitId);
        
        if (isSavedByUser) {
          saveCountDisplay.classList.add('saved');
          saveCountDisplay.classList.remove('unsaved');
          saveCountIcon.style.color = '#ff4757';
        } else {
          saveCountDisplay.classList.remove('saved');
          saveCountDisplay.classList.add('unsaved');
          saveCountIcon.style.color = '#ddd';
        }
      } else {
        // Not logged in - show neutral state
        saveCountDisplay.classList.remove('saved', 'unsaved');
        saveCountIcon.style.color = '#ff6b6b';
      }
    }
  }

  // User Profile and Outfit Details Methods
  showUserProfile(userId, username) {
    // For now, show a simple alert. In a full app, this would open a profile modal
    const users = JSON.parse(localStorage.getItem('styleAssistUsers') || '[]');
    const user = users.find(u => u.userId === userId);
    
    if (user) {
      // Get user's uploaded outfits
      const userOutfits = this.galleryData.filter(item => item.uploadedByUserId === userId);
      
      let profileInfo = `👤 ${username}'s Profile\n\n`;
      profileInfo += ` Member since: ${new Date(user.createdAt || Date.now()).toLocaleDateString()}\n`;
      profileInfo += `👗 Outfits shared: ${userOutfits.length}\n\n`;
      
      // Show favorite brands if user has uploaded outfits
      if (userOutfits.length > 0) {
        const allBrands = [];
        userOutfits.forEach(outfit => {
          if (outfit.brands) {
            allBrands.push(...outfit.brands);
          }
        });
        
        if (allBrands.length > 0) {
          const uniqueBrands = [...new Set(allBrands)];
          profileInfo += `🏷️ Favorite Brands: ${uniqueBrands.slice(0, 5).join(', ')}${uniqueBrands.length > 5 ? '...' : ''}\n`;
        }
      }
      
      // Show public measurements from quiz results
      if (user.quizResults && user.quizResults.measurements && user.quizResults.measurementsPublic === true) {
        const m = user.quizResults.measurements;
        profileInfo += `\n📏 Public Measurements:\n`;
        if (m.height) profileInfo += `Height: ${m.height}\n`;
        if (m.weight) profileInfo += `Weight: ${m.weight}\n`;
        if (m.bust) profileInfo += `Bust: ${m.bust}\n`;
        if (m.waist) profileInfo += `Waist: ${m.waist}\n`;
        if (m.hips) profileInfo += `Hips: ${m.hips}\n`;
        if (m.inseam) profileInfo += `Inseam: ${m.inseam}\n`;
      }
      
      alert(profileInfo);
    } else {
      alert(`👤 ${username}'s Profile\n\nProfile information not available.`);
    }
  }

  showOutfitDetails(outfitId) {
    const outfit = this.galleryData.find(item => item.id === outfitId);
    if (!outfit || !outfit.isUserUpload) return;

    // Create and show outfit details popup
    this.createOutfitDetailsPopup(outfit);
  }

  createOutfitDetailsPopup(outfit) {
    // Remove existing popup
    const existingPopup = document.getElementById('outfitDetailsPopup');
    if (existingPopup) {
      existingPopup.remove();
    }

    const popup = document.createElement('div');
    popup.id = 'outfitDetailsPopup';
    popup.className = 'outfit-details-popup';
    
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const canSeeMeasurements = outfit.uploadedByUserId === currentUser.userId || !outfit.measurements?.isPrivate;
    
    popup.innerHTML = `
      <button class="close-details" onclick="this.parentElement.remove()">&times;</button>
      <div class="outfit-details-header">
        <h3 class="outfit-details-title">${outfit.title}</h3>
        <p>by ${outfit.uploadedBy}</p>
      </div>
      
      <div class="detail-section">
        <h5>Description</h5>
        <p>${outfit.description}</p>
      </div>
      
      <div class="detail-section">
        <h5>Brands & Size</h5>
        <p><strong>Brands:</strong> ${outfit.brands ? outfit.brands.join(', ') : 'Not specified'}</p>
        ${outfit.size ? `<p><strong>Size:</strong> ${outfit.size.toUpperCase()}</p>` : '<p><strong>Size:</strong> Not specified</p>'}
      </div>
      
      ${outfit.socialMedia && Object.keys(outfit.socialMedia).length > 0 ? `
        <div class="detail-section">
          <h5>Follow ${outfit.uploadedBy}</h5>
          ${Object.entries(outfit.socialMedia).map(([platform, username]) => {
            const platformLabels = {
              instagram: 'Instagram',
              tiktok: 'TikTok', 
              twitter: 'Twitter',
              pinterest: 'Pinterest'
            };
            const platformIcons = {
              instagram: '📷',
              tiktok: '🎵',
              twitter: '🐦',
              pinterest: '📌'
            };
            return `<p>${platformIcons[platform]} <strong>${platformLabels[platform]}:</strong> @${username}</p>`;
          }).join('')}
        </div>
      ` : ''}
      
      <div class="detail-section">
        <h5>Posted</h5>
        <p>${new Date(outfit.uploadDate).toLocaleDateString()}</p>
      </div>
    `;
    
    document.body.appendChild(popup);
    popup.classList.add('active');
    
    // Close on background click
    popup.addEventListener('click', (e) => {
      if (e.target === popup) {
        popup.remove();
      }
    });
  }

  // Setup click handlers for blurred preview items
  setupBlurredItemClickHandlers() {
    const blurredItems = document.querySelectorAll('.blurred-item');
    blurredItems.forEach(item => {
      item.addEventListener('click', () => {
        // Show signup modal when blurred items are clicked
        this.showSignupPrompt();
      });
    });
  }

  // Show signup prompt for blurred items
  showSignupPrompt() {
    const modal = document.createElement('div');
    modal.className = 'modal-overlay';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close-modal">&times;</span>
        <h2>Unlock the Full Gallery</h2>
        <p>Sign up for free to access all outfit styles and save your favorites!</p>
        <div class="modal-actions">
          <button class="modal-btn primary" onclick="window.location.href='signup.html'">Sign Up Free</button>
          <button class="modal-btn secondary" onclick="window.location.href='login.html'">Log In</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal functionality
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => {
      document.body.removeChild(modal);
    });
    
    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  // Method to remove user from all interactions (for account deletion)
  removeUserFromAllInteractions(userId) {
    if (!userId) return;

    let dataChanged = false;

    // Remove user's likes and saves from all outfits
    this.galleryData.forEach(outfit => {
      // Remove from likes array
      if (outfit.likes && Array.isArray(outfit.likes)) {
        const originalLength = outfit.likes.length;
        outfit.likes = outfit.likes.filter(likeUserId => likeUserId !== userId);
        if (outfit.likes.length !== originalLength) {
          dataChanged = true;
        }
      }

      // Remove from savedBy array
      if (outfit.savedBy && Array.isArray(outfit.savedBy)) {
        const originalLength = outfit.savedBy.length;
        outfit.savedBy = outfit.savedBy.filter(saveUserId => saveUserId !== userId);
        if (outfit.savedBy.length !== originalLength) {
          dataChanged = true;
        }
      }

      // Update save count
      outfit.saveCount = outfit.savedBy ? outfit.savedBy.length : 0;
    });

    // Remove user's uploaded outfits
    const originalLength = this.galleryData.length;
    this.galleryData = this.galleryData.filter(outfit => outfit.uploadedByUserId !== userId);
    if (this.galleryData.length !== originalLength) {
      dataChanged = true;
    }

    // Save updated data if changes were made
    if (dataChanged) {
      localStorage.setItem('fullGalleryData', JSON.stringify(this.galleryData));
      
      // Also update user uploads storage
      const userUploads = JSON.parse(localStorage.getItem('userGalleryUploads') || '[]');
      const filteredUploads = userUploads.filter(outfit => outfit.uploadedByUserId !== userId);
      localStorage.setItem('userGalleryUploads', JSON.stringify(filteredUploads));
      
      console.log(`Removed user ${userId} from all gallery interactions`);
    }
  }

  // Method to get all gallery data for external use
  getAllGalleryData() {
    return this.galleryData;
  }
}

// Initialize gallery when page loads
document.addEventListener('DOMContentLoaded', () => {
  window.galleryManager = new GalleryManager();
});