const width = 1200;
const height = 900;


const tooltip = d3.select('body').append('div')
    .attr('class', 'tooltip')
    .style('opacity', 0)
    .style('pointer-events', 'none');

const rightTooltip = d3.select('body').append('div')
    .attr('class', 'right-tooltip')
    .style('opacity', 0)
    .style('position', 'fixed')
    .style('pointer-events', 'none')
    .style('padding', '10px')
    .style('background-color', 'white')
    .style('border', '1px solid #ddd')
    .style('right', '10px')
    .style('top', '960px');

const yearselect = d3.select("#year-slider").style('width', "1200px")
const colorScale = d3.scaleOrdinal()
    .domain(["Category1", "Category2", "Category3", "Category4", "Category5", "Category6"])
    .range(["#1f78b4", "#33a02c", "#e31a1c", "#ff7f00", "#6a3d9a", "#b15928"]);
let svg;
let projection;
let zoom;
let circles;
let filteredData;
let data1;
let currentZoomTransform = d3.zoomIdentity;
let selectedGenderGlobal = "gender"
let selectedCategoryGlobal = "All";
let brush;
let selectedYear
let playButton = d3.select("#play-button1");
let yearSlider = document.querySelector("input[type='range']");
let minYear = 1901;
let maxYear = 2022;
let stepValue = 1;
let animationexecutionflag = 0;
let interval;
let animationselectedyear = 1901;



const mapPromise = new Promise((resolve, reject) => {
    d3.json('map.json').then(function(world) {
        projection = d3.geoMercator()
            .scale(200)
            .translate([width / 2, height / 2]);

        const path = d3.geoPath().projection(projection);


        svg = d3.select('#map-container').append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('id', 'map_vis')


        svg.selectAll('path')
            .data(world.features)
            .enter().append('path')
            .attr('d', path)
            .style('fill', '#ccc')
            .style('stroke', '#fff');

        resolve();
    });
});

