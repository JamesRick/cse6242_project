/**
 * List of todos, add more things that need to be done.
 * 
 * TODO: 
 * 
 */

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

/**
 * LOG_LEVEL for controlling console.log output.
 * valid values: "RELEASE", "DEBUG".
 */
const LOG_LEVEL = "RELEASE";

const county_csv_path = "zillow_data/ga/all_sm_sa_month/County_zhvi_uc_sfrcondo_tier_0.33_0.67_sm_sa_month.csv";
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

/**
 * jrick6 -- Updated to use viewbox. With this and the added css classes 
 * in index.css the map will now scale based on the browsers 
 * window size.
 */
var svg = d3
    .select(".viz")
    .append("svg")
    .attr("class", "center-container")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .classed("svg-content", true);

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

var quantileScale = d3
    .scaleQuantile()
    .range(["#feedde","#fdbe85","#fd8d3c","#d94701"])

var date_slider = d3.sliderBottom();

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

    /**
     * Creates the county boundaries
     */
    g.append("g")
        .attr("id", "counties")
        .selectAll("path")
        .data(topojson.feature(georgia, georgia.objects.counties).features)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "county-boundary")
        .on("click", d => console.log(d.properties.NAME))

    /**
     * Creates the state boundary
     */
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
        console.log(zillow_data);
        console.log(date_entries);
        console.log(default_date);
    }

    date_slider.marks(date_entries)
        .min(d3.min(date_entries))
        .max(d3.max(date_entries))
        .width(width/2)
        .tickFormat(d3.timeFormat('%Y-%m-%d'))
        .default(default_date);

    g_slider.call(date_slider)
        .selectAll("text")
        .attr("dx", `-.05em`)
        .attr("dy", `.08em`)
        .attr("transform", `rotate(-45)`);

    g_slider.select("g.axis")
        .selectAll("text")
        .attr("class", "slider-tick-text");

    ready(undefined, georgia, zillow_data);
});

function read_zillow_data(row) {
    ret_val = {};
    for (const [key, value] of Object.entries(row)) {
        ret_val[key] = value;
    }
    return ret_val;
}

function ready(error, georgia, zillow_data) {
    var cur_date = d3.select("g#date-slider")
        .select("g.parameter-value")
        .select("text").text();

    if (LOG_LEVEL == "DEBUG") { console.log(cur_date); }

    date_slider.on("onchange", () => {
        cur_date = d3.select("g#date-slider")
            .select("g.parameter-value")
            .select("text")
            .text();
        // Color map with currently selected dates data.
        colorMap(georgia, zillow_data, cur_date);
    });

    // // Color map with default dates data.
    colorMap(georgia, zillow_data, cur_date);
}

function colorMap(georgia, zillow_data, cur_date) {
    var date_data = [];
    zillow_data.forEach(element => {
        date_data.push({
            "county": element["RegionName"].replace(" County", ""),
            "price": parseFloat(element[cur_date]),
        });
    });

    quantileScale = quantileScale.domain(
        date_data.map((d) => {
            return d["price"];
        })
    );

    // legend_color = legend_color.scale(quantileScale);
    // legend.call(legend_color);

    d3.select("g#counties")
        .selectAll("path")
        .data(topojson.feature(georgia, georgia.objects.counties).features)
        .style("fill", function (d) {
            cur_date_data = date_data.filter((dd) => 
                dd["county"].toLowerCase() == d["properties"]["NAME"].toLowerCase()
            );
            if (cur_date_data.length > 0) {
                return quantileScale(cur_date_data[0]["price"]);
            }
            return "#8693AB";
        });
}