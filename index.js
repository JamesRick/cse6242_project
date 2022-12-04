/**
 * List of todos, add more things that need to be done.
 *
 * TODO:
 *
 */

var width = parseInt(d3.select(".viz").style("width")),
    width = width - margin.left - margin.right,
    mapRatio = 0.6,
    height = width * mapRatio,
    zoomDuration = 1000,
    selectedCounties = new Set(),
    tip = getTip(),
    counties__,
    countyNames;

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
    .attr(
        "viewBox",
        `${0} ${0} ${width + margin.left + margin.right} ${height + margin.top + margin.bottom
        }`
    );

var svg_defs = svg.append("defs");

svg_defs
    .append("pattern")
    .attr("id", "stripe-pattern")
    .attr("width", 10)
    .attr("height", 10)
    .attr("patternUnits", "userSpaceOnUse")
    .attr("patternTransform", "rotate(-45)")
    .append("rect")
    .attr("width", 6)
    .attr("height", 10)
    .attr("fill", "#8693AB");

var svg_bottom = d3
    .select(".area-bottom")
    .append("svg")
    .attr("class", "center-container")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr(
        "viewBox",
        `${0} ${0} ${width + margin.left + margin.right} ${height + margin.top + margin.bottom
        }`
    );

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

var quantileScale = d3.scaleQuantile().range(colors); // These can be change to w/e we want later.

var date_slider = d3.sliderBottom();

var zillow_map;
Promise.all([
    d3.json("maps/us-topo.less.min.json"),
    d3.json("maps/GA-13-georgia-counties.min.json"),
    d3.json(index_path),
]).then(([us, georgia, index]) => {
    let state = topojson
        .feature(us, us.objects.states)
        .features.filter((f) => f.properties.name === "Georgia")[0];

    let b = path.bounds(state),
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
    counties__ = topojson.feature(
        georgia,
        georgia.objects.counties
    ).features;
    countyNames = counties__.map((d) => d.properties.NAME).sort();
    g.append("g")
        .attr("id", "counties")
        .selectAll("path")
        .data(counties__)
        .enter()
        .append("path")
        .attr("d", path)
        .attr("class", "county-boundary")
        .attr("id", (d) => `${d.properties.NAME}-path`)
        .on("mouseover", tooltipCallback(true))
        .on("mousemove", tooltipCallback(false))
        .on("mouseout", tip.hide)
        .on("click", (d) => {
            stateAlternateSelect(d);
            refreshLineChart();
        });

    g.call(tip);

    /**
     * Creates the state boundary
     */
    g.append("g")
        .attr("class", "state-borders")
        .selectAll("path")
        .data([state])
        .enter()
        .append("path")
        .attr("d", path);

    /**
     * Add checkboxes to sidebar
     */
    d3.select("#county-list")
        .selectAll()
        .data(countyNames)
        .enter()
        .append("div")
        .html((name) => {
            return `
                <input type="checkbox" class="county-box" id="${name}-box">
                <label class='box-label' for="test-box">${name}</label>
            `;
        });

    d3.selectAll(".county-box").on("click", () => {
        countyAlternateSelect();
        refreshLineChart();
    });

    d3.select("#data-select")
        .selectAll("option")
        .data(index)
        .enter()
        .append("option")
        .text((d) => d.displayName)
        .attr("value", (d) => d.path);

    d3.select("#data-select").on("change", function () {
        let path = this.options[this.selectedIndex].value;
        d3.select(".center-container").selectAll("g").remove();
        redrawData(georgia, path);
    });

    redrawData(georgia, index[0].path);
});

function redrawData(georgia, dataPath) {
    d3.csv(dataPath).then((zillow_data) => {
        /**
         * Slider code below
         */
        var g_slider = svg_bottom
            .append("g")
            .attr("id", "date-slider")
            .attr("width", width)
            .attr("height", 100)
            .attr("transform", `translate(${width / 4},${20})`);

        let zillow_nest = d3
            .nest()
            .key((e) => e.RegionName.replace(" County", ""))
            .entries(zillow_data);
        zillow_map = flatten_nest(zillow_nest);

        var date_entries = new Set();
        var date_entries_str = new Set();
        zillow_data.forEach((element) => {
            Object.keys(element).forEach((key) => {
                if (!date_entries_str.has(key) && date_re.test(key)) {
                    date_entries.add(date_parser(key));
                    date_entries_str.add(key);
                }
            });
        });

        var domain_data = [];
        zillow_data.forEach((d) => {
            date_entries.forEach((element) => {
                domain_data.push(parseFloat(d[date_formatter(element)]));
            });
        });
        quantileScale = quantileScale.domain(domain_data);

        /**
         * TODO: Fix lowest color of legend somehow.
         * Lowest color of legend blends in with the background.
         */
        d3.select("#legend").remove();
        let legend = svg
            .append("g")
            .attr("id", "legend")
            .attr("transform", `translate(${width - width / 2.5},${margin.top})`);
        var legend_color = d3.legendColor().labelFormat(d3.format(",.2f"));
        legend_color = legend_color.scale(quantileScale);
        legend.call(legend_color);

        date_entries = Array.from(date_entries);
        tick_values = date_entries.filter((date) => {
            return date.getMonth() === 0;
        });
        const default_date = d3.max(date_entries);

        if (LOG_LEVEL == "DEBUG") {
            console.log(zillow_data);
            console.log(zillow_map);
            // console.log(date_entries);
            // console.log(default_date);
            // console.log(counties__);
        }

        date_slider
            .marks(date_entries)
            .min(d3.min(date_entries))
            .max(d3.max(date_entries))
            .width(width / 1.5)
            .tickFormat(d3.timeFormat("%Y-%m-%d"))
            .default(default_date);

        g_slider
            .call(date_slider)
            .selectAll("text")
            .attr("font-size", "2em")
            .attr("dx", `-.05em`)
            .attr("dy", `.08em`)
            .attr("transform", `rotate(-45)`);

        g_slider
            .select("g.axis")
            .selectAll("text")
            .attr("class", "slider-tick-text");

        ready(undefined, georgia, zillow_data);
        refreshLineChart();
    });
}

function ready(error, georgia, zillow_data) {
    var cur_date = selectedDate();

    if (LOG_LEVEL == "DEBUG") {
        console.log(cur_date);
    }

    date_slider.on("onchange", () => {
        cur_date = selectedDate();

        // if (LOG_LEVEL == "DEBUG") console.log(cur_date);
        vert_stroke(cur_date);

        // Color map with currently selected dates data.
        colorMap(georgia, zillow_data, cur_date);
    });

    // // Color map with default dates data.
    colorMap(georgia, zillow_data, cur_date);
}

function colorMap(georgia, zillow_data, cur_date) {
    var date_data = [];
    zillow_data.forEach((element) => {
        date_data.push({
            county: element["RegionName"].replace(" County", ""),
            price: parseFloat(element[cur_date]),
        });
    });

    d3.select("g#counties")
        .selectAll("path")
        // .data(counties__)
        .style("fill", function (d) {
            let cur_date_data = date_data.filter(
                (dd) =>
                    dd["county"].toLowerCase() ==
                    d["properties"]["NAME"].toLowerCase()
            );
            if (cur_date_data.length > 0 && !isNaN(cur_date_data[0]["price"])) {
                return quantileScale(cur_date_data[0]["price"]);
            }
            return "url(#stripe-pattern)";
        });
}
