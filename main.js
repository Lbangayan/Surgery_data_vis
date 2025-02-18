import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

const form = d3.select('body').append('form');

const heightBins = ['0-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80-89', '90-99', '100-109', '110-119', '120-129', '130-139', '140-149', '150-159', '160-169', '170-179','180-189','190-199','200-209'];
const ageBins = ['0-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80-89', '90-99', '100+'];

const weightBins = ['0-9', '10-19', '20-29', '30-39', '40-49', '50-59', '60-69', '70-79', '80-89', '90-99', '100+'];



form.append('label').text('Height: ');
form.append('select').attr('id', 'height').attr('name', 'height')
    .selectAll('option')
    .data(heightBins)
    .enter()
    .append('option')
    .text(d => d);
form.append('br');

form.append('label').text('Weight: ');
form.append('select').attr('id', 'weight').attr('name', 'weight')
    .selectAll('option')
    .data(weightBins)
    .enter()
    .append('option')
    .text(d => d);
form.append('br');

form.append('label').text('Age: ');
form.append('select').attr('id', 'age').attr('name', 'age')
    .selectAll('option')
    .data(ageBins)
    .enter()
    .append('option')
    .text(d => d);
form.append('br');

form.append('label').text('Sex: ');
form.append('select').attr('id', 'sex').attr('name', 'sex')
    .selectAll('option')
    .data(['M', 'F'])
    .enter()
    .append('option')
    .text(d => d);
form.append('br');

form.append('button').text('Submit').on('click', function(event) {
    event.preventDefault();
    updateDashboard();
});

d3.json('health_data').then(data => {
    console.log('Loaded Data:', data);
    if (!data || data.length === 0) {
        console.error('No data loaded or data is empty');
        return;
    }
    window.data = data;
    displayDataInTable(data);
}).catch(error => {
    console.error('Error loading the data', error);
});

function updateDashboard() {
    const heightRange = d3.select('#height').property('value');
    const weightRange = d3.select('#weight').property('value');
    const ageRange = d3.select('#age').property('value');
    const sex = d3.select('#sex').property('value');

    console.log('Selected Filters:', { heightRange, weightRange, ageRange, sex });

    const [heightMin, heightMax] = heightRange === '100+' ? [100, Infinity] : heightRange.split('-').map(parseFloat);
    const [weightMin, weightMax] = weightRange === '200+' ? [200, Infinity] : weightRange.split('-').map(parseFloat);
    const [ageMin, ageMax] = ageRange === '100+' ? [100, Infinity] : ageRange.split('-').map(parseFloat);

    console.log('Parsed Ranges:', { heightMin, heightMax, weightMin, weightMax, ageMin, ageMax });

    const filteredData = window.data.filter(d => {
        const heightMatch = !heightRange || (d.height >= heightMin && d.height <= heightMax);
        const weightMatch = !weightRange || (d.weight >= weightMin && d.weight <= weightMax);
        const ageMatch = !ageRange || (d.age >= ageMin && d.age <= ageMax);
        const sexMatch = !sex || d.sex === sex;

        return heightMatch && weightMatch && ageMatch && sexMatch;
    });

    console.log('Filtered Data:', filteredData);

    updateVisualizations(filteredData);
}

function displayDataInTable(data) {
    d3.select('body').select('table').remove();

    const table = d3.select('body').append('table').attr('class', 'data-table');

    const headers = Object.keys(data[0]);
    table.append('thead')
        .append('tr')
        .selectAll('th')
        .data(headers)
        .enter()
        .append('th')
        .text(d => d);

    const rows = table.append('tbody')
        .selectAll('tr')
        .data(data)
        .enter()
        .append('tr');

    rows.selectAll('td')
        .data(d => headers.map(header => d[header]))
        .enter()
        .append('td')
        .text(d => d);
}

function updateVisualizations(data) {
    d3.select('body').select('table').remove();
    displayDataInTable(data);
}