var LC_xScale,
    LC_yScale,
    dimensions,
    LC_xAccessor,
    LC_yAccessor,
    LC_dateParser,
    LC_bounds;

async function drawLineChart(countyData) {
    d3.select("#line-chart").remove();

    LC_yAccessor = (d) => d.value;
    LC_dateParser = d3.timeParse("%Y-%m-%d");
    LC_xAccessor = (d) => LC_dateParser(d.date);

    var data_only = [
        ...countyData.flatMap(l => l.data.actual),
        ...countyData.flatMap(l => l.data.preds || []),
    ];

    if (LOG_LEVEL == "DEBUG") {
        console.log(countyData);
        console.log(data_only);
    }

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

    
    const wrapper = d3
        .select(".viz")
        .append("svg")
        .attr("id", "line-chart")
        .attr("preserveAspectRatio", "xMinYMin meet")
        .attr(
            "viewBox",
            `${0} ${0} ${dimensions.width} ${dimensions.height}`
        );

    LC_bounds = wrapper
        .append("g")
        .attr("width", dimensions.boundedWidth)
        .attr("height", dimensions.boundedHeight)
        .attr("id", "line-container")
        .attr("transform", `translate(${dimensions.margin.left},${dimensions.margin.top})`);

    LC_yScale = d3
        .scaleLinear()
        .domain(d3.extent(data_only, LC_yAccessor))
        .range([dimensions.boundedHeight, 0]);

    LC_xScale = d3
        .scaleTime()
        .domain(d3.extent(data_only, LC_xAccessor))
        .range([0, dimensions.boundedWidth]);

    const lineGenerator = d3
        .line()
        .x((d) => LC_xScale(LC_xAccessor(d)))
        .y((d) => LC_yScale(LC_yAccessor(d)))
        .curve(d3.curveBasis);

    countyData.forEach(el => {
        LC_bounds.append("path")
            .attr("d", lineGenerator(el.data.actual))
            .attr("fill", "none")
            .attr("stroke", color_array[countyNames.indexOf(el.name)])
            .attr("stroke-width", 2);

        if (el.data.preds != undefined) {
            var line_data = el.data.preds;
            if (selectedDate() == el.data.actual[el.data.actual.length - 1].date) {
                line_data = [el.data.actual[el.data.actual.length - 1], ...line_data];
            }
            LC_bounds.append("path")
                .attr("d", lineGenerator(line_data))
                .attr("fill", "none")
                .attr("stroke", color_array[countyNames.indexOf(el.name)])
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "4, 2");
        }

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

    const yAxisGenerator = d3.axisLeft().scale(LC_yScale);
    const yAxis = LC_bounds.append("g").call(yAxisGenerator);

    const xAxisGenerator = d3.axisBottom().scale(LC_xScale);
    const xAxis = LC_bounds
        .append("g")
        .call(xAxisGenerator.tickFormat(d3.timeFormat("%Y-%m-%d")))
        .style("transform", `translateY(${dimensions.boundedHeight}px)`)
        .selectAll("text")
        .attr("dx", `-.05em`)
        .attr("dy", `.20em`)
        .attr("transform", `translate(${-5},${20}) rotate(-45)`);

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
