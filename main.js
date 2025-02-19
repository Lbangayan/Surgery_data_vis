import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

// Create form container
const formContainer = d3.select("body").append("div").attr("class", "form-container");

const form = formContainer.append("form");

// Define bin categories
const heightBins = ['All', '0-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80-89', '90-99', '100-109', '110-119', '120-129', '130-139', '140-149', '150-159', '160-169', '170-179', '180-189', '190-199', '200-209'];
const ageBins = ['All', '0-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80-89', '90-99', '100+'];
const weightBins = ['All', '0-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80-89', '90-99', '100+'];
const operationTypes = ['All', 'Colorectal', 'Stomach', 'Biliary/Pancreas', 'Vascular', 'Major resection', 'Breast', 'Minor resection', 'Transplantation', 'Hepatic', 'Thyroid', 'Others'];

// Function to create dropdown
function createDropdown(label, id, options) {
    form.append('label').text(`${label}: `);
    form.append('select').attr('id', id)
        .selectAll('option')
        .data(options)
        .enter().append('option').text(d => d);
    form.append('br');
}

// Create dropdowns
createDropdown("Height", "height", heightBins);
createDropdown("Weight", "weight", weightBins);
createDropdown("Age", "age", ageBins);
createDropdown("Sex", "sex", ['M', 'F']);
createDropdown("Operation Type", "optype", operationTypes);

// Create submit button
form.append('button').text('Submit').on('click', function (event) {
    event.preventDefault();
    updateDashboard();
});

// Load data
d3.json('health_data').then(data => {
    console.log('Loaded Data:', data);
    if (!data || data.length === 0) {
        console.error('No data loaded or data is empty');
        return;
    }
    window.data = data;
}).catch(error => {
    console.error('Error loading the data', error);
});

function updateDashboard() {
    // Remove old charts
    d3.select("#charts-container").remove();

    // Read input values
    const heightRange = d3.select('#height').property('value');
    const weightRange = d3.select('#weight').property('value');
    const ageRange = d3.select('#age').property('value');
    const sex = d3.select('#sex').property('value');
    const opType = d3.select('#optype').property('value');

    // Parse range values
    const [heightMin, heightMax] = heightRange === 'All' ? [null, null] : heightRange === '100+' ? [100, Infinity] : heightRange.split('-').map(parseFloat);
    const [weightMin, weightMax] = weightRange === 'All' ? [null, null] : weightRange === '200+' ? [200, Infinity] : weightRange.split('-').map(parseFloat);
    const [ageMin, ageMax] = ageRange === 'All' ? [null, null] : ageRange === '100+' ? [100, Infinity] : ageRange.split('-').map(parseFloat);

    // Filter data
    const filteredData = window.data.filter(d => {
        const heightMatch = heightRange === 'All' || (d.height >= heightMin && d.height <= heightMax);
        const weightMatch = weightRange === 'All' || (d.weight >= weightMin && d.weight <= weightMax);
        const ageMatch = ageRange === 'All' || (d.age >= ageMin && d.age <= ageMax);
        const sexMatch = sex === 'All' || d.sex === sex;


        return heightMatch && weightMatch && ageMatch && sexMatch;
    });


    console.log('Filtered Data:', filteredData);

    // Create new chart container
    const chartsContainer = d3.select("body").append("div").attr("id", "charts-container").attr("class", "chart-container");

    // Compute statistics
    const meanDis = d3.mean(window.data, d => d.dis / 86400);
    const totalPatients = filteredData.length;
    const totalDeaths = filteredData.filter(d => d.death_inhosp === 1).length;
    const survivalRate = ((totalPatients - totalDeaths) / totalPatients) * 100;
    const mortalityRate = (totalDeaths / totalPatients) * 100;

    createMortalitySummary(chartsContainer, survivalRate, mortalityRate);

    createHistogram(chartsContainer, filteredData, "Hospital Stay (Days)", "dis", meanDis, "red");


    console.log("Dashboard updated");
}

// Function to create histogram
function createHistogram(parentDiv, data, yLabel, key, meanValue, meanColor) {
    const width = 600, height = 400, margin = { top: 20, right: 20, bottom: 40, left: 60 };

    // Convert `dis` values to days
    data.forEach(d => d[key] = d[key] / 86400); // Convert from seconds to days

    // Create an SVG element inside the container
    const svg = parentDiv.append("svg").attr("class", "histogram").attr("width", width).attr("height", height);

    // Generate histogram bins (using days instead of seconds)
    const binGenerator = d3.histogram()
        .domain([0, d3.max(data, d => d[key])]) // X-axis range in days
        .thresholds(10) // Number of bins
        .value(d => d[key]);

    const bins = binGenerator(data);

    // Define scales using days
    const xScale = d3.scaleLinear()
        .domain([0, d3.max(data, d => d[key])]) // Days instead of seconds
        .range([margin.left, width - margin.right]);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)])
        .range([height - margin.bottom, margin.top]);

    // X-Axis (formatted to show days)
    svg.append("g")
        .attr("transform", `translate(0,${height - margin.bottom})`)
        .call(d3.axisBottom(xScale).ticks(10).tickFormat(d => `${d} days`)); // ✅ Add days label

    // ✅ Add X-Axis Label (Hospital Stay in Days)
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height - 10) // Position below axis
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Hospital Stay (Days)");

    // Y-Axis
    svg.append("g")
        .attr("transform", `translate(${margin.left},0)`)
        .call(d3.axisLeft(yScale));

    // ✅ Add Y-Axis Label (Number of Patients)
    svg.append("text")
        .attr("transform", "rotate(-90)") // Rotate text for Y-axis
        .attr("x", -height / 2) // Move to middle of Y-axis
        .attr("y", margin.left - 50) // Adjust position from axis
        .attr("fill", "black")
        .style("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Number of Patients");

    // Add histogram bars
    svg.selectAll("rect")
        .data(bins)
        .enter().append("rect")
        .attr("x", d => xScale(d.x0))
        .attr("y", d => yScale(d.length))
        .attr("width", d => xScale(d.x1) - xScale(d.x0) - 1)
        .attr("height", d => height - margin.bottom - yScale(d.length))
        .attr("fill", "steelblue")
        .attr("opacity", 0.7);

    // ✅ Mean line (converted to days)
    if (!isNaN(meanValue)) {
        const meanInDays = meanValue / 86400; // Convert from seconds to days

        svg.append("line")
            .attr("x1", xScale(meanInDays))
            .attr("x2", xScale(meanInDays))
            .attr("y1", margin.top)
            .attr("y2", height - margin.bottom)
            .attr("stroke", meanColor)
            .attr("stroke-dasharray", "4 4")
            .attr("stroke-width", 2);

        svg.append("text")
            .attr("x", xScale(meanInDays) + 5)
            .attr("y", margin.top + 10)
            .attr("fill", meanColor)
            .style("font-size", "12px")
            .text(`Mean: ${meanInDays.toFixed(1)} days`); // ✅ Display mean in days
    }
}


// Function to display mortality summary
function createMortalitySummary(parentDiv, survivalRate, mortalityRate) {
    const summaryDiv = parentDiv.append("div").attr("class", "chart-container").style("padding", "20px");

    summaryDiv.append("h3").text("Mortality Summary");
    summaryDiv.append("p").style("font-size", "18px").style("font-weight", "bold").text(`Survival Rate: ${survivalRate.toFixed(2)}%`);
    summaryDiv.append("p").style("font-size", "18px").style("font-weight", "bold").text(`Mortality Rate: ${mortalityRate.toFixed(2)}%`);
}
