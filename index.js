var svg = d3.select("svg"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

var unemployment = d3.map();

var path = d3.geoPath();

var g = svg.append("g")
    .attr("class", "key")
    .attr("transform", "translate(0,40)");

var promises = [
    d3.json("us-topo.json"),
]

Promise.all(promises).then(([us]) => {
    svg.append("g")
        .attr("class", "counties")
        .selectAll("path")
        .data(topojson.feature(us, us.objects.counties).features)
        .enter().append("path")
        .attr("d", path);

    svg.append("path")
        .datum(topojson.mesh(us, us.objects.states, function (a, b) { return a !== b; }))
        .attr("class", "states")
        .attr("d", path);

    svg.append("path")
        .data(topojson.feature(us, us.objects.nation).features)
        .attr("class", "states")
        .attr("d", path);
});