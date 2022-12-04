var LC_xScale, LC_yScale, dimensions, LC_xAccessor, LC_yAccessor, LC_dateParser;

async function drawLineChart(countyData) {
    //1. Load your Dataset
    d3.select("#line-chart").remove();
    // need to select the map version -> county -> filter by date
    // const dataset = await d3.csv("Book1.csv");
    // const dataset = countyData.map(l => l.filter(o => o.value > 0));
    const data_only = countyData.map(l => l.data.actual);
    // console.log("drawLineChart", "dataset:", dataset);

    //Check the sample values available in the dataset
    //console.table(dataset[0]);

    LC_yAccessor = (d) => d.value;
    LC_dateParser = d3.timeParse("%Y-%m-%d");
    LC_xAccessor = (d) => LC_dateParser(d.date);

    //Check the value of xAccessor function now
    // console.log(xAccessor(dataset[0]));

    // 2. Create a chart dimension by defining the size of the Wrapper and Margin
    // console.log("drawLineChart", "svg", svg)

    dimensions = {
        width: 650,
        height: 400,
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
        .attr("id", "line-container")
        .attr("transform", `translate(${dimensions.margin.left},${dimensions.margin.top})`);

    // 5. Define Domain and Range for Scales
    LC_yScale = d3
        .scaleLinear()
        .domain(d3.extent(data_only.flat(), LC_yAccessor))
        .range([dimensions.boundedHeight, 0]);

    LC_xScale = d3
        .scaleTime()
        .domain(d3.extent(data_only.flat(), LC_xAccessor))
        .range([0, dimensions.boundedWidth]);

    //6. Convert a datapoints into X and Y value
    const lineGenerator = d3
        .line()
        .x((d) => LC_xScale(LC_xAccessor(d)))
        .y((d) => LC_yScale(LC_yAccessor(d)))
        .curve(d3.curveBasis);

    // 7. Convert X and Y into Path
    countyData.forEach(el => {
        bounds.append("path")
            .attr("d", lineGenerator(el.data.actual))
            .attr("fill", "none")
            .attr("stroke", color_array[countyNames.indexOf(el.name)])
            .attr("stroke-width", 2);

        bounds.append("path")
            .attr("d", lineGenerator(
                el.data.preds.filter(el =>
                    LC_dateParser(el.date) >= LC_dateParser(selectedDate())
                )
            ))
            .attr("fill", "none")
            .attr("stroke", color_array[countyNames.indexOf(el.name)])
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "7, 5");

        // TODO: Do we want little dots with a tooltip that shows the price? 
        // bounds.selectAll("circle")
        //     .data(el.data.actual)
        //     .enter()
        //     .append("circle")
        //     .attr("r", 0)
        //     .attr("cx", (d) => LC_xScale(LC_xAccessor(d)))
        //     .attr("cy", (d) => LC_yScale(LC_yAccessor(d)))
        //     .attr("fill", color_array[countyNames.indexOf(el.name)])

    });

    //8. Create X axis and Y axis
    // Generate Y Axis
    const yAxisGenerator = d3.axisLeft().scale(LC_yScale);
    const yAxis = bounds.append("g").call(yAxisGenerator);

    // Generate X Axis
    const xAxisGenerator = d3.axisBottom().scale(LC_xScale);
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

    vert_stroke(selectedDate());
}
