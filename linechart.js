async function drawLineChart(countyData) {
    //1. Load your Dataset
    d3.select("#line-chart").remove();
    // need to select the map version -> county -> filter by date
    // const dataset = await d3.csv("Book1.csv");
    const dataset = countyData;
    // console.log("drawLineChart", "dataset:", dataset);

    //Check the sample values available in the dataset
    //console.table(dataset[0]);

    const yAccessor = (d) => d.value;
    const dateParser = d3.timeParse("%Y-%m-%d");
    const xAccessor = (d) => dateParser(d.date);

    //Check the value of xAccessor function now
    // console.log(xAccessor(dataset[0]));

    // 2. Create a chart dimension by defining the size of the Wrapper and Margin
    // console.log("drawLineChart", "svg", svg)

    let dimensions = {
        width: 450,
        height: 300,
        margin: {
        top: 55,
        right: 10,
        bottom: 60,
        left: 60,
    },
    };
    dimensions.boundedWidth =
        dimensions.width - dimensions.margin.left - dimensions.margin.right;
    dimensions.boundedHeight =
        dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

    // 3. Draw Canvas
    const wrapper = d3
        .select(".viz")
        .append("svg")
        .attr("id", "line-chart")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr(
            "viewBox",
            `${0} ${0} ${dimensions.width} ${dimensions.height}`
        );

    //Log our new Wrapper Variable to the console to see what it looks like
    //console.log(wrapper);

    // 4. Create a Bounding Box
    const bounds = wrapper
        .append("g")
        .attr("width", dimensions.boundedWidth)
        .attr("height", dimensions.boundedHeight)
        .attr("transform", `translate(${dimensions.margin.left},${dimensions.margin.top})`);

    // 5. Define Domain and Range for Scales
    const yScale = d3
        .scaleLinear()
        .domain(d3.extent(dataset.flat(), yAccessor))
        .range([dimensions.boundedHeight, 0]);

    const xScale = d3
        .scaleTime()
        .domain(d3.extent(dataset.flat(), xAccessor))
        .range([0, dimensions.boundedWidth]);

    //6. Convert a datapoints into X and Y value
    const lineGenerator = d3
        .line()
        .x((d) => xScale(xAccessor(d)))
        .y((d) => yScale(yAccessor(d)))
        .curve(d3.curveBasis);

    // 7. Convert X and Y into Path
    dataset.forEach((ds) => {
        const line = bounds
            .append("path")
            .attr("d", lineGenerator(ds))
            .attr("fill", "none")
            .attr("stroke", "Red")
            .attr("stroke-width", 2);
    });

    //8. Create X axis and Y axis
    // Generate Y Axis
    const yAxisGenerator = d3.axisLeft().scale(yScale);
    const yAxis = bounds.append("g").call(yAxisGenerator);

    // Generate X Axis
    const xAxisGenerator = d3.axisBottom().scale(xScale);
    const xAxis = bounds
        .append("g")
        .call(xAxisGenerator.tickFormat(d3.timeFormat("%Y-%m-%d")))
        .style("transform", `translateY(${dimensions.boundedHeight}px)`)
        .selectAll("text")
        .attr("dx", `-.05em`)
        .attr("dy", `.20em`)
        .attr("transform", `translate(${-5},${20}) rotate(-45)`);

    //9. Add a Chart Header
    wrapper
        .append("g")
        .style("transform", `translate(${50}px,${15}px)`)
        .append("text")
        .attr("class", "title")
        .attr("x", dimensions.width / 2.2)
        .attr("y", dimensions.margin.top / 10)
        .attr("text-anchor", "middle")
        .text("Historical Housing Prices (in USD)")
        .style("font-size", "15px")
        .style("text-decoration", "underline");
    }
