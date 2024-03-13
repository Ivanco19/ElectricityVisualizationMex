// Read CSV file
var rawDataURL = '../electric_generation_cenace_2018-2023.json'

// Global variable to store all original data
let datos = []

// Global variable to store filtered data
let datosFiltrados = []

// Create a list to customize colors chart visualization
let colores = ['#343a40', '#198754', '#0d6efd', '#e83e8c', '#dc3545', '#6c757d', '#ffc107', '#fd7e14', 
'#20c997', '#6610f2', '#87ceeb'] 

// This function plots a time series chart with energy generation historical data
function timeSeriesChart(dates, totalEnergy){
    
    // Chart set up
    var trace1 = {
        type: "scatter",
        mode: "lines",
        x: dates,
        y: totalEnergy,
        line: { color: '#0d6efd' }
    }
    var data1 = [trace1]

    var layout1 = {
        xaxis: {
            autorange: true,
            // Transforms date format to MM/DD/AAAA
            range: [dates[0].toISOString(), dates[dates.length - 1].toISOString()],
            rangeselector: {
                buttons: [
                    {
                        count: 1,
                        label: '1m',
                        step: 'month',
                        stepmode: 'backward'
                    },
                    {
                        count: 3,
                        label: '3m',
                        step: 'month',
                        stepmode: 'backward'
                    },
                    {
                        count: 6,
                        label: '6m',
                        step: 'month',
                        stepmode: 'backward'
                    },
                    {
                        count: 1,
                        label: '1y',
                        step: 'year',
                        stepmode: 'backward'
                    },
                    {
                        count: 2,
                        label: '2y',
                        step: 'year',
                        stepmode: 'backward'
                    },
                    { step: 'all' }
                ]
            },
            rangeslider: {
                range: [dates[0].toISOString(), dates[dates.length - 1].toISOString()]
            },
            type: 'date'
        },
        yaxis: {
            autorange: true,
            range: [0, d3.max(totalEnergy)],
            type: 'linear'
        },
        height: 500,
        width: 1100,
        plot_bgcolor: '#e9ecef',
        paper_bgcolor: '#e9ecef',
        margin: {"t": 0, "b": 50, "l": 60, "r": 60}
    }
    
    // Creates the new plot using data1 and layout1 settings
    Plotly.newPlot('timeSeriesChart', data1, layout1)
}

// This function creates a bar chart to visualize energy produced by year
function barChart(generationByYear){
    // Chart set up
    var trace2 = {
        type: "bar",
        x: Object.keys(generationByYear),
        y: Object.values(generationByYear),
        marker: { color: '#0d6efd' }
    }

    var data2 = [trace2];

    var layout2 = { 
        yaxis: {
            title: 'Energy produced (MWh)'
        },
        plot_bgcolor: '#e9ecef',
        paper_bgcolor: '#e9ecef',
        height: 300,
        width: 460,
        margin: {"t": 10, "b": 20, "l": 50, "r": 0}
    }

    // Creates the new plot using data2 and layout2 settings
    Plotly.newPlot('barChart', data2, layout2)
}

// This function creates a pie chart to visualize energy produced by technology by year
function pieChart(generationByTechnology){

    // By default we'll consider sum of all energies produced from 2018-2023
    if (yearSelected === '2018-2023') {
        // Get sum of energy produced by technology from 2018-2023
        technologies = Object.keys(generationByTechnology['2018']);  // Take 2018 as a reference
        values = technologies.map(fuente => {
            return Object.keys(generationByTechnology).reduce((total, year) => total + 
            generationByTechnology[year][fuente], 0);
        });
    } else {
        // Get energy produced by technology in the year selected
        technologies = Object.keys(generationByTechnology[yearSelected]);
        values = Object.values(generationByTechnology[yearSelected]);
    }

    var data3 = [{
        type: "pie",
        values: values,
        labels: technologies,
        marker: {
            colors: colores,  
        },
    }]
      
    var layout3 = {
        paper_bgcolor: '#e9ecef',
        height: 350,
        width: 500,
        margin: {"t": 20, "b": 30, "l": 10, "r": 10},
    }
      
    Plotly.newPlot('pieChart', data3, layout3)

}

// This function creates a pie chart to visualize energy produced by technology throughout the years
function scatterChart(generationByTechnology){
    
    // Lista de fuentes de generación
    const fuentes = Object.keys(generationByTechnology['2018']);  // Take 2018 as a reference

    // Array para almacenar los traces
    const traces = [];

    // Iterar sobre cada fuente y crear el trace correspondiente
    fuentes.forEach((fuente, index) => {
        const trace = {
            type: 'scatter',
            x: Object.keys(generationByTechnology),
            y: Object.keys(generationByTechnology).map(anio => generationByTechnology[anio][fuente]),
            name: fuente,
            line: {
                color: colores[index % colores.length],  // Uso del índice y módulo para iterar por los colores
            },
        };

    // Agregar el trace al array
    traces.push(trace);
    });

    // Crear el objeto de datos
    const data = traces;

    var layout4 = {
        plot_bgcolor: '#e9ecef',
        paper_bgcolor: '#e9ecef',
        height: 400,
        width: 1100,
        margin: {"t": 20, "b": 30, "l": 60, "r": 40},
        showlegend: true
    }
    
    // Creates the new plot using data and layout settings
    Plotly.newPlot('scatterChart', data, layout4)
}

