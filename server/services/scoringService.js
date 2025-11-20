// Port of computeStyleProfile from the client-side quiz.js

function computeStyleProfile(answers) {
  const styles = ['casual','professional','bohemian','minimalist','trendy','classic','edgy','romantic'];
  const scores = {};
  styles.forEach(s => scores[s] = 0);

  const preferences = Array.isArray(answers.stylePreferences) ? answers.stylePreferences : [];
  const body = (answers.bodyShape || '').toLowerCase();

  // Preference boosts
  preferences.forEach(pref => {
    if (scores[pref] !== undefined) scores[pref] += 4;
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

  const bodyBoosts = {
    'hourglass': { 'classic': 2, 'romantic': 1 },
    'round': { 'bohemian': 1, 'casual': 1 },
    'rectangle': { 'edgy': 1, 'minimalist': 1 },
    'inverted-triangle': { 'casual': 1, 'classic': 1 },
    'apple': { 'bohemian': 1, 'casual': 1 },
    'athletic': { 'edgy': 2, 'minimalist': 1 }
  };

  if (body && bodyBoosts[body]) {
    Object.keys(bodyBoosts[body]).forEach(s => scores[s] += bodyBoosts[body][s]);
  }

  const m = answers.measurements || {};
  const waist = parseFloat(m.waist) || 0;
  const bust = parseFloat(m.bust) || 0;
  const hips = parseFloat(m.hips) || 0;
  if (waist && bust && hips) {
    const waistToHips = waist / hips;
    const bustToWaist = bust / waist;
    if (bustToWaist > 1.1) { scores['classic'] += 1; scores['romantic'] += 1; }
    if (waistToHips < 0.9) { scores['bohemian'] += 1; }
  }

  if (preferences.length === 0) {
    const fallbacks = { 'hourglass': 'classic', 'athletic': 'edgy', 'rectangle': 'minimalist', 'round': 'bohemian' };
    const pick = fallbacks[body] || 'casual';
    scores[pick] += 3;
  }

  const dq = answers.detailedQuestions || {};
  if (dq && Object.keys(dq).length) {
    const boost = (style, w=1) => { if (scores[style] !== undefined) scores[style] += w; };

    switch ((dq.q1 || '').toUpperCase()) {
      case 'A': boost('casual', 2); break;
      case 'B': boost('edgy', 2); boost('trendy', 1); break;
      case 'C': boost('professional', 2); boost('classic', 1); break;
      case 'D': boost('bohemian', 2); boost('romantic', 1); break;
    }

    switch ((dq.q2 || '').toUpperCase()) {
      case 'A': boost('minimalist',2); boost('classic',1); break;
      case 'B': boost('classic',2); boost('professional',1); break;
      case 'C': boost('trendy',2); boost('casual',1); break;
      case 'D': boost('bohemian',2); boost('casual',1); break;
    }

    switch ((dq.q3 || '').toUpperCase()) {
      case 'A': boost('casual',2); break;
      case 'B': boost('professional',2); boost('classic',1); break;
      case 'C': boost('bohemian',2); boost('romantic',1); break;
      case 'D': boost('trendy',2); boost('edgy',1); break;
    }

    switch ((dq.q4 || '').toUpperCase()) {
      case 'A': boost('minimalist',2); break;
      case 'B': boost('classic',2); break;
      case 'C': boost('bohemian',2); break;
      case 'D': boost('trendy',2); boost('edgy',1); break;
    }

    switch ((dq.q5 || '').toUpperCase()) {
      case 'A': boost('casual',2); boost('minimalist',1); break;
      case 'B': boost('classic',2); boost('professional',1); break;
      case 'C': boost('bohemian',2); break;
      case 'D': boost('trendy',2); break;
    }

    switch ((dq.q6 || '').toUpperCase()) {
      case 'A': boost('minimalist',2); break;
      case 'B': boost('classic',2); break;
      case 'C': boost('edgy',2); boost('casual',1); break;
      case 'D': boost('trendy',2); boost('edgy',1); break;
    }

    switch ((dq.q7 || '').toUpperCase()) {
      case 'A': boost('casual',2); boost('classic',1); break;
      case 'B': boost('professional',2); break;
      case 'C': boost('bohemian',2); break;
      case 'D': boost('edgy',2); break;
    }

    switch ((dq.q8 || '').toUpperCase()) {
      case 'A': boost('casual',2); boost('minimalist',1); break;
      case 'B': boost('professional',2); boost('classic',1); break;
      case 'C': boost('romantic',2); boost('bohemian',1); break;
      case 'D': boost('edgy',2); boost('trendy',1); break;
    }

    switch ((dq.q9 || '').toUpperCase()) {
      case 'A': boost('classic',2); boost('minimalist',1); break;
      case 'B': boost('classic',1); boost('trendy',1); break;
      case 'C': boost('trendy',2); boost('bohemian',1); break;
      case 'D': boost('trendy',3); boost('edgy',1); break;
    }

    switch ((dq.q10 || '').toUpperCase()) {
      case 'A': boost('classic',2); break;
      case 'B': boost('classic',2); boost('professional',1); break;
      case 'C': boost('bohemian',2); boost('romantic',1); break;
      case 'D': boost('trendy',2); boost('edgy',1); break;
    }
  }

  const entries = Object.entries(scores).sort((a,b) => b[1] - a[1]);
  const primary = entries[0][0];
  const secondary = entries.slice(1,3).map(e => e[0]);
  const maxScore = entries[0][1];
  const total = entries.reduce((s,[k,v]) => s+v, 0) || 1;
  const confidence = Math.min(1, maxScore / total + 0.15);

  const colorPalette = recommendColorPalette(primary, answers);
  const tailoring = getTailoringTips(body, m=answers.measurements || {});

  return {
    primaryStyle: primary,
    secondaryStyles: secondary,
    colorPalette,
    tailoring,
    confidence
  };
}

function recommendColorPalette(primaryStyle, answers) {
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
  const dq = answers.detailedQuestions || {};
  if (dq.q2) {
    switch (dq.q2.toUpperCase()) {
      case 'A': return ['Black','White','Gray','Beige'];
      case 'B': return ['Emerald','Sapphire','Deep Burgundy'];
      case 'C': return ['Bright Red','Cobalt Blue','Pastel Yellow'];
      case 'D': return ['Warm Browns','Cream','Olive','Denim Blue'];
    }
  }
  return base;
}

function getTailoringTips(bodyShape, measurements) {
  const tips = [];
  if (!bodyShape) return tips;
  const b = bodyShape.toLowerCase();
  if (b === 'hourglass') tips.push('Choose pieces that emphasize your defined waist: belts, wrap styles, and tailored fits.');
  if (b === 'round' || b === 'apple') tips.push('Look for pieces with vertical lines and V-necks to elongate your torso and create balance.');
  if (b === 'rectangle') tips.push('Add curves with peplum tops, belts, and layered silhouettes.');
  if (b === 'inverted-triangle') tips.push('Soften shoulders with v-necks and add volume to hips with A-line skirts or wide-leg pants.');
  if (b === 'athletic') tips.push('Mix structured and soft pieces to add femininity: tailored blazers with flowing skirts work well.');
  const waist = parseFloat(measurements.waist) || 0;
  const hips = parseFloat(measurements.hips) || 0;
  if (waist && hips && waist / hips < 0.9) tips.push('High-waisted bottoms can help define your waist and elongate legs.');
  return tips;
}

module.exports = { computeStyleProfile };