mapPromise.then(() => {

    const dataPromise = new Promise((resolve, reject) => {
        d3.csv('test_data.csv').then(function(data) {
            resolve(data);
            data1 = data
            filteredData = data

            data1.forEach(d => {
                const bornDate = new Date(d.Born);
                d.birthYear = bornDate.getFullYear();

            });
            data1.forEach(d => {
                d.ageAtAward = d.Year - d.birthYear;

            });
            const validData = data1.filter(d => !isNaN(d.ageAtAward) && d.ageAtAward >= 0);

            const totalAgeAtAward = validData.reduce((sum, d) => sum + d.ageAtAward, 0);
            const averageAgeAtAward = totalAgeAtAward / data1.length;
            const formattedAverageAge = averageAgeAtAward.toFixed(2);
            console.log("Average Age at Award:", formattedAverageAge);
            document.getElementById("avgAge").innerText = "Average age at Award: " + formattedAverageAge;
            const laureatesByCountry = {};
            validData.forEach(d => {
                const country = d.Borncountry;
                laureatesByCountry[country] = (laureatesByCountry[country] || 0) + 1;
            });


            let maxCountry = "";
            let maxCount = 0;
            for (const country in laureatesByCountry) {
                if (laureatesByCountry[country] > maxCount) {
                    maxCountry = country;
                    maxCount = laureatesByCountry[country];
                }
            }
            document.getElementById("maxcountry").innerText = "Country with Most Nobel Laureates: " + maxCountry + " with Number of Laureates: " + maxCount

            const laureatesByCategory = {};
            validData.forEach(d => {
                const Category = d.Category;
                laureatesByCategory[Category] = (laureatesByCategory[Category] || 0) + 1;
            });
            let maxCategory = "";
            let maxCountCategory = 0;
            for (const Category in laureatesByCategory) {
                if (laureatesByCategory[Category] > maxCountCategory) {
                    maxCategory = Category;
                    maxCountCategory = laureatesByCategory[Category];
                }
            }

            console.log("Category with Most Nobel Laureates:", maxCategory, "Number of Laureates:", maxCountCategory);
            document.getElementById("maxcat").innerText = "Category with Most Nobel Laureates: " + maxCategory + " with Number of Laureates: " + maxCountCategory

        });
    });




    Promise.all([mapPromise, dataPromise]).then(([_, data]) => {

        circles = svg.selectAll('circle')
            .data(filteredData)
            .enter().append('circle')
            .attr('cx', function(d) {
                const coords = projection([d.lng, d.lat]);
                return coords ? coords[0] : 0;
            })
            .attr('cy', function(d) {
                const coords = projection([d.lng, d.lat]);
                return coords ? coords[1] : 0;
            })
            .attr('r', 5)
            .style('fill', function(d) {
                return colorScale(d.Category);
            })
            .style('opacity', 0.5)
            .on('mouseover', function(event, d) {
                d3.select(this).attr('fill', 'black');
                document.getElementById("name").innerHTML = d.Firstname + ' ' + d.Surname;
                document.getElementById("motivation").innerHTML = d.Motivation
                document.getElementById("borncountry").innerHTML = 'Born Country: ' + d.Borncountry
                document.getElementById("borncity").innerHTML = 'Born City: ' + d.Borncity
                document.getElementById("borncountry").innerHTML = 'Born Country: ' + d.Borncountry
                document.getElementById("diedcity").innerHTML = 'Died City: ' + d.Diedcity
                document.getElementById("diedcountry").innerHTML = 'Died Country: ' + d.Diedcountry

                document.getElementById("gender").innerHTML = 'Gender: ' + d.Gender
                document.getElementById("cat").innerHTML = 'Nobel Category: ' + d.Category
                document.getElementById("organization").innerHTML = 'Organization: ' + d.Organizationname
                document.getElementById("organizationcity").innerHTML = 'Organization city: ' + d.Organizationcity

            })
            .on('mouseout', function(d) {
                d3.select(this)
                    .attr('opacity', 0.5).attr('stroke', 'none')

                document.getElementById("name").innerHTML = ''
                document.getElementById("motivation").innerHTML = ''
                document.getElementById("borncountry").innerHTML = ''
                document.getElementById("borncity").innerHTML = ''
                document.getElementById("diedcity").innerHTML = ''
                document.getElementById("diedcountry").innerHTML = ''

                document.getElementById("gender").innerHTML = ''
                document.getElementById("cat").innerHTML = ''
                document.getElementById("organization").innerHTML = ''
                document.getElementById("organizationcity").innerHTML = ''
                document.getElementById("organizationcountry").innerHTML = ''
            });


    })



    function updateData(event) {
        if (event) event.preventDefault();
        const transform = currentZoomTransform;


        svg.selectAll('path').attr('transform', transform);


        const selectedCategory = d3.select('#category-select').node().value;
        const selectedGender = d3.select('#gender-select').node().value;


        console.log('Selected Category:', selectedCategoryGlobal);

        selectedCategoryGlobal = selectedCategory

        let currentData
        if (selectedCategory === "All" && selectedGender === "gender") {
            currentData = data1

        } else if (selectedCategory != "All" && selectedGender === "gender") {
            currentData = data1.filter((d) => d.Category === selectedCategory);

        } else if (selectedCategory === "All" && selectedGender != "gender") {
            currentData = data1.filter((d) => d.Gender === selectedGender);
        } else {
            currentData = data1.filter((d) => d.Category === selectedCategory);
            currentData = currentData.filter((d) => d.Gender === selectedGender);

        }
        if (selectedYear != null) {
            currentData = currentData.filter((d) => d.Year == +selectedYear)
        }
        circles = svg.selectAll('circle')
            .data(currentData, function(d) { return d.Id; });

        circles.exit().remove();

        const enteredCircles = circles.enter().append('circle')
            .attr('r', 5)
            .style('opacity', 0.5)
            .style('fill', function(d) {
                return colorScale(d.Category);
            })
            .on('mouseover', function(event, d) {
                d3.select(this).attr('fill', 'black');
                document.getElementById("name").innerHTML = d.Firstname + ' ' + d.Surname;
                document.getElementById("motivation").innerHTML = d.Motivation
                document.getElementById("borncountry").innerHTML = 'Born Country: ' + d.Borncountry
                document.getElementById("borncity").innerHTML = 'Born City: ' + d.Borncity
                document.getElementById("borncountry").innerHTML = 'Born Country: ' + d.Borncountry
                document.getElementById("diedcity").innerHTML = 'Died City: ' + d.Diedcity
                document.getElementById("diedcountry").innerHTML = 'Died Country: ' + d.Diedcountry

                document.getElementById("gender").innerHTML = 'Gender: ' + d.Gender
                document.getElementById("cat").innerHTML = 'Nobel Category: ' + d.Category
                document.getElementById("organization").innerHTML = 'Organization: ' + d.Organizationname
                document.getElementById("organizationcity").innerHTML = 'Organization city: ' + d.Organizationcity

            })
            .on('mouseout', function(event, d) {
                d3.select(this)
                    .attr('fill', 'red').attr('opacity', 0.5)
                document.getElementById("name").innerHTML = ''
                document.getElementById("motivation").innerHTML = ''
                document.getElementById("borncountry").innerHTML = ''
                document.getElementById("borncity").innerHTML = ''
                document.getElementById("diedcity").innerHTML = ''
                document.getElementById("diedcountry").innerHTML = ''

                document.getElementById("gender").innerHTML = ''
                document.getElementById("cat").innerHTML = ''
                document.getElementById("organization").innerHTML = ''
                document.getElementById("organizationcity").innerHTML = ''
                document.getElementById("organizationcountry").innerHTML = ''

            });

        circles = enteredCircles.merge(circles)
            .attr('cx', function(d) {
                const coords = projection([d.lng, d.lat]);
                return coords ? coords[0] : 0;
            })
            .attr('cy', function(d) {
                const coords = projection([d.lng, d.lat]);
                return coords ? coords[1] : 0;
            })
            .style('fill', function(d) {
                return colorScale(d.Category);
            });
        applyZoomToCircles();


    }


    function updateDataGender(event) {
        if (event) event.preventDefault();
        const transform = currentZoomTransform;

        svg.selectAll('path').attr('transform', transform);


        const selectedGender = d3.select('#gender-select').node().value;
        console.log('Selected Category:', selectedGender);



        selectedGenderGlobal = selectedGender
        let currentData
        if (selectedCategoryGlobal === "All" && selectedGenderGlobal === "gender") {
            currentData = data1
        } else if (selectedGenderGlobal === "gender") {
            currentData = filteredData
        } else {
            currentData = filteredData.filter((d) => d.Gender === selectedGenderGlobal);
        }


        circles = svg.selectAll('circle')
            .data(currentData, function(d) { return d.Id; });

        circles.exit().remove();

        const enteredCircles = circles.enter().append('circle')
            .attr('r', 5)
            .style('fill', 'red')
            .style('opacity', 0.5)
            .on('mouseover', function(event, d) {
                document.getElementById("name").innerHTML = d.Firstname + ' ' + d.Surname;
                document.getElementById("motivation").innerHTML = d.Motivation
                document.getElementById("borncountry").innerHTML = 'Born Country: ' + d.Borncountry
                document.getElementById("borncity").innerHTML = 'Born City: ' + d.Borncity
                document.getElementById("borncountry").innerHTML = 'Born Country: ' + d.Borncountry
                document.getElementById("diedcity").innerHTML = 'Died City: ' + d.Diedcity
                document.getElementById("diedcountry").innerHTML = 'Died Country: ' + d.Diedcountry

                document.getElementById("gender").innerHTML = 'Gender: ' + d.Gender
                document.getElementById("cat").innerHTML = 'Nobel Category: ' + d.Category
                document.getElementById("organization").innerHTML = 'Organization: ' + d.Organizationname
                document.getElementById("organizationcity").innerHTML = 'Organization city: ' + d.Organizationcity


            })
            .on('mouseout', function(event, d) {
                document.getElementById("name").innerHTML = ''
                document.getElementById("motivation").innerHTML = ''
                document.getElementById("borncountry").innerHTML = ''
                document.getElementById("borncity").innerHTML = ''
                document.getElementById("diedcity").innerHTML = ''
                document.getElementById("diedcountry").innerHTML = ''

                document.getElementById("gender").innerHTML = ''
                document.getElementById("cat").innerHTML = ''
                document.getElementById("organization").innerHTML = ''
                document.getElementById("organizationcity").innerHTML = ''
                document.getElementById("organizationcountry").innerHTML = ''

            });

        circles = enteredCircles.merge(circles)
            .attr('cx', function(d) {
                const coords = projection([d.lng, d.lat]);
                return coords ? coords[0] : 0;
            })
            .attr('cy', function(d) {
                const coords = projection([d.lng, d.lat]);
                return coords ? coords[1] : 0;
            });
        applyZoomToCircles();


    }

    d3.select('#category-select').on('change', function() {
        updateData(d3.event);
    });
    d3.select('#gender-select').on('change', function() {
        updateData(d3.event);
    });
    d3.select("#year-slider").on("change", function() {
        selectedYear = this.value
        d3.select("#selected-year").text("Selected Year: " + selectedYear);
        updateData(d3.event);
    });
    d3.select("#play-button1").on("click", function() {
        playAnimation();
    });
    var resetbutton = document.getElementById('reset')
    resetbutton.addEventListener("click", function() {
        selectedYear = null;
        d3.select('#category-select').value = 'All';
        d3.select('#gender-select').value = 'gender';
        d3.select("#selected-year").text("Selected Year: No year selected");
        updateData();
        clearInterval(interval);
        animationexecutionflag = 0;
        playButton.attr("disabled", True);
    });

    function playAnimation() {
        console.log("executing animation")
        console.log(animationexecutionflag)
        if (animationexecutionflag == 1) {
            clearInterval(interval);
            animationexecutionflag = 0;
            playButton.attr("disabled", True);
        } else {
            animationexecutionflag = 1;

            playButton.attr("disabled", true);
            selectedYear = animationselectedyear
            console.log(animationselectedyear)

            interval = setInterval(function() {

                selectedYear = selectedYear + stepValue;

                animationselectedyear = selectedYear
                d3.select("#selected-year").text("Selected Year: " + selectedYear);


                updateData();


                if (selectedYear > maxYear) {

                    playButton.attr("disabled", null);
                    clearInterval(interval);
                    animationexecutionflag = 0;
                    animationselectedyear = 1901
                }
            }, 500);
        }
    }
    zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on('zoom', zoomed);

    function applyZoomToCircles() {
        circles.attr('transform', d => `translate(${currentZoomTransform.x},${currentZoomTransform.y}) scale(${currentZoomTransform.k})`).attr('r', d => 5 / currentZoomTransform.k);
    }

    function zoomed(event) {

        currentZoomTransform = event.transform;


        svg.selectAll('path').attr('transform', currentZoomTransform);
        applyZoomToCircles();


    }
    svg.call(zoom);

});