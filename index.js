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

const LOG_LEVEL = "RELEASE";

var county_csv_path = "zillow_data/ga/all_sm_sa_month/County_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv";
const date_re = new RegExp('[0-9]+\-[0-9]+\-[0-9]+');
const date_parser = d3.timeParse("%Y-%m-%d")
const seconds_per_day = 60*60*24

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

/**
 * TODO: Need to format slider with appropriate colors and style.
 * TODO: Need to color choropleth map with default dates housing price values.
 * TODO: Need to connect slider change to change in choropleth map values & colors.
 */

Promise.all([
    d3.json("maps/us-topo.json"),
    d3.json("maps/GA-13-georgia-counties.json"),
    d3.csv(county_csv_path, read_zillow_data),
]).then(([us, georgia, zillow_data]) => {
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

    /**
     * Slider code below
     */
    var g_slider = svg.append("g")
        .attr("id", "date-slider")
        .attr('width', width)
        .attr('height', 100)
        .attr('transform', `translate(${1/2*(width-width/2)},${height-margin.bottom*10})`);

    var date_entries = new Set()
    zillow_data.forEach(element => {
        Object.keys(element).forEach(key => {
            if (!(date_entries.has(date_parser(key))) && date_re.test(key)) {
                date_entries.add(date_parser(key));
            }
        });
    });

    date_entries = Array.from(date_entries)
    tick_values = date_entries.filter((date) => {
        return date.getMonth() === 0;
    });
    const default_date = d3.max(date_entries)

    if (LOG_LEVEL == "DEBUG") {
        console.log(date_entries);
        console.log(default_date);
    }

    var date_slider = d3.sliderBottom()
        .marks(date_entries)
        .min(d3.min(date_entries))
        .max(d3.max(date_entries))
        .width(width/2)
        .tickFormat(d3.timeFormat('%Y-%m-%d'))
        // .tickValues(tick_values)
        .default(default_date)
        .on('onchange', val => {
            d3.select('p#value-time')
                .text(d3.timeFormat('%Y')(val));
        });

    g_slider.call(date_slider)
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", `-.05em`)
        .attr("dy", `.08em`)
        .attr("transform", `rotate(-45)`);

    d3.select('p#value-time').text(d3.timeFormat('%Y')(date_slider.value()));

});


function read_zillow_data(row) {
    ret_val = {};
    for (const [key, value] of Object.entries(row)) {
        ret_val[key] = value;
    }
    return ret_val;
}