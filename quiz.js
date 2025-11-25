class StyleQuiz {
  constructor() {
    this.currentSlide = 1;
    this.totalSlides = 13;
    this.answers = {
      bodyShape: '',
      measurements: {
        waist: '',
        bust: '',
        hips: '',
        shoes: '',
        height: { feet: '', inches: '' }
      },
      measurementsPublic: false,
      stylePreferences: []
    };
    
    this.init();
  }

  init() {
    // Check if we should show results immediately (from login/signup redirect)
    const urlParams = new URLSearchParams(window.location.search);
    const showResults = urlParams.get('showResults');
    
    if (showResults === 'true') {
      this.showResultsFromLogin();
    } else {
      this.checkExistingQuizResults();
    }
    
    this.setupEventListeners();
    this.updateProgress();
  }

  checkExistingQuizResults() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    if (currentUser.hasCompletedQuiz && currentUser.quizResults) {
      // User has already taken the quiz, show option to retake or view results
      this.showRetakeOption(currentUser.quizResults);
    }
  }

  showRetakeOption(existingResults) {
    const quizContainer = document.querySelector('.quiz-container');
    
    // Create retake prompt
    const retakePrompt = document.createElement('div');
    retakePrompt.className = 'retake-prompt';
    retakePrompt.innerHTML = `
      <div class="retake-content">
        <h2>You've Already Completed the Style Quiz!</h2>
        <p>Great news! You completed your style assessment on ${new Date(existingResults.completedDate).toLocaleDateString()}.</p>
        
        <div class="existing-results-summary">
          <h3>Your Current Style Profile:</h3>
          <div class="result-tags">
            <span class="tag">Body Shape: ${this.capitalizeFirst(existingResults.bodyShape.replace('-', ' '))}</span>
            ${existingResults.stylePreferences.map(style => `<span class="tag">${this.capitalizeFirst(style)}</span>`).join('')}
          </div>
        </div>
        
        <div class="retake-options">
          <button class="retake-btn" id="viewResultsBtn">View Full Results</button>
          <button class="retake-btn secondary" id="retakeQuizBtn">Retake Quiz</button>
        </div>
      </div>
    `;
    
    // Hide the normal quiz content
    document.querySelector('.progress-bar').style.display = 'none';
    document.querySelectorAll('.quiz-slide').forEach(slide => slide.style.display = 'none');
    
    // Insert the retake prompt
    quizContainer.insertBefore(retakePrompt, quizContainer.firstChild);
    
    // Add event listeners
    document.getElementById('viewResultsBtn').addEventListener('click', () => {
      this.showExistingResults(existingResults);
    });
    
    document.getElementById('retakeQuizBtn').addEventListener('click', () => {
      this.startFreshQuiz();
    });
  }

  showExistingResults(results) {
    // Populate answers with existing results
    this.answers = { ...results };
    
    // Hide ALL unnecessary elements - only show results
    const retakePrompt = document.querySelector('.retake-prompt');
    if (retakePrompt) {
      retakePrompt.style.display = 'none';
    }
    
    // Hide the progress bar
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
      progressBar.style.display = 'none';
    }
    
    // Hide all quiz slides completely
    document.querySelectorAll('.quiz-slide').forEach(slide => {
      if (slide.id !== 'resultsSlide') {
        slide.style.display = 'none';
      }
    });
    
    // Remove active class from all slides
    document.querySelectorAll('.slide').forEach(slide => {
      slide.classList.remove('active');
    });
    
  // Set current slide to results (one past the last question slide)
  this.currentSlide = this.totalSlides + 1;
    
    // Generate and show ONLY results
    this.generateResults();
    document.getElementById('resultsSlide').classList.add('active');
    document.getElementById('resultsSlide').style.display = 'block';
    
    // Show success message
    setTimeout(() => {
      this.showQuizMessage('Here are your saved quiz results!', 'success');
    }, 300);
  }

  startFreshQuiz() {
    // Hide retake prompt
    document.querySelector('.retake-prompt').style.display = 'none';
    
    // Show normal quiz elements
    document.querySelector('.progress-bar').style.display = 'block';
    
    // Reset any inline display styles that might interfere and remove active classes
    document.querySelectorAll('.quiz-slide').forEach(slide => {
      slide.style.display = ''; // Clear any inline display styles
      slide.classList.remove('active'); // Remove active class from all slides
    });
    
    // Reset quiz state
    this.currentSlide = 1;
    this.answers = {
      bodyShape: '',
      measurements: {
        waist: '',
        bust: '',
        hips: '',
        shoes: '',
        height: { feet: '', inches: '' }
      },
      stylePreferences: [],
      measurementsPublic: false
    };
    
    // Clear any existing form values
    this.clearFormInputs();
    
    // Show only the first slide by adding active class
    document.getElementById('slide1').classList.add('active');
    this.updateProgress();
  }

  clearFormInputs() {
    // Clear radio buttons
    document.querySelectorAll('input[type="radio"]').forEach(radio => {
      radio.checked = false;
    });
    
    // Clear text inputs
    document.querySelectorAll('input[type="text"], input[type="number"]').forEach(input => {
      input.value = '';
    });
    
    // Clear checkboxes
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.checked = false;
    });
    
    // Clear select elements
    document.querySelectorAll('select').forEach(select => {
      select.selectedIndex = 0;
    });
    
    // Disable next buttons initially
    document.querySelectorAll('[id^="nextBtn"]').forEach(btn => {
      btn.disabled = true;
      btn.classList.add('disabled');
    });
  }

  setupEventListeners() {
    // Body shape selection
    document.querySelectorAll('input[name="bodyShape"]').forEach(radio => {
      radio.addEventListener('change', () => {
        this.answers.bodyShape = radio.value;
        this.enableNextButton('nextBtn1');
      });
    });

    // Measurements inputs
    const measurementInputs = ['waist', 'bust', 'hips', 'shoes', 'feet', 'inches'];
    measurementInputs.forEach(inputName => {
      const input = document.getElementById(inputName);
      if (input) {
        input.addEventListener('input', () => this.checkMeasurementsComplete());
      }
    });

    // Style preferences
    document.querySelectorAll('input[name="stylePreference"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateStylePreferences();
      });
    });

    // Detailed quiz questions (q1..q10)
    for (let i = 1; i <= 10; i++) {
      // per-question handler: enable next for that slide when answered
      document.querySelectorAll(`input[name="q${i}"]`).forEach(radio => {
        radio.addEventListener('change', (e) => {
          this.answers.detailedQuestions = this.answers.detailedQuestions || {};
          this.answers.detailedQuestions[`q${i}`] = e.target.value;
          const slideNum = 3 + i; // slide4..slide13
          if (i < 10) {
            const nextBtn = document.getElementById(`nextBtn${slideNum}`);
            if (nextBtn) nextBtn.disabled = false;
          } else {
            // last question - enable submit only if all answered
            const submitBtn = document.getElementById('submitBtn');
            if (submitBtn) submitBtn.disabled = !this.allDetailedAnswered();
          }
        });
      });
    }

    // Navigation buttons
  const nb1 = document.getElementById('nextBtn1');
  if (nb1) nb1.addEventListener('click', () => this.nextSlide());
  const nb2 = document.getElementById('nextBtn2');
  if (nb2) nb2.addEventListener('click', () => this.nextSlide());
  const pb2 = document.getElementById('prevBtn2');
  if (pb2) pb2.addEventListener('click', () => this.prevSlide());
  const pb3 = document.getElementById('prevBtn3');
  if (pb3) pb3.addEventListener('click', () => this.prevSlide());
    // Next from slide3 to slide4
    const nextBtn3 = document.getElementById('nextBtn3');
    if (nextBtn3) nextBtn3.addEventListener('click', () => this.nextSlide());
    // Attach prev/next listeners for dynamic question slides (4..13)
    for (let s = 4; s <= 13; s++) {
      const prev = document.getElementById(`prevBtn${s}`);
      if (prev) prev.addEventListener('click', () => this.prevSlide());
      // next buttons exist on slides 4..12
      const next = document.getElementById(`nextBtn${s}`);
      if (next) next.addEventListener('click', () => this.nextSlide());
    }

    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.addEventListener('click', () => this.submitQuiz());

    // Attach restart handler defensively: if the button exists now, bind directly.
    const restartBtn = document.getElementById('restartBtn');
    if (restartBtn) {
      restartBtn.addEventListener('click', () => this.restartQuiz());
    }

    // Also add a delegated listener so if the results slide is replaced dynamically
    // (e.g., innerHTML replaced for login prompt), clicks on a future '#restartBtn'
    // will still trigger the restart flow.
    document.addEventListener('click', (e) => {
      const target = e.target.closest ? e.target.closest('#restartBtn') : null;
      if (target) {
        e.preventDefault();
        this.restartQuiz();
      }
    });
  }

  checkAdditionalQuestionsComplete() {
    // legacy: keep for backward compatibility — recompute overall completion
    const answers = {};
    let allAnswered = true;
    for (let i = 1; i <= 10; i++) {
      const selected = document.querySelector(`input[name="q${i}"]:checked`);
      if (selected) answers[`q${i}`] = selected.value;
      else allAnswered = false;
    }
    this.answers.detailedQuestions = answers;
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) submitBtn.disabled = !allAnswered;
  }

  allDetailedAnswered() {
    const dq = this.answers.detailedQuestions || {};
    for (let i = 1; i <= 10; i++) {
      if (!dq[`q${i}`]) return false;
    }
    return true;
  }

  checkMeasurementsComplete() {
    const waist = document.getElementById('waist').value;
    const bust = document.getElementById('bust').value;
    const hips = document.getElementById('hips').value;
    const shoes = document.getElementById('shoes').value;
    const feet = document.getElementById('feet').value;
    const inches = document.getElementById('inches').value;

    // Update answers object
    this.answers.measurements = {
      waist,
      bust,
      hips,
      shoes,
      height: { feet, inches }
    };
    
    // Capture measurements visibility preference
    this.answers.measurementsPublic = document.getElementById('measurementsPublic').checked;

    // Check if at least waist, bust, and hips are filled (required measurements)
    if (waist && bust && hips) {
      this.enableNextButton('nextBtn2');
    } else {
      this.disableNextButton('nextBtn2');
    }
  }

  updateStylePreferences() {
    const selectedPreferences = [];
    document.querySelectorAll('input[name="stylePreference"]:checked').forEach(checkbox => {
      selectedPreferences.push(checkbox.value);
    });
    
    this.answers.stylePreferences = selectedPreferences;
    
    if (selectedPreferences.length > 0) {
      // enable the Next button on slide 3 (to proceed to detailed questions)
      this.enableNextButton('nextBtn3');
    } else {
      this.disableNextButton('nextBtn3');
    }
  }

  enableNextButton(buttonId) {
    document.getElementById(buttonId).disabled = false;
  }

  disableNextButton(buttonId) {
    document.getElementById(buttonId).disabled = true;
  }

  nextSlide() {
    if (this.currentSlide < this.totalSlides) {
      this.hideSlide(this.currentSlide);
      this.currentSlide++;
      this.showSlide(this.currentSlide);
      this.updateProgress();
    }
  }

  prevSlide() {
    if (this.currentSlide > 1) {
      this.hideSlide(this.currentSlide);
      this.currentSlide--;
      this.showSlide(this.currentSlide);
      this.updateProgress();
    }
  }

  showSlide(slideNumber) {
    document.getElementById(`slide${slideNumber}`).classList.add('active');
  }

  hideSlide(slideNumber) {
    document.getElementById(`slide${slideNumber}`).classList.remove('active');
  }

  updateProgress() {
    const progressPercent = (this.currentSlide / this.totalSlides) * 100;
    document.getElementById('progress').style.width = `${progressPercent}%`;
  }

  submitQuiz() {
    this.hideSlide(this.currentSlide);
    
    // Check if user is logged in
    const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
    
    if (isLoggedIn) {
      // User is logged in - save results and show them
      this.saveQuizResults();
      this.generateResults();
      document.getElementById('resultsSlide').classList.add('active');
      document.getElementById('progress').style.width = '100%';
    } else {
      // User is not logged in - show login prompt
      this.showLoginPrompt();
    }
  }

  saveQuizResults() {
    // Get current user
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    if (currentUser.userId) {
      // Create quiz result object
      const quizResult = {
        ...this.answers,
        completedDate: new Date().toISOString(),
        userId: currentUser.userId
      };
      // Compute a style profile (primary style, secondary styles, color palette)
      try {
        const profile = this.computeStyleProfile();
        quizResult.primaryStyle = profile.primaryStyle;
        quizResult.secondaryStyles = profile.secondaryStyles;
        quizResult.colorPreferences = profile.colorPalette;
        quizResult.styleConfidence = profile.confidence;
      } catch (e) {
        // If anything goes wrong, gracefully continue without profile
        console.warn('Failed to compute style profile', e);
      }
      
      // Update user's quiz results
      currentUser.quizResults = quizResult;
      currentUser.hasCompletedQuiz = true;
      
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
  }

  generateResults() {
    const resultsContent = document.getElementById('resultsContent');
    const bodyShapeRecommendations = this.getBodyShapeRecommendations(this.answers.bodyShape);
    const sizeInfo = this.getSizeInfo();
    const profile = this.computeStyleProfile();

    const paletteHtml = profile.colorPalette.length ? `<div class="palette">${profile.colorPalette.map(c => `<span class="tag">${c}</span>`).join('')}</div>` : '';
    const tailoringHtml = profile.tailoring && profile.tailoring.length ? `<ul style="text-align:left;margin-left:20px;">${profile.tailoring.map(t => `<li>${t}</li>`).join('')}</ul>` : '';

    resultsContent.innerHTML = `
      <div class="result-section">
        <h3>Your Body Shape: ${this.capitalizeFirst((this.answers.bodyShape || '').replace('-', ' '))}</h3>
        <p>${bodyShapeRecommendations.description}</p>
        <p><strong>Recommended styles:</strong></p>
        <div class="result-tags">
          ${bodyShapeRecommendations.recommendations.map(rec => `<span class="tag">${rec}</span>`).join('')}
        </div>
      </div>

      <div class="result-section">
        <h3>Your Size Profile</h3>
        ${sizeInfo}
      </div>

      <div class="result-section">
        <h3>Your Computed Style Profile</h3>
        <p><strong>Primary style:</strong> ${this.capitalizeFirst(profile.primaryStyle)}</p>
        <p><strong>Secondary styles:</strong> ${profile.secondaryStyles.map(s => this.capitalizeFirst(s)).join(', ') || 'None'}</p>
        <p><strong>Recommended color palette:</strong></p>
        ${paletteHtml}
        <p style="margin-top: 15px;"><strong>Tailoring & fit tips:</strong></p>
        ${tailoringHtml}
      </div>

      <div class="result-section">
        <h3>Your Style Preferences</h3>
        <div class="result-tags">
          ${this.answers.stylePreferences.map(style => `<span class="tag">${this.capitalizeFirst(style)}</span>`).join('')}
        </div>
        <p style="margin-top: 15px;"><strong>Personalized recommendations:</strong></p>
        <p>${this.getStyleRecommendations()}</p>
      </div>

      <div class="result-section">
        <h3>Next Steps</h3>
        <p>Based on your profile, we recommend exploring our curated collections that match your ${this.answers.bodyShape.replace('-', ' ')} body shape and ${this.answers.stylePreferences.join(', ')} style preferences.</p>
        <p><strong>Pro tip:</strong> Focus on pieces that enhance your natural silhouette and reflect your personal style!</p>
      </div>
    `;
  }

  getBodyShapeRecommendations(bodyShape) {
    const recommendations = {
      'round': {
        description: 'Your round body shape is beautifully balanced. Focus on creating a flattering silhouette that highlights your best features.',
        recommendations: ['Empire waist dresses', 'V-neck tops', 'A-line skirts', 'Flowy fabrics', 'Vertical stripes']
      },
      'hourglass': {
        description: 'Your hourglass figure is naturally balanced with a defined waist. Embrace styles that celebrate your curves.',
        recommendations: ['Wrap dresses', 'Fitted tops', 'High-waisted bottoms', 'Belted styles', 'Pencil skirts']
      },
      'rectangle': {
        description: 'Your rectangle body shape has a naturally straight silhouette. Create curves and add visual interest with strategic styling.',
        recommendations: ['Peplum tops', 'Layered looks', 'Textured fabrics', 'Cropped jackets', 'Wide-leg pants']
      },
      'inverted-triangle': {
        description: 'Your inverted triangle shape features broader shoulders. Balance your silhouette by adding volume to your lower half.',
        recommendations: ['A-line bottoms', 'Flare jeans', 'Detailed skirts', 'Scoop necks', 'Hip-emphasizing styles']
      },
      'apple': {
        description: 'Your apple shape carries weight in the midsection. Draw attention upward and create a flowing silhouette.',
        recommendations: ['Empire waist', 'Tunic tops', 'V-necks', 'Straight-leg pants', 'Draped fabrics']
      },
      'athletic': {
        description: 'Your athletic build is strong and toned. Show off your fit physique while adding feminine touches.',
        recommendations: ['Fitted styles', 'Structured blazers', 'Skinny jeans', 'Crop tops', 'Bodycon dresses']
      }
    };
    
    return recommendations[bodyShape] || recommendations['rectangle'];
  }

  getSizeInfo() {
    const { waist, bust, hips, shoes, height } = this.answers.measurements;
    let sizeInfo = '<p>Your measurements:</p><ul style="text-align: left; margin-left: 20px;">';
    
    if (bust) sizeInfo += `<li>Bust/Chest: ${bust}"</li>`;
    if (waist) sizeInfo += `<li>Waist: ${waist}"</li>`;
    if (hips) sizeInfo += `<li>Hips: ${hips}"</li>`;
    if (shoes) sizeInfo += `<li>Shoe size: ${shoes}</li>`;
    if (height.feet && height.inches) sizeInfo += `<li>Height: ${height.feet}'${height.inches}"</li>`;
    
    sizeInfo += '</ul>';
    return sizeInfo;
  }

  getStyleRecommendations() {
    // Use the computed profile to provide a richer recommendation
    const profile = this.computeStyleProfile();

    const palette = profile.colorPalette.join(', ');
    const secondary = profile.secondaryStyles.length ? profile.secondaryStyles.map(s => this.capitalizeFirst(s)).join(', ') : 'None';

    return `Primary style: ${this.capitalizeFirst(profile.primaryStyle)}.\nWe will emphasize pieces and colors like ${palette}. Complementary styles: ${secondary}.`;
  }

  /*
   * computeStyleProfile
   * - Scores each style based on selected preferences, body shape, and measurements
   * - Returns primaryStyle, secondaryStyles (top 2), a recommended color palette, and confidence (0..1)
   */
  computeStyleProfile() {
    const styles = ['casual','professional','bohemian','minimalist','trendy','classic','edgy','romantic'];
    const scores = {};
    styles.forEach(s => scores[s] = 0);

    const preferences = Array.isArray(this.answers.stylePreferences) ? this.answers.stylePreferences : [];
    const body = (this.answers.bodyShape || '').toLowerCase();

    // Preference boosts (strong signal)
    preferences.forEach(pref => {
      if (scores[pref] !== undefined) scores[pref] += 4;
      // small related boosts
      const related = {
        'casual': ['minimalist','trendy'],
        'professional': ['classic','minimalist'],
        'bohemian': ['romantic','casual'],
        'minimalist': ['classic','professional'],
        'trendy': ['edgy','casual'],
        'classic': ['professional','minimalist'],
        'edgy': ['trendy','casual'],
        'romantic': ['bohemian','classic']
      };
      (related[pref] || []).forEach(r => scores[r] += 1);
    });

    // Body-shape influences (moderate signal)
    const bodyBoosts = {
      'hourglass': { 'classic': 1, 'romantic': 1 },
      'round': { 'bohemian': 1, 'casual': 1 },
      'rectangle': { 'edgy': 1, 'minimalist': 1 },
      'inverted-triangle': { 'casual': 1, 'classic': 1 },
      'apple': { 'bohemian': 1, 'casual': 1 },
      'athletic': { 'edgy': 1, 'minimalist': 1 }
    };
    if (body && bodyBoosts[body]) {
      Object.keys(bodyBoosts[body]).forEach(s => scores[s] += bodyBoosts[body][s]);
    }

    // Measurements-based nudges (small signal)
    const m = this.answers.measurements || {};
    const waist = parseFloat(m.waist) || 0;
    const bust = parseFloat(m.bust) || 0;
    const hips = parseFloat(m.hips) || 0;
    // simple ratio checks
    if (waist && bust && hips) {
      const waistToHips = waist / hips;
      const bustToWaist = bust / waist;
      if (bustToWaist > 1.1) { scores['classic'] += 1; scores['romantic'] += 1; }
      if (waistToHips < 0.9) { scores['bohemian'] += 1; }
    }

    // If no explicit preferences chosen, try to guess from body shape
    if (preferences.length === 0) {
      const fallbacks = {
        'hourglass': 'classic',
        'athletic': 'edgy',
        'rectangle': 'minimalist',
        'round': 'bohemian'
      };
      const pick = fallbacks[body] || 'casual';
      scores[pick] += 3;
    }

    // Integrate detailedQuestions (q1..q10) if available (strong signal)
    const dq = this.answers.detailedQuestions || {};
    if (dq && Object.keys(dq).length) {
      // helper to add weighted boosts
      const boost = (style, w=1) => { if (scores[style] !== undefined) scores[style] += w; };

      // Q1 motive/function
      switch ((dq.q1 || '').toUpperCase()) {
        case 'A': boost('casual', 2); break;
        case 'B': boost('edgy', 2); boost('trendy', 1); break;
        case 'C': boost('professional', 2); boost('classic', 1); break;
        case 'D': boost('bohemian', 2); boost('romantic', 1); break;
      }

      // Q2 color palette influences palette choices and style nudges
      switch ((dq.q2 || '').toUpperCase()) {
        case 'A': boost('minimalist',2); boost('classic',1); break;
        case 'B': boost('classic',2); boost('professional',1); break;
        case 'C': boost('trendy',2); boost('casual',1); break;
        case 'D': boost('bohemian',2); boost('casual',1); break;
      }

      // Q3 silhouette/fit
      switch ((dq.q3 || '').toUpperCase()) {
        case 'A': boost('casual',2); break;
        case 'B': boost('professional',2); boost('classic',1); break;
        case 'C': boost('bohemian',2); boost('romantic',1); break;
        case 'D': boost('trendy',2); boost('edgy',1); break;
      }

      // Q4 accessory
      switch ((dq.q4 || '').toUpperCase()) {
        case 'A': boost('minimalist',2); break;
        case 'B': boost('classic',2); break;
        case 'C': boost('bohemian',2); break;
        case 'D': boost('trendy',2); boost('edgy',1); break;
      }

      // Q5 footwear
      switch ((dq.q5 || '').toUpperCase()) {
        case 'A': boost('casual',2); boost('minimalist',1); break;
        case 'B': boost('classic',2); boost('professional',1); break;
        case 'C': boost('bohemian',2); break;
        case 'D': boost('trendy',2); break;
      }

      // Q6 logos/branding
      switch ((dq.q6 || '').toUpperCase()) {
        case 'A': boost('minimalist',2); break;
        case 'B': boost('classic',2); break;
        case 'C': boost('edgy',2); boost('casual',1); break;
        case 'D': boost('trendy',2); boost('edgy',1); break;
      }

      // Q7 outfit choice
      switch ((dq.q7 || '').toUpperCase()) {
        case 'A': boost('casual',2); boost('classic',1); break;
        case 'B': boost('professional',2); break;
        case 'C': boost('bohemian',2); break;
        case 'D': boost('edgy',2); break;
      }

      // Q8 fabric texture
      switch ((dq.q8 || '').toUpperCase()) {
        case 'A': boost('casual',2); boost('minimalist',1); break;
        case 'B': boost('professional',2); boost('classic',1); break;
        case 'C': boost('romantic',2); boost('bohemian',1); break;
        case 'D': boost('edgy',2); boost('trendy',1); break;
      }

      // Q9 trend adoption
      switch ((dq.q9 || '').toUpperCase()) {
        case 'A': boost('classic',2); boost('minimalist',1); break;
        case 'B': boost('classic',1); boost('trendy',1); break;
        case 'C': boost('trendy',2); boost('bohemian',1); break;
        case 'D': boost('trendy',3); boost('edgy',1); break;
      }

      // Q10 focus/detail
      switch ((dq.q10 || '').toUpperCase()) {
        case 'A': boost('classic',2); break;
        case 'B': boost('classic',2); boost('professional',1); break;
        case 'C': boost('bohemian',2); boost('romantic',1); break;
        case 'D': boost('trendy',2); boost('edgy',1); break;
      }
    }

    // Normalize and compute ranking
    const entries = Object.entries(scores).sort((a,b) => b[1] - a[1]);
    const primary = entries[0][0];
    const secondary = entries.slice(1,3).map(e => e[0]);
    const maxScore = entries[0][1];
    const total = entries.reduce((s,[k,v]) => s+v, 0) || 1;
    const confidence = Math.min(1, maxScore / total + 0.15); // heuristic confidence

    const colorPalette = this.recommendColorPalette(primary, preferences);
    const tailoring = this.getTailoringTips(body, m);

    return {
      primaryStyle: primary,
      secondaryStyles: secondary,
      colorPalette,
      tailoring,
      confidence
    };
  }

  // Suggest color palettes based on primary style and preferences
  recommendColorPalette(primaryStyle, preferences) {
    const palettes = {
      'casual': ['Denim Blue','Olive','Warm Neutrals'],
      'professional': ['Navy','Charcoal','Ivory'],
      'bohemian': ['Earthy Terracotta','Mustard','Forest Green'],
      'minimalist': ['Black','White','Beige'],
      'trendy': ['Hot Pink','Electric Blue','Lime Accent'],
      'classic': ['Navy','Burgundy','Camel'],
      'edgy': ['Black','Gunmetal','Crimson'],
      'romantic': ['Blush Pink','Lavender','Cream']
    };

    const base = palettes[primaryStyle] || ['Neutral Tones'];
    // If detailedQuestions indicate a dominant palette, prioritize that
    const dq = this.answers.detailedQuestions || {};
    if (dq.q2) {
      switch (dq.q2.toUpperCase()) {
        case 'A': return ['Black','White','Gray','Beige'];
        case 'B': return ['Emerald','Sapphire','Deep Burgundy'];
        case 'C': return ['Bright Red','Cobalt Blue','Pastel Yellow'];
        case 'D': return ['Warm Browns','Cream','Olive','Denim Blue'];
      }
    }

    // If user explicitly selected colors in future, they'd be merged here
    return base;
  }

  // Small function to provide tailoring/fit tips (used in results)
  getTailoringTips(bodyShape, measurements) {
    const tips = [];
    if (!bodyShape) return tips;
    const b = bodyShape.toLowerCase();
    if (b === 'hourglass') tips.push('Choose pieces that emphasize your defined waist: belts, wrap styles, and tailored fits.');
    if (b === 'round' || b === 'apple') tips.push('Look for pieces with vertical lines and V-necks to elongate your torso and create balance.');
    if (b === 'rectangle') tips.push('Add curves with peplum tops, belts, and layered silhouettes.');
    if (b === 'inverted-triangle') tips.push('Soften shoulders with v-necks and add volume to hips with A-line skirts or wide-leg pants.');
    if (b === 'athletic') tips.push('Mix structured and soft pieces to add femininity: tailored blazers with flowing skirts work well.');
    // Measurements-specific quick tips
    const waist = parseFloat(measurements.waist) || 0;
    const hips = parseFloat(measurements.hips) || 0;
    if (waist && hips && waist / hips < 0.9) tips.push('High-waisted bottoms can help define your waist and elongate legs.');
    return tips;
  }

  capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  populateFormFields() {
    // Populate body shape radio buttons
    if (this.answers.bodyShape) {
      const bodyShapeRadio = document.querySelector(`input[name="bodyShape"][value="${this.answers.bodyShape}"]`);
      if (bodyShapeRadio) {
        bodyShapeRadio.checked = true;
      }
    }

    // Populate measurements
    if (this.answers.measurements) {
      const measurements = this.answers.measurements;
      if (measurements.waist) document.getElementById('waist').value = measurements.waist;
      if (measurements.bust) document.getElementById('bust').value = measurements.bust;
      if (measurements.hips) document.getElementById('hips').value = measurements.hips;
      if (measurements.shoes) document.getElementById('shoes').value = measurements.shoes;
      if (measurements.height) {
        if (measurements.height.feet) document.getElementById('heightFeet').value = measurements.height.feet;
        if (measurements.height.inches) document.getElementById('heightInches').value = measurements.height.inches;
      }
    }
    
    // Populate measurements visibility preference
    if (this.answers.measurementsPublic !== undefined) {
      document.getElementById('measurementsPublic').checked = this.answers.measurementsPublic;
    }

    // Populate style preferences checkboxes
    if (this.answers.stylePreferences && this.answers.stylePreferences.length > 0) {
      this.answers.stylePreferences.forEach(style => {
        const checkbox = document.querySelector(`input[name="stylePreferences"][value="${style}"]`);
        if (checkbox) {
          checkbox.checked = true;
        }
      });
    }
  }

  showQuizMessage(message, type) {
    // Remove any existing message
    const existingMessage = document.querySelector('.quiz-message');
    if (existingMessage) {
      existingMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `quiz-message ${type}`;
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
    }, 4000);
  }

  showResultsFromLogin() {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    if (currentUser.hasCompletedQuiz && currentUser.quizResults) {
      // Load the user's quiz results
      this.answers = { ...currentUser.quizResults };
      
      // Hide ALL unnecessary elements - only show results
      const progressBar = document.querySelector('.progress-bar');
      if (progressBar) {
        progressBar.style.display = 'none';
      }
      
      // Hide all quiz slides completely except results
      document.querySelectorAll('.quiz-slide').forEach(slide => {
        if (slide.id !== 'resultsSlide') {
          slide.style.display = 'none';
        }
      });
      
      // Remove active class from all slides
      document.querySelectorAll('.slide').forEach(slide => {
        slide.classList.remove('active');
      });
      
      // Generate and show ONLY results
      this.generateResults();
      document.getElementById('resultsSlide').classList.add('active');
      document.getElementById('resultsSlide').style.display = 'block';
      
      // Show success message
      setTimeout(() => {
        this.showQuizMessage('Welcome back! Here are your personalized style results!', 'success');
      }, 500);
      
      // Clean up URL parameters
      if (window.history.replaceState) {
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } else {
      // No quiz results found, something went wrong - show error and normal quiz
      this.showQuizMessage('Quiz results not found. Please retake the quiz.', 'error');
      this.checkExistingQuizResults();
    }
  }

  showLoginPrompt() {
    // Store quiz answers temporarily
    sessionStorage.setItem('pendingQuizAnswers', JSON.stringify(this.answers));
    
    // Create login prompt slide
    const resultsSlide = document.getElementById('resultsSlide');
    resultsSlide.innerHTML = `
      <div class="login-prompt">
        <div class="login-prompt-content">
          <h2> Quiz Complete!</h2>
          <p>Great job completing the Style Quiz! To see your personalized results and recommendations, you'll need to create a free account or log in.</p>
          
          <div class="benefits-list">
            <h3>With a free Fashionly account, you'll get:</h3>
            <ul>
              <li> Personalized style recommendations</li>
              <li> Saved quiz results you can access anytime</li>
              <li> Save favorite outfits from our gallery</li>
              <li> Track your style preferences over time</li>
            </ul>
          </div>
          
          <div class="login-prompt-actions">
            <a href="signup.html" class="cta-button primary">Create Free Account</a>
            <a href="login.html" class="cta-button secondary">I Already Have an Account</a>
          </div>
          
          <p class="small-text">Once you create an account or log in, you'll see your personalized results immediately - no need to retake the quiz.</p>
        </div>
      </div>
    `;
    
    resultsSlide.classList.add('active');
    document.getElementById('progress').style.width = '100%';
  }

  restartQuiz() {
    // Reset answers
    this.answers = {
      bodyShape: '',
      measurements: {
        waist: '',
        bust: '',
        hips: '',
        shoes: '',
        height: { feet: '', inches: '' }
      },
      stylePreferences: []
    };

    // Reset form inputs
    document.querySelectorAll('input[type="radio"]').forEach(radio => radio.checked = false);
    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => checkbox.checked = false);
    document.querySelectorAll('input[type="number"]').forEach(input => input.value = '');

    // Reset buttons
    this.disableNextButton('nextBtn1');
    this.disableNextButton('nextBtn2');
    this.disableNextButton('submitBtn');

    // Restore all quiz elements
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
      progressBar.style.display = 'block';
    }
    
    // Show all quiz slides again
    document.querySelectorAll('.quiz-slide').forEach(slide => {
      slide.style.display = 'block';
    });

    // Return to first slide
    document.getElementById('resultsSlide').classList.remove('active');
    this.currentSlide = 1;
    this.showSlide(1);
    this.updateProgress();
  }
}

// Initialize the quiz when the page loads
document.addEventListener('DOMContentLoaded', () => {
  new StyleQuiz();
});