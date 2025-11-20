class ProfileImageManager {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.originalImage = null;
    this.cropData = {
      x: 0,
      y: 0,
      size: 200
    };
    this.isDragging = false;
    this.isResizing = false;
    this.dragStart = { x: 0, y: 0 };
    this.resizeHandle = null; // 'nw', 'ne', 'sw', 'se' for corners
    this.minCropSize = 50;
    
    this.init();
  }

  init() {
    this.setupEventListeners();
    this.loadSavedProfilePicture();
  }

  setupEventListeners() {
    const changePhotoBtn = document.getElementById('changePhotoBtn');
    const removePhotoBtn = document.getElementById('removePhotoOption');
    const profileImageInput = document.getElementById('profileImageInput');
    const cropModal = document.getElementById('cropModal');
    const closeCropModal = document.getElementById('closeCropModal');
    const cancelCrop = document.getElementById('cancelCrop');
    const saveCrop = document.getElementById('saveCrop');
    const profileDropdownBtn = document.getElementById('profileDropdownBtn');
    const profileDropdownMenu = document.getElementById('profileDropdownMenu');

    // Dropdown toggle functionality
    profileDropdownBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      profileDropdownMenu.classList.toggle('show');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.profile-pic-dropdown')) {
        profileDropdownMenu.classList.remove('show');
      }
    });

    // Change photo button click
    changePhotoBtn.addEventListener('click', () => {
      profileDropdownMenu.classList.remove('show');
      profileImageInput.click();
    });

    // Remove photo button click
    removePhotoBtn.addEventListener('click', () => {
      profileDropdownMenu.classList.remove('show');
      this.removeProfilePicture();
    });

    // View style quiz button click
    const viewStyleQuizBtn = document.getElementById('viewStyleQuizBtn');
    if (viewStyleQuizBtn) {
      viewStyleQuizBtn.addEventListener('click', () => {
        profileDropdownMenu.classList.remove('show');
        window.location.href = 'style-quiz-results.html';
      });
    }

    // File input change
    profileImageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        this.handleImageUpload(file);
      }
    });

    // Modal controls
    closeCropModal.addEventListener('click', () => this.closeCropModal());
    cancelCrop.addEventListener('click', () => this.closeCropModal());
    saveCrop.addEventListener('click', () => this.saveCroppedImage());

    // Close modal on background click
    cropModal.addEventListener('click', (e) => {
      if (e.target === cropModal) {
        this.closeCropModal();
      }
    });
  }

  handleImageUpload(file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image file is too large. Please choose an image smaller than 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      this.originalImage = new Image();
      this.originalImage.onload = () => {
        this.openCropModal();
      };
      this.originalImage.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  openCropModal() {
    const modal = document.getElementById('cropModal');
    const canvas = document.getElementById('cropCanvas');
    
    modal.style.display = 'flex';
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    
    this.setupCanvas();
    this.setupCanvasEventListeners();
  }

  closeCropModal() {
    const modal = document.getElementById('cropModal');
    modal.style.display = 'none';
    
    // Reset file input
    document.getElementById('profileImageInput').value = '';
  }

  setupCanvas() {
    const maxSize = 400;
    let canvasWidth = this.originalImage.width;
    let canvasHeight = this.originalImage.height;
    
    // Scale down large images for canvas display
    if (canvasWidth > maxSize || canvasHeight > maxSize) {
      const scale = Math.min(maxSize / canvasWidth, maxSize / canvasHeight);
      canvasWidth = canvasWidth * scale;
      canvasHeight = canvasHeight * scale;
    }
    
    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;
    
    // Initialize crop area in the center
    const cropSize = Math.min(canvasWidth, canvasHeight) * 0.7;
    this.cropData = {
      x: (canvasWidth - cropSize) / 2,
      y: (canvasHeight - cropSize) / 2,
      size: cropSize,
      canvasWidth,
      canvasHeight,
      scaleX: this.originalImage.width / canvasWidth,
      scaleY: this.originalImage.height / canvasHeight
    };
    
    this.drawCanvas();
  }

  setupCanvasEventListeners() {
    this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseup', () => this.onMouseUp());
    this.canvas.addEventListener('mouseleave', () => this.onMouseUp());
    
    // Touch events for mobile
    this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
    this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
    this.canvas.addEventListener('touchend', () => this.onMouseUp());
  }

  getMousePos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  getTouchPos(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.touches[0].clientX - rect.left,
      y: e.touches[0].clientY - rect.top
    };
  }

  onMouseDown(e) {
    const pos = this.getMousePos(e);
    const resizeHandle = this.getResizeHandle(pos);
    
    if (resizeHandle) {
      this.isResizing = true;
      this.resizeHandle = resizeHandle;
      this.dragStart = { x: pos.x, y: pos.y };
      this.initialCropData = { ...this.cropData };
      this.canvas.style.cursor = this.getResizeCursor(resizeHandle);
      e.preventDefault(); // Prevent default browser behavior
    } else if (this.isInCropArea(pos)) {
      this.isDragging = true;
      this.dragStart = {
        x: pos.x - this.cropData.x,
        y: pos.y - this.cropData.y
      };
      this.canvas.style.cursor = 'grabbing';
    }
  }

  onTouchStart(e) {
    e.preventDefault();
    const pos = this.getTouchPos(e);
    const resizeHandle = this.getResizeHandle(pos);
    
    if (resizeHandle) {
      this.isResizing = true;
      this.resizeHandle = resizeHandle;
      this.dragStart = { x: pos.x, y: pos.y };
      this.initialCropData = { ...this.cropData };
    } else if (this.isInCropArea(pos)) {
      this.isDragging = true;
      this.dragStart = {
        x: pos.x - this.cropData.x,
        y: pos.y - this.cropData.y
      };
    }
  }

  onMouseMove(e) {
    const pos = this.getMousePos(e);
    
    if (this.isResizing) {
      this.updateCropSize(pos);
    } else if (this.isDragging) {
      this.updateCropPosition(pos);
    } else {
      // Update cursor based on position
      const resizeHandle = this.getResizeHandle(pos);
      if (resizeHandle) {
        this.canvas.style.cursor = this.getResizeCursor(resizeHandle);
      } else if (this.isInCropArea(pos)) {
        this.canvas.style.cursor = 'grab';
      } else {
        this.canvas.style.cursor = 'default';
      }
    }
  }

  onTouchMove(e) {
    e.preventDefault();
    const pos = this.getTouchPos(e);
    
    if (this.isResizing) {
      this.updateCropSize(pos);
    } else if (this.isDragging) {
      this.updateCropPosition(pos);
    }
  }

  updateCropPosition(pos) {
    let newX = pos.x - this.dragStart.x;
    let newY = pos.y - this.dragStart.y;
    
    // Keep crop area within canvas bounds
    newX = Math.max(0, Math.min(newX, this.cropData.canvasWidth - this.cropData.size));
    newY = Math.max(0, Math.min(newY, this.cropData.canvasHeight - this.cropData.size));
    
    this.cropData.x = newX;
    this.cropData.y = newY;
    
    this.drawCanvas();
  }

  onMouseUp() {
    this.isDragging = false;
    this.isResizing = false;
    this.resizeHandle = null;
    this.canvas.style.cursor = 'default';
  }

  isInCropArea(pos) {
    return pos.x >= this.cropData.x && 
           pos.x <= this.cropData.x + this.cropData.size &&
           pos.y >= this.cropData.y && 
           pos.y <= this.cropData.y + this.cropData.size;
  }

  getResizeHandle(pos) {
    const handleSize = 20; // Increased for easier grabbing
    const x = this.cropData.x;
    const y = this.cropData.y;
    const size = this.cropData.size;
    
    // Check each corner with priority (check in order of preference)
    // Top-left corner
    if (Math.abs(pos.x - x) <= handleSize && Math.abs(pos.y - y) <= handleSize) {
      return 'nw';
    }
    // Top-right corner
    if (Math.abs(pos.x - (x + size)) <= handleSize && Math.abs(pos.y - y) <= handleSize) {
      return 'ne';
    }
    // Bottom-left corner
    if (Math.abs(pos.x - x) <= handleSize && Math.abs(pos.y - (y + size)) <= handleSize) {
      return 'sw';
    }
    // Bottom-right corner
    if (Math.abs(pos.x - (x + size)) <= handleSize && Math.abs(pos.y - (y + size)) <= handleSize) {
      return 'se';
    }
    
    return null;
  }

  getResizeCursor(handle) {
    switch (handle) {
      case 'nw':
      case 'se':
        return 'nw-resize';
      case 'ne':
      case 'sw':
        return 'ne-resize';
      default:
        return 'default';
    }
  }

  updateCropSize(pos) {
    const dx = pos.x - this.dragStart.x;
    const dy = pos.y - this.dragStart.y;
    
    let newX = this.initialCropData.x;
    let newY = this.initialCropData.y;
    let newSize = this.initialCropData.size;
    
    switch (this.resizeHandle) {
      case 'nw':
        // Northwest: move top-left corner
        const moveDist = Math.max(dx, dy); // Use the larger movement
        newX = this.initialCropData.x + moveDist;
        newY = this.initialCropData.y + moveDist;
        newSize = this.initialCropData.size - moveDist;
        break;
        
      case 'ne':
        // Northeast: move top-right corner
        newY = this.initialCropData.y + dy;
        newSize = this.initialCropData.size + dx - dy;
        break;
        
      case 'sw':
        // Southwest: move bottom-left corner
        newX = this.initialCropData.x + dx;
        newSize = this.initialCropData.size - dx + dy;
        break;
        
      case 'se':
        // Southeast: move bottom-right corner
        const growDist = Math.max(dx, dy); // Use the larger movement
        newSize = this.initialCropData.size + growDist;
        break;
    }
    
    // Apply constraints
    // Ensure minimum size
    newSize = Math.max(newSize, this.minCropSize);
    
    // Keep within canvas bounds
    newX = Math.max(0, Math.min(newX, this.cropData.canvasWidth - newSize));
    newY = Math.max(0, Math.min(newY, this.cropData.canvasHeight - newSize));
    
    // Make sure crop area fits in canvas
    if (newX + newSize > this.cropData.canvasWidth) {
      newSize = this.cropData.canvasWidth - newX;
    }
    if (newY + newSize > this.cropData.canvasHeight) {
      newSize = this.cropData.canvasHeight - newY;
    }
    
    // Only update if size is still valid
    if (newSize >= this.minCropSize) {
      this.cropData.x = newX;
      this.cropData.y = newY;
      this.cropData.size = newSize;
      this.drawCanvas();
    }
  }

  drawCanvas() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Draw original image
    this.ctx.drawImage(this.originalImage, 0, 0, this.cropData.canvasWidth, this.cropData.canvasHeight);
    
    // Draw overlay
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Clear crop area
    this.ctx.clearRect(this.cropData.x, this.cropData.y, this.cropData.size, this.cropData.size);
    
    // Redraw image in crop area
    this.ctx.drawImage(
      this.originalImage,
      this.cropData.x * this.cropData.scaleX,
      this.cropData.y * this.cropData.scaleY,
      this.cropData.size * this.cropData.scaleX,
      this.cropData.size * this.cropData.scaleY,
      this.cropData.x,
      this.cropData.y,
      this.cropData.size,
      this.cropData.size
    );
    
    // Draw crop border
    this.ctx.strokeStyle = '#a0522d';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(this.cropData.x, this.cropData.y, this.cropData.size, this.cropData.size);
    
    // Draw resize handles
    const handleSize = 16;
    this.ctx.fillStyle = '#ffffff';
    this.ctx.strokeStyle = '#a0522d';
    this.ctx.lineWidth = 3;
    
    // Helper function to draw a resize handle
    const drawHandle = (x, y) => {
      // Draw white circle with brown border
      this.ctx.beginPath();
      this.ctx.arc(x, y, handleSize/2, 0, 2 * Math.PI);
      this.ctx.fill();
      this.ctx.stroke();
      
      // Add a small inner dot for better visibility
      this.ctx.fillStyle = '#a0522d';
      this.ctx.beginPath();
      this.ctx.arc(x, y, 3, 0, 2 * Math.PI);
      this.ctx.fill();
      this.ctx.fillStyle = '#ffffff'; // Reset for next handle
    };
    
    // Draw corner handles
    drawHandle(this.cropData.x, this.cropData.y); // Top-left
    drawHandle(this.cropData.x + this.cropData.size, this.cropData.y); // Top-right
    drawHandle(this.cropData.x, this.cropData.y + this.cropData.size); // Bottom-left
    drawHandle(this.cropData.x + this.cropData.size, this.cropData.y + this.cropData.size); // Bottom-right
  }

  saveCroppedImage() {
    // Create a new canvas for the cropped image
    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d');
    
    // Set canvas size to crop size
    const finalSize = 300; // Final profile picture size
    croppedCanvas.width = finalSize;
    croppedCanvas.height = finalSize;
    
    // Calculate source coordinates on original image
    const sourceX = this.cropData.x * this.cropData.scaleX;
    const sourceY = this.cropData.y * this.cropData.scaleY;
    const sourceSize = this.cropData.size * this.cropData.scaleX;
    
    // Draw cropped area to new canvas
    croppedCtx.drawImage(
      this.originalImage,
      sourceX,
      sourceY,
      sourceSize,
      sourceSize,
      0,
      0,
      finalSize,
      finalSize
    );
    
    // Convert to data URL
    const croppedImageData = croppedCanvas.toDataURL('image/jpeg', 0.9);
    
    // Save to localStorage and update profile picture
    this.saveProfilePicture(croppedImageData);
    
    // Close modal
    this.closeCropModal();
    
    // Show success message
    this.showMessage('Profile picture updated successfully!', 'success');
  }

  saveProfilePicture(imageData) {
    // Get current user
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    // Save image data to user profile
    currentUser.profilePicture = imageData;
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // Update the users array as well
    const users = JSON.parse(localStorage.getItem('styleAssistUsers') || '[]');
    const userIndex = users.findIndex(user => user.userId === currentUser.userId);
    if (userIndex !== -1) {
      users[userIndex].profilePicture = imageData;
      localStorage.setItem('styleAssistUsers', JSON.stringify(users));
    }
    
    // Update the profile picture display
    this.updateProfilePictureDisplay(imageData);
    this.showRemoveButton();
  }

  loadSavedProfilePicture() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    if (currentUser.profilePicture) {
      this.updateProfilePictureDisplay(currentUser.profilePicture);
      this.showRemoveButton();
    } else {
      // Set default profile picture if none is saved
      this.updateProfilePictureDisplay('defaultpfp.png');
      this.hideRemoveButton();
    }
  }

  removeProfilePicture() {
    if (confirm('Are you sure you want to remove your profile picture?')) {
      // Get current user
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      
      // Remove profile picture from user data
      delete currentUser.profilePicture;
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      
      // Update the users array as well
      const users = JSON.parse(localStorage.getItem('styleAssistUsers') || '[]');
      const userIndex = users.findIndex(user => user.userId === currentUser.userId);
      if (userIndex !== -1) {
        delete users[userIndex].profilePicture;
        localStorage.setItem('styleAssistUsers', JSON.stringify(users));
      }
      
      // Reset to default image
      this.updateProfilePictureDisplay('defaultpfp.png');
      this.hideRemoveButton();
      
      // Show success message
      this.showMessage('Profile picture removed successfully!', 'success');
    }
  }

  showRemoveButton() {
    const removeOption = document.getElementById('removePhotoOption');
    if (removeOption) {
      removeOption.style.display = 'block';
    }
  }

  hideRemoveButton() {
    const removeOption = document.getElementById('removePhotoOption');
    if (removeOption) {
      removeOption.style.display = 'none';
    }
  }

  updateProfilePictureDisplay(imageData) {
    const profilePic = document.getElementById('profilePicture');
    if (profilePic) {
      profilePic.src = imageData;
    }
  }

  showMessage(message, type) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message-popup ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 20px;
      background: ${type === 'success' ? '#27ae60' : '#e74c3c'};
      color: white;
      border-radius: 6px;
      z-index: 2000;
      font-weight: 600;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;
    
    document.body.appendChild(messageDiv);
    
    // Animate in
    setTimeout(() => {
      messageDiv.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
      messageDiv.style.transform = 'translateX(100%)';
      setTimeout(() => {
        messageDiv.remove();
      }, 300);
    }, 3000);
  }
}

// Initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  window.profileImageManager = new ProfileImageManager();
});