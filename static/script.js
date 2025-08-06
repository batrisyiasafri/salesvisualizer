console.log("script.js loaded");

document.addEventListener("DOMContentLoaded", function () {
  console.log("DOM loaded");

  // file input
  const fileInput = document.getElementById('csvFile');
  const fileNameSpan = document.getElementById('fileName');

  if (fileInput && fileNameSpan) {
    fileInput.addEventListener('change', function () {
      console.log("File changed");
      fileNameSpan.textContent = fileInput.files.length > 0
        ? `Selected: ${fileInput.files[0].name}`
        : "No file chosen";
    });
  } else {
    console.warn("fileInput or fileNameSpan not found, skipping file input setup.");
  }

  // reset form on clear
  document.getElementById('clearBtn')?.addEventListener('click', () => {
    location.href = "/";
  });

  const clearForm = document.querySelector('form[action="/clear"]');
  if (clearForm) {
    clearForm.addEventListener("submit", function () {
      const fileInputToClear = document.getElementById('csvFile');
      const fileNameSpan = document.getElementById('fileName')
      // const fileInputToClear = document.querySelector('input[type="file"]');
      if (fileInputToClear) fileInputToClear.value = "";
      if (fileNameSpan) fileNameSpan.textContent = "No file chosen";
    });
  }

  // chart setup
  const canvas = document.getElementById("salesChart");
  if (!canvas) {
    console.warn("Canvas with id 'salesChart' not found, skipping chart setup.");
    return;
  }

  const ctx = canvas.getContext("2d");
  const labels = window.chartDataFromServer?.labels || [];
  const chartData = window.chartDataFromServer?.data || [];

  let chartInstance = null;
  let currentChartType = 'bar';

  function generateColors(count, opacity = 1) {
    const baseColors = [
      [52, 152, 219], 
      [46, 204, 113], 
      [231, 76, 60],
      [241, 196, 15], 
      [155, 89, 182], 
      [230, 126, 34],
      [26, 188, 156], 
      [149, 165, 166], 
      [243, 156, 18],
       [192, 57, 43]
    ];
    return Array.from({ length: count }, (_, i) => {
      const [r, g, b] = baseColors[i % baseColors.length];
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    });
  }

  function drawChart(type) {
    if (chartInstance) chartInstance.destroy();

    chartInstance = new Chart(ctx, {
      type: type,
      data: {
        labels: labels,
        datasets: [{
          label: 'Total Sales',
          data: chartData,
          backgroundColor: generateColors(chartData.length, 0.6),
          borderColor: generateColors(chartData.length, 1),
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: type === 'pie' ? {} : {
          y: {
            beginAtZero: true,
            ticks: {
              callback: value => `$${value.toFixed(2)}`
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: context => {
                const val = context.parsed.y ?? context.parsed;
                return `$${val.toFixed(2)}`;
              }
            }
          }
        }
      }
    });
  }

  if (labels.length && chartData.length) {
    drawChart(currentChartType);
  } else {
    console.warn("No chart data found to render.");
  }

  const chartTypeSelect = document.getElementById('chartType');
  const chartTypeInput = document.getElementById('chartTypeInput');

  if (chartTypeSelect && chartTypeInput) {
    chartTypeSelect.addEventListener('change', e => {
      currentChartType = e.target.value;
      chartTypeInput.value = currentChartType;
      drawChart(currentChartType);
    });
  } else {
    console.warn("Chart type selector not found.");
  }

  // onboarding
  const onboardingOverlay = document.getElementById('onboardingOverlay');
  const nextStepBtn = document.getElementById('nextStepBtn');

  if (onboardingOverlay && nextStepBtn) {
    if (!localStorage.getItem('seenOnboarding')) {
      onboardingOverlay.style.display = 'flex';
    }
    nextStepBtn.addEventListener('click', () => {
      onboardingOverlay.style.display = 'none';
      localStorage.setItem('seenOnboarding', 'true');
    });
  }

  // export chart to PDF
  const pdfForm = document.getElementById('pdfForm');
  const chartImageInput = document.getElementById('chartImageInput');

  if (pdfForm && chartImageInput) {
    pdfForm.addEventListener('submit', function (e) {
      try {
        const base64Image = chartInstance.toBase64Image();
        chartImageInput.value = base64Image;
        if (chartTypeInput) {
          chartTypeInput.value = chartInstance.config.type;
        }
      } catch (err) {
        e.preventDefault();
        alert("Failed to generate chart image");
        console.error(err);
      }
    });
  }
});
