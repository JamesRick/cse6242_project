var margin = {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10,
    },
    width = parseInt(d3.select(".viz").style("width")),
    width = width - margin.left - margin.right,
    mapRatio = 0.5,
    height = width * mapRatio,
    zoomDuration = 1000;

var projection = d3.geoAlbers().translate([0, 0]).scale(1).rotate([90, 0, 0]);

var path = d3.geoPath().projection(projection);

var zoom = d3
    .zoom()
    .translateExtent([
        [0, 0],
        [width, height],
    ])
    .scaleExtent([1, 10])
    .on("zoom", () => g.attr("transform", d3.event.transform));

var svg = d3
    .select(".viz")
    .append("svg")
    .attr("class", "center-container")
    .attr("height", height + margin.top + margin.bottom)
    .attr("width", width + margin.left + margin.right);

svg.append("rect")
    .attr("class", "background center-container")
    .attr("height", height + margin.top + margin.bottom)
    .attr("width", width + margin.left + margin.right);

var g = svg
    .append("g")
    .attr("class", "center-container center-items us-state")
    .attr("transform", `translate(${margin.left},${margin.top})`)
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .call(zoom)
    .on("dblclick.zoom", null);

Promise.all([
    d3.json("maps/us-topo.json"),
    d3.json("maps/GA-13-georgia-counties.json"),
]).then(([us, georgia]) => {
    state = topojson
        .feature(us, us.objects.states)
        .features.filter((f) => f.properties.name === "Georgia")[0];

    var b = path.bounds(state),
        s =
            1 /
            Math.max((b[1][0] - b[0][0]) / width, (b[1][1] - b[0][1]) / height),
        t = [
            (width - s * (b[1][0] + b[0][0])) / 2,
            (height - s * (b[1][1] + b[0][1])) / 2,
        ];

    projection.scale(s).translate(t);

    g.append("g")
        .attr("id", "counties")
        .selectAll("path")
        .data(topojson.feature(georgia, georgia.objects.counties).features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "county-boundary")
		.on("click", d => console.log(d.properties.NAME))

    g.append("g")
        .attr("id", "state-borders")
        .selectAll("path")
        .data([state])
        .enter()
        .append("path")
        .attr("d", path);
});
