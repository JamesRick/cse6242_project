async function drawLineChart() {

    //1. Load your Dataset

    // need to select the map version -> county -> filter by date
    const dataset = await d3.csv("Book1.csv");
  
    //Check the sample values available in the dataset
    //console.table(dataset[0]);
  
    const yAccessor = (d) => d.InternetUsage;
    const dateParser = d3.timeParse("%d/%m/%Y");
    const xAccessor = (d) => dateParser(d["Bill Date"]);
  
    //Check the value of xAccessor function now
    //console.log(xAccessor(dataset[0]));
  
    // 2. Create a chart dimension by defining the size of the Wrapper and Margin
  
    let dimensions = {
      width: window.innerWidth * 0.6,
      height: 600,
      margin: {
        top: 115,
        right: 20,
        bottom: 40,
        left: 60,
      },
    };
    dimensions.boundedWidth =
      dimensions.width - dimensions.margin.left - dimensions.margin.right;
    dimensions.boundedHeight =
      dimensions.height - dimensions.margin.top - dimensions.margin.bottom;
  
    // 3. Draw Canvas
  
    const wrapper = d3
      .select("#wrapper")
      .append("svg")
      .attr("width", dimensions.width)
      .attr("height", dimensions.height);
  
    //Log our new Wrapper Variable to the console to see what it looks like
    //console.log(wrapper);
  
    // 4. Create a Bounding Box
  
    const bounds = wrapper
      .append("g")
      .style(
        "transform",
        `translate(${dimensions.margin.left}px,${dimensions.margin.top}px)`
      );
  
    // 5. Define Domain and Range for Scales
  
    const yScale = d3
      .scaleLinear()
      .domain(d3.extent(dataset, yAccessor))
      .range([dimensions.boundedHeight, 0]);
  
    // console.log(yScale(100));
    const referenceBandPlacement = yScale(100);
    const referenceBand = bounds
      .append("rect")
      .attr("x", 0)
      .attr("width", dimensions.boundedWidth)
      .attr("y", referenceBandPlacement)
      .attr("height", dimensions.boundedHeight - referenceBandPlacement)
      .attr("fill", "#ffece6");
  
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(dataset, xAccessor))
      .range([0, dimensions.boundedWidth]);
  
    //6. Convert a datapoints into X and Y value
  
    const lineGenerator = d3
      .line()
      .x((d) => xScale(xAccessor(d)))
      .y((d) => yScale(yAccessor(d)))
      .curve(d3.curveBasis);
  
    // 7. Convert X and Y into Path
  
    const line = bounds
      .append("path")
      .attr("d", lineGenerator(dataset))
      .attr("fill", "none")
      .attr("stroke", "Red")
      .attr("stroke-width", 2);
  
    //8. Create X axis and Y axis
    // Generate Y Axis
  
    const yAxisGenerator = d3.axisLeft().scale(yScale);
    const yAxis = bounds.append("g").call(yAxisGenerator);
  
    // Generate X Axis
    const xAxisGenerator = d3.axisBottom().scale(xScale);
    const xAxis = bounds
      .append("g")
      .call(xAxisGenerator.tickFormat(d3.timeFormat("%b,%y")))
      .style("transform", `translateY(${dimensions.boundedHeight}px)`);
  
    //9. Add a Chart Header
  
    wrapper
      .append("g")
      .style("transform", `translate(${50}px,${15}px)`)
      .append("text")
      .attr("class", "title")
      .attr("x", dimensions.width / 2)
      .attr("y", dimensions.margin.top / 2)
      .attr("text-anchor", "middle")
      .text("My 2020 Internet Usage(in GB) ")
      .style("font-size", "36px")
      .style("text-decoration", "underline");
  }
  

drawLineChart();