// Seattle Crime Data Visualization - HWK 5 (Instance Mode)
// Interactive Stacked Bar Chart showing Property Crime Dominance
// Loads data directly from SPD CSV file

registerSketch('sk5', function(p) {
  let crimeData = [];
  let rawData;
  let hoveredBar = null;
  let selectedNeighborhood = null;
  let showViolent = true;
  let showProperty = true;
  let showOther = true;
  let dataLoaded = false;

  // Colors
  const colors = {
    violent: '#D62828',
    property: '#F77F00',
    other: '#003049',
    background: '#FFFFFF',
    text: '#2B2D42',
    textLight: '#8D99AE',
    hover: '#FFC300'
  };

  // Layout constants
  const margin = { top: 180, right: 80, bottom: 60, left: 200 };
  let chartWidth, chartHeight;
  const barHeight = 28;
  const barPadding = 8;

  // Animation
  let animProgress = 0;
  const animDuration = 60;

  p.preload = function() {
    // Load the CSV file
    // Make sure this path points to where you put the CSV in your repo
    rawData = p.loadTable('SPD_Crime_Data__2008-Present_20260128(2).csv', 'csv', 'header');
  };

  p.setup = function() {
    let canvas = p.createCanvas(1080, 1350);
    canvas.style('margin-top', '25px');
    canvas.parent('sketch-container-sk5');
    
    // Process the loaded data
    processData();
    
    chartWidth = p.width - margin.left - margin.right;
    chartHeight = p.height - margin.top - margin.bottom;
    
    p.textFont('Arial');
    p.frameRate(60);
  };

  function processData() {
    // Count crimes by neighborhood and category
    let neighborhoodCounts = {};
    
    for (let i = 0; i < rawData.getRowCount(); i++) {
      let neighborhood = rawData.getString(i, 'Neighborhood');
      let category = rawData.getString(i, 'Offense Category');
      
      // Skip empty neighborhoods
      if (!neighborhood || neighborhood === '-') continue;
      
      // Initialize neighborhood if needed
      if (!neighborhoodCounts[neighborhood]) {
        neighborhoodCounts[neighborhood] = {
          violent: 0,
          property: 0,
          other: 0,
          total: 0
        };
      }
      
      // Count by category
      if (category === 'VIOLENT CRIME') {
        neighborhoodCounts[neighborhood].violent++;
      } else if (category === 'PROPERTY CRIME') {
        neighborhoodCounts[neighborhood].property++;
      } else {
        neighborhoodCounts[neighborhood].other++;
      }
      neighborhoodCounts[neighborhood].total++;
    }
    
    // Convert to array and sort by total
    crimeData = [];
    for (let neighborhood in neighborhoodCounts) {
      crimeData.push({
        neighborhood: neighborhood,
        violent: neighborhoodCounts[neighborhood].violent,
        property: neighborhoodCounts[neighborhood].property,
        other: neighborhoodCounts[neighborhood].other,
        total: neighborhoodCounts[neighborhood].total
      });
    }
    
    // Sort by total crimes (descending) and take top 20
    crimeData.sort((a, b) => b.total - a.total);
    crimeData = crimeData.slice(0, 20);
    
    // Format neighborhood names to title case
    crimeData.forEach(d => {
      d.neighborhood = formatNeighborhoodName(d.neighborhood);
    });
    
    dataLoaded = true;
    console.log('Loaded crime data for', crimeData.length, 'neighborhoods');
  }

  function formatNeighborhoodName(name) {
    // Convert to title case
    return name.split(' ').map(word => {
      // Keep abbreviations uppercase
      if (word === 'SLU' || word.length <= 3 && word === word.toUpperCase()) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
  }

  p.draw = function() {
    p.background(colors.background);
    
    // Show loading message if data not ready
    if (!dataLoaded || crimeData.length === 0) {
      p.fill(colors.text);
      p.textAlign(p.CENTER, p.CENTER);
      p.textSize(24);
      p.text('Loading crime data...', p.width / 2, p.height / 2);
      return;
    }
    
    if (animProgress < animDuration) {
      animProgress++;
    }
    let progress = easeOutCubic(animProgress / animDuration);
    
    drawTitle();
    drawFilters();
    
    p.push();
    p.translate(margin.left, margin.top);
    drawBars(progress);
    drawAxes();
    p.pop();
    
    if (hoveredBar !== null) {
      drawTooltip();
    }
    
    drawFooter();
  };

  function drawTitle() {
    p.fill(colors.text);
    p.noStroke();
    p.textAlign(p.CENTER);
    p.textSize(36);
    p.textStyle(p.BOLD);
    p.text('Property Crime Dominates', p.width / 2, 40);
    
    p.textSize(18);
    p.textStyle(p.NORMAL);
    p.fill(colors.textLight);
    p.text("Seattle's Highest-Crime Neighborhoods", p.width / 2, 70);
    
    p.textSize(14);
    p.text('December 2025', p.width / 2, 95);
  }

  function drawFilters() {
    const buttonWidth = 140;
    const buttonHeight = 35;
    const buttonSpacing = 15;
    const startX = p.width / 2 - (buttonWidth * 3 + buttonSpacing * 2) / 2;
    const startY = margin.top - 50;
    
    drawFilterButton('Violent Crime', showViolent, colors.violent, startX, startY, buttonWidth, buttonHeight);
    drawFilterButton('Property Crime', showProperty, colors.property, startX + buttonWidth + buttonSpacing, startY, buttonWidth, buttonHeight);
    drawFilterButton('All Other', showOther, colors.other, startX + (buttonWidth + buttonSpacing) * 2, startY, buttonWidth, buttonHeight);
  }

  function drawFilterButton(label, isActive, color, x, y, w, h) {
    p.push();
    
    const isHover = p.mouseX > x && p.mouseX < x + w && p.mouseY > y && p.mouseY < y + h;
    
    if (isActive) {
      p.fill(color);
      p.stroke(color);
    } else {
      p.fill(255);
      p.stroke(colors.textLight);
    }
    
    p.strokeWeight(2);
    p.rect(x, y, w, h, 8);
    
    p.fill(isActive ? 255 : colors.textLight);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(13);
    p.textStyle(p.NORMAL);
    p.text(label, x + w / 2, y + h / 2);
    
    if (isHover) {
      p.cursor(p.POINTER);
    }
    
    p.pop();
  }

  function drawBars(progress) {
    let maxValue = p.max(crimeData.map(d => d.total));
    
    crimeData.forEach((d, i) => {
      let y = i * (barHeight + barPadding);
      let totalValue = 0;
      if (showViolent) totalValue += d.violent;
      if (showProperty) totalValue += d.property;
      if (showOther) totalValue += d.other;
      
      let barWidth = p.map(totalValue, 0, maxValue, 0, chartWidth) * progress;
      
      let isHover = p.mouseX > margin.left && p.mouseX < margin.left + barWidth &&
                    p.mouseY > margin.top + y && p.mouseY < margin.top + y + barHeight;
      
      if (isHover) {
        hoveredBar = i;
        p.cursor(p.POINTER);
      } else if (hoveredBar === i && !isHover) {
        hoveredBar = null;
        p.cursor(p.ARROW);
      }
      
      let isHighlighted = (selectedNeighborhood === i || hoveredBar === i);
      
      p.fill(colors.text);
      p.noStroke();
      p.textAlign(p.RIGHT, p.CENTER);
      p.textSize(13);
      p.textStyle(isHighlighted ? p.BOLD : p.NORMAL);
      p.text(d.neighborhood, -10, y + barHeight / 2);
      
      let x = 0;
      
      if (showViolent && d.violent > 0) {
        let w = p.map(d.violent, 0, maxValue, 0, chartWidth) * progress;
        p.fill(isHighlighted ? p.lerpColor(p.color(colors.violent), p.color(255), 0.2) : colors.violent);
        p.noStroke();
        p.rect(x, y, w, barHeight, 3);
        x += w;
      }
      
      if (showProperty && d.property > 0) {
        let w = p.map(d.property, 0, maxValue, 0, chartWidth) * progress;
        p.fill(isHighlighted ? p.lerpColor(p.color(colors.property), p.color(255), 0.2) : colors.property);
        p.noStroke();
        p.rect(x, y, w, barHeight, 3);
        x += w;
      }
      
      if (showOther && d.other > 0) {
        let w = p.map(d.other, 0, maxValue, 0, chartWidth) * progress;
        p.fill(isHighlighted ? p.lerpColor(p.color(colors.other), p.color(255), 0.2) : colors.other);
        p.noStroke();
        p.rect(x, y, w, barHeight, 3);
      }
    });
  }

  function drawAxes() {
    let maxValue = p.max(crimeData.map(d => d.total));
    
    p.stroke(colors.textLight);
    p.strokeWeight(2);
    p.line(0, crimeData.length * (barHeight + barPadding) + 10, chartWidth, crimeData.length * (barHeight + barPadding) + 10);
    
    p.fill(colors.textLight);
    p.noStroke();
    p.textAlign(p.CENTER, p.TOP);
    p.textSize(11);
    
    for (let i = 0; i <= 4; i++) {
      let val = (maxValue / 4) * i;
      let x = p.map(val, 0, maxValue, 0, chartWidth);
      p.text(Math.round(val), x, crimeData.length * (barHeight + barPadding) + 20);
      
      p.stroke(colors.textLight);
      p.strokeWeight(1);
      p.drawingContext.setLineDash([2, 4]);
      p.line(x, 0, x, crimeData.length * (barHeight + barPadding));
      p.drawingContext.setLineDash([]);
    }
    
    p.fill(colors.text);
    p.textStyle(p.BOLD);
    p.textSize(13);
    p.text('Number of Reported Crimes', chartWidth / 2, crimeData.length * (barHeight + barPadding) + 45);
  }

  function drawTooltip() {
    if (hoveredBar === null) return;
    
    let d = crimeData[hoveredBar];
    
    let violentPct = ((d.violent / d.total) * 100).toFixed(1);
    let propertyPct = ((d.property / d.total) * 100).toFixed(1);
    let otherPct = ((d.other / d.total) * 100).toFixed(1);
    
    let lines = [
      d.neighborhood,
      `Total: ${d.total} crimes`,
      '',
      `Violent: ${d.violent} (${violentPct}%)`,
      `Property: ${d.property} (${propertyPct}%)`,
      `Other: ${d.other} (${otherPct}%)`
    ];
    
    p.textSize(13);
    let maxWidth = 0;
    lines.forEach(line => {
      maxWidth = p.max(maxWidth, p.textWidth(line));
    });
    
    let tooltipWidth = maxWidth + 30;
    let tooltipHeight = lines.length * 20 + 20;
    let tooltipX = p.mouseX + 20;
    let tooltipY = p.mouseY - tooltipHeight / 2;
    
    if (tooltipX + tooltipWidth > p.width - 20) {
      tooltipX = p.mouseX - tooltipWidth - 20;
    }
    if (tooltipY < 20) tooltipY = 20;
    if (tooltipY + tooltipHeight > p.height - 20) tooltipY = p.height - tooltipHeight - 20;
    
    p.fill(255);
    p.stroke(colors.text);
    p.strokeWeight(2);
    p.rect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 8);
    
    p.fill(colors.text);
    p.noStroke();
    p.textAlign(p.LEFT, p.TOP);
    lines.forEach((line, i) => {
      if (i === 0) {
        p.textStyle(p.BOLD);
        p.textSize(14);
      } else {
        p.textStyle(p.NORMAL);
        p.textSize(12);
      }
      p.text(line, tooltipX + 15, tooltipY + 15 + i * 20);
    });
  }

  function drawFooter() {
    p.fill(colors.textLight);
    p.noStroke();
    p.textAlign(p.CENTER);
    p.textSize(11);
    p.textStyle(p.NORMAL);
    p.text('Data: Seattle Police Department Crime Data (Dec 2025) | Visualization: INFO 474 HWK 5', p.width / 2, p.height - 20);
  }

  p.mousePressed = function() {
    const buttonWidth = 140;
    const buttonHeight = 35;
    const buttonSpacing = 15;
    const startX = p.width / 2 - (buttonWidth * 3 + buttonSpacing * 2) / 2;
    const startY = margin.top - 50;
    
    if (p.mouseX > startX && p.mouseX < startX + buttonWidth && 
        p.mouseY > startY && p.mouseY < startY + buttonHeight) {
      showViolent = !showViolent;
      animProgress = Math.max(0, animDuration - 30);
    }
    
    let propX = startX + buttonWidth + buttonSpacing;
    if (p.mouseX > propX && p.mouseX < propX + buttonWidth && 
        p.mouseY > startY && p.mouseY < startY + buttonHeight) {
      showProperty = !showProperty;
      animProgress = Math.max(0, animDuration - 30);
    }
    
    let otherX = startX + (buttonWidth + buttonSpacing) * 2;
    if (p.mouseX > otherX && p.mouseX < otherX + buttonWidth && 
        p.mouseY > startY && p.mouseY < startY + buttonHeight) {
      showOther = !showOther;
      animProgress = Math.max(0, animDuration - 30);
    }
    
    if (hoveredBar !== null) {
      selectedNeighborhood = selectedNeighborhood === hoveredBar ? null : hoveredBar;
    }
  };

  p.mouseMoved = function() {
    p.cursor(p.ARROW);
    hoveredBar = null;
  };

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }
});