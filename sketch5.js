let crimeData = [];
let rawData;
let hoveredBar = null;
let selectedNeighborhood = null;
let showViolent = true;
let showProperty = true;
let showOther = true;
let dataLoaded = false;

const colors = {
  violent: '#D62828',
  property: '#F77F00',
  other: '#003049',
  background: '#FFFFFF',
  text: '#2B2D42',
  textLight: '#8D99AE',
  hover: '#FFC300'
};

const margin = { top: 120, right: 80, bottom: 60, left: 200 };
let chartWidth, chartHeight;
const barHeight = 28;
const barPadding = 8;
let animProgress = 0;
const animDuration = 60;

function preload() {
  // IMPORTANT: Upload your CSV to the p5 editor sidebar first!
  rawData = loadTable('SPD_Crime_Data__2008-Present_20260128(2).csv', 'csv', 'header');
}

function setup() {
  createCanvas(1080, 1350);
  processData();
  chartWidth = width - margin.left - margin.right;
  chartHeight = height - margin.top - margin.bottom;
  textFont('Arial');
}

function draw() {
  background(colors.background);

  if (!dataLoaded || crimeData.length === 0) {
    fill(colors.text);
    textAlign(CENTER, CENTER);
    textSize(24);
    text('Loading crime data...', width / 2, height / 2);
    return;
  }

  if (animProgress < animDuration) animProgress++;
  let progress = easeOutCubic(animProgress / animDuration);

  drawTitle();
  drawFilters();

  push();
  translate(margin.left, margin.top);
  drawBars(progress);
  drawAxes();
  pop();
  
  if (hoveredBar !== null) {
    drawTooltip();
  }
  
  drawFooter();
}

function processData() {
  let neighborhoodCounts = {};
  for (let i = 0; i < rawData.getRowCount(); i++) {
    let neighborhood = rawData.getString(i, 'Neighborhood');
    let category = rawData.getString(i, 'Offense Category');
    if (!neighborhood || neighborhood === '-') continue;
    if (!neighborhoodCounts[neighborhood]) {
      neighborhoodCounts[neighborhood] = { violent: 0, property: 0, other: 0, total: 0 };
    }
    if (category === 'VIOLENT CRIME') neighborhoodCounts[neighborhood].violent++;
    else if (category === 'PROPERTY CRIME') neighborhoodCounts[neighborhood].property++;
    else neighborhoodCounts[neighborhood].other++;
    neighborhoodCounts[neighborhood].total++;
  }
  crimeData = [];
  for (let neighborhood in neighborhoodCounts) {
    crimeData.push({
      neighborhood: formatNeighborhoodName(neighborhood),
      violent: neighborhoodCounts[neighborhood].violent,
      property: neighborhoodCounts[neighborhood].property,
      other: neighborhoodCounts[neighborhood].other,
      total: neighborhoodCounts[neighborhood].total
    });
  }
  crimeData.sort((a, b) => b.total - a.total);
  crimeData = crimeData.slice(0, 20);
  dataLoaded = true;
}

