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
    active = d3.select(null), 
	zoomDuration = 1000;

var projection = d3
    .geoAlbersUsa()
    .translate([width / 2, height / 2])
    .scale(width);

var path = d3.geoPath().projection(projection);

var svg = d3
    .select(".viz")
    .append("svg")
    .attr("class", "center-container")
    .attr("height", height + margin.top + margin.bottom)
    .attr("width", width + margin.left + margin.right);

svg.append("rect")
    .attr("class", "background center-container")
    .attr("height", height + margin.top + margin.bottom)
    .attr("width", width + margin.left + margin.right)
    .on("click", onClick);

var g = svg
    .append("g")
    .attr("class", "center-container center-items us-state")
    .attr("transform", `translate(${margin.left},${margin.top})`)
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom);

Promise.all([d3.json("us-topo.json")]).then(([us]) => {
    g.append("g")
        .attr("id", "counties")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.counties).features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "county-boundary");

    g.append("g")
        .attr("id", "states")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.states).features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "state")
        .on("click", onClick);

    g.append("path")
        .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
        .attr("id", "state-borders")
        .attr("d", path);

    g.append("path")
        .data(topojson.feature(us, us.objects.nation).features)
        .attr("class", "nation")
        .attr("d", path);
});

d3.select("body").on("keydown", () => {
    if (d3.event.key === "Escape") {
        zoomOut();
    }
});

function onClick(d) {
    if (d3.select(".background").node() === this || active.node() === this) {
        zoomOut();
        return;
    }

    // if () return zoomOut();

    active.classed("active", false);
    active = d3.select(this).classed("active", true);

    var bounds = path.bounds(d),
        dx = bounds[1][0] - bounds[0][0],
        dy = bounds[1][1] - bounds[0][1],
        x = (bounds[0][0] + bounds[1][0]) / 2,
        y = (bounds[0][1] + bounds[1][1]) / 2,
        scale = 0.9 / Math.max(dx / width, dy / height),
        translate = [width / 2 - scale * x, height / 2 - scale * y];

    g.transition()
        .duration(zoomDuration)
        .style("stroke-width", `${1.5 / scale}px`)
        .attr("transform", `translate(${translate})scale(${scale})`);
}

function zoomOut() {
    active.classed("active", false);
    active = d3.select(null);

    g.transition()
        .delay(100)
        .duration(zoomDuration)
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
}