// This function prepares data for visualization
function cargarDatos(){

    // 1. DATA PREPARATION FOR BAR VISUALIZATION
    // Groups energy produced by year
    const totalGenerationByYear = d3.rollup(
        datosFiltrados,
        values => d3.sum(values, d => (
        d.Biomasa + d.Carboelectrica + d.CicloCombinado + d.CombustionInterna +
        d.Eolica + d.Fotovoltaica + d.Geotermoelectrica + d.Hidroelectrica +
        d.TurboGas + d.Nucleoelectrica + d.TermicaConvencional
        )),
        d => d.Dia.getFullYear()
    );

    // Transform to an object type
    const generationByYear = Object.fromEntries(totalGenerationByYear);

    // 2. DATA PREPARATION FOR SCATTER AND PIE CHARTS VISUALIZATION
    // Groups energy produced by year
    const totalGenerationByTechnology = d3.rollup(
        datosFiltrados,
        (values) => ({
            Biomasa: d3.sum(values, d => d.Biomasa),
            Carboelectrica: d3.sum(values, d => d.Carboelectrica),
            CicloCombinado: d3.sum(values, d => d.CicloCombinado),
            CombustionInterna: d3.sum(values, d => d.CombustionInterna),
            Eolica: d3.sum(values, d => d.Eolica),
            Fotovoltaica: d3.sum(values, d => d.Fotovoltaica),
            Geotermoelectrica: d3.sum(values, d => d.Geotermoelectrica),
            Hidroelectrica: d3.sum(values, d => d.Hidroelectrica),
            TurboGas: d3.sum(values, d => d.TurboGas),
            Nucleoelectrica: d3.sum(values, d => d.Nucleoelectrica),
            TermicaConvencional: d3.sum(values, d => d.TermicaConvencional)
        }),
        d => d.Dia.getFullYear()
    );

    // Transform to an object type
    const generationByTechnology = Object.fromEntries(totalGenerationByTechnology);

    // 3. DATA PREPARATION FOR TIME SERIES VISUALIZATION
    // Groups energy produced per hour
    const generationPerHour = d3.rollup(
        datosFiltrados,
        values => d3.sum(values, d => (
            d.Biomasa + d.Carboelectrica + d.CicloCombinado + d.CombustionInterna +
            d.Eolica + d.Fotovoltaica + d.Geotermoelectrica + d.Hidroelectrica +
            d.TurboGas + d.Nucleoelectrica + d.TermicaConvencional
            )),
        d => d.Fecha
    );

    // Arrays to store dates and total energy values
    const dates = [];
    const totalEnergy = [];

    // Iterate over the entries of generacionPorHora
    for (const [date, value] of generationPerHour) {
    // Add the date and total energy to the arrays
    dates.push(date);
    totalEnergy.push(value); 
    }

    // CREATES VISUALIZATIONS
    barChart(generationByYear)
    pieChart(generationByTechnology)
    scatterChart(generationByTechnology)
    timeSeriesChart(dates, totalEnergy)
}

// This function filters data according to user selection
function actualizarDatos(){
    
    yearSelected = document.getElementById('userSelection').value
    
    if (yearSelected === '2018-2023') {
        datosFiltrados = datos;
    } else {
        datosFiltrados = datos.filter((d) => d.Dia.getFullYear() == yearSelected);
    }

    cargarDatos()
}

// Read csv file using D3
d3.json(rawDataURL).then((data) => {
    
    // assign data from csv file to a variable so we can make it global
    datos = data
    
    // Transform date column to a new date object. Parse technologies info to float type
    datos.forEach((d) => {

        const [dia, mes, año] = d.Dia.split('/')
        const fechaFormatoCorrecto = `${mes}/${dia}/${año}`
        d.Fecha = new Date(año, mes - 1, dia, d.Hora, 0, 0);

        d.Dia = new Date(fechaFormatoCorrecto)
        d.Hora = parseFloat(d.Hora)
        d.Biomasa = parseFloat(d.Biomasa)
        d.Carboelectrica = parseFloat(d.Carboelectrica)
        d.CicloCombinado = parseFloat(d.CicloCombinado)
        d.CombustionInterna = parseFloat(d.CombustionInterna)
        d.Eolica = parseFloat(d.Eolica)
        d.Fotovoltaica = parseFloat(d.Fotovoltaica)
        d.Geotermoelectrica = parseFloat(d.Geotermoelectrica)
        d.Hidroelectrica = parseFloat(d.Hidroelectrica)
        d.TurboGas = parseFloat(d.TurboGas)
        d.Nucleoelectrica = parseFloat(d.Nucleoelectrica)
        d.TermicaConvencional = parseFloat(d.TermicaConvencional)

    })
    
    //Initialize plots visualizations
    actualizarDatos()
});