function formatNeighborhoodName(name) {
  return name.split(' ').map(word => {
    if (word === 'SLU' || (word.length <= 3 && word === word.toUpperCase())) return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
}

function drawTitle() {
  fill(colors.text);
  noStroke();
  textAlign(CENTER);
  textSize(36);
  textStyle(BOLD);
  text('Property Crime Dominates', width / 2, 40);
  textSize(18);
  textStyle(NORMAL);
  fill(colors.textLight);
  text("Seattle's Highest-Crime Neighborhoods", width / 2, 70);
  textSize(14);
  text('December 2025', width / 2, 95);
}

function drawFilters() {
  const buttonWidth = 140;
  const buttonHeight = 35;
  const buttonSpacing = 15;
  const startX = width / 2 - (buttonWidth * 3 + buttonSpacing * 2) / 2;
  const startY = margin.top - 50;
  drawFilterButton('Violent Crime', showViolent, colors.violent, startX, startY, buttonWidth, buttonHeight);
  drawFilterButton('Property Crime', showProperty, colors.property, startX + buttonWidth + buttonSpacing, startY, buttonWidth, buttonHeight);
  drawFilterButton('All Other', showOther, colors.other, startX + (buttonWidth + buttonSpacing) * 2, startY, buttonWidth, buttonHeight);
}

function drawFilterButton(label, isActive, color, x, y, w, h) {
  push();
  const isHover = mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h;
  if (isActive) { fill(color); stroke(color); } 
  else { fill(255); stroke(colors.textLight); }
  strokeWeight(2);
  rect(x, y, w, h, 8);
  fill(isActive ? 255 : colors.textLight);
  noStroke();
  textAlign(CENTER, CENTER);
  textSize(13);
  text(label, x + w / 2, y + h / 2);
  if (isHover) cursor('pointer');
  pop();
}

function drawBars(progress) {
  let maxValue = max(crimeData.map(d => d.total));
  hoveredBar = null; // Reset each frame
  
  crimeData.forEach((d, i) => {
    let y = i * (barHeight + barPadding);
    let currentTotal = 0;
    if (showViolent) currentTotal += d.violent;
    if (showProperty) currentTotal += d.property;
    if (showOther) currentTotal += d.other;
    
    let barWidth = map(currentTotal, 0, maxValue, 0, chartWidth) * progress;
    let isHover = mouseX > margin.left && mouseX < margin.left + barWidth &&
                  mouseY > margin.top + y && mouseY < margin.top + y + barHeight;
    
    if (isHover) hoveredBar = i; cursor('pointer');

    fill(colors.text);
    noStroke();
    textAlign(RIGHT, CENTER);
    textStyle(hoveredBar === i ? BOLD : NORMAL);
    text(d.neighborhood, -10, y + barHeight / 2);

    let x = 0;
    if (showViolent) {
      let w = map(d.violent, 0, maxValue, 0, chartWidth) * progress;
      fill(colors.violent);
      rect(x, y, w, barHeight, 3);
      x += w;
    }
    if (showProperty) {
      let w = map(d.property, 0, maxValue, 0, chartWidth) * progress;
      fill(colors.property);
      rect(x, y, w, barHeight, 3);
      x += w;
    }
    if (showOther) {
      let w = map(d.other, 0, maxValue, 0, chartWidth) * progress;
      fill(colors.other);
      rect(x, y, w, barHeight, 3);
    }
  });
}

function drawAxes() {
  let maxValue = max(crimeData.map(d => d.total));
  stroke(colors.textLight);
  line(0, crimeData.length * (barHeight + barPadding) + 10, chartWidth, crimeData.length * (barHeight + barPadding) + 10);
  
  textAlign(CENTER, TOP);
  noStroke();
  for (let i = 0; i <= 4; i++) {
    let val = (maxValue / 4) * i;
    let x = map(val, 0, maxValue, 0, chartWidth);
    fill(colors.textLight);
    text(Math.round(val), x, crimeData.length * (barHeight + barPadding) + 20);
    stroke(colors.textLight);
    drawingContext.setLineDash([2, 4]);
    line(x, 0, x, crimeData.length * (barHeight + barPadding));
    drawingContext.setLineDash([]);
  }
}

function drawTooltip() {
  if (hoveredBar === null || !crimeData[hoveredBar]) return;
  
  let d = crimeData[hoveredBar];
  let x = mouseX + 15;
  let y = mouseY + 15;

  // Tooltip Background
  fill(255, 250); // White with slight transparency
  stroke(colors.text);
  strokeWeight(1);
  rect(x, y, 180, 100, 5);
  
  // Tooltip Text
  noStroke();
  textAlign(LEFT, TOP);
  fill(colors.text);
  textStyle(BOLD);
  text(d.neighborhood, x + 10, y + 10);
  
  textStyle(NORMAL);
  textSize(12);
  fill(colors.violent);
  text(`• Violent: ${d.violent}`, x + 10, y + 35);
  fill(colors.property);
  text(`• Property: ${d.property}`, x + 10, y + 55);
  fill(colors.other);
  text(`• Other: ${d.other}`, x + 10, y + 75);
}

function drawFooter() {
  fill(colors.textLight);
  textAlign(CENTER);
  text('Data: Seattle Police Dept | INFO 474', width / 2, height - 20);
}

function mousePressed() {
  const buttonWidth = 140;
  const buttonHeight = 35;
  const buttonSpacing = 15;
  const startX = width / 2 - (buttonWidth * 3 + buttonSpacing * 2) / 2;
  const startY = margin.top - 50;

  if (mouseY > startY && mouseY < startY + buttonHeight) {
    if (mouseX > startX && mouseX < startX + buttonWidth) showViolent = !showViolent;
    if (mouseX > startX + buttonWidth + buttonSpacing && mouseX < startX + 2*buttonWidth + buttonSpacing) showProperty = !showProperty;
    if (mouseX > startX + 2*(buttonWidth + buttonSpacing) && mouseX < startX + 3*buttonWidth + 2*buttonSpacing) showOther = !showOther;
    animProgress = 0;
  }
}

function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }