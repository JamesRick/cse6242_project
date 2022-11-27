/**
 * List of todos, add more things that need to be done.
 *
 * TODO:
 *
 */

var width = parseInt(d3.select(".viz").style("width")),
    width = width - margin.left - margin.right,
    mapRatio = 0.5,
    height = width * mapRatio,
    zoomDuration = 1000,
    selectedCounties = new Set(),
    tip = getTip();

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
        `${0} ${0} ${width + margin.left + margin.right} ${
            height + margin.top + margin.bottom
        }`
    );

var svg_bottom = d3
    .select(".area-bottom")
    .append("svg")
    .attr("class", "center-container")
    .attr("preserveAspectRatio", "xMinYMin meet")
    .attr(
        "viewBox",
        `${0} ${0} ${width + margin.left + margin.right} ${
            height + margin.top + margin.bottom
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

var quantileScale = d3
    .scaleQuantile()
    .range(colors); // These can be change to w/e we want later.

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
    var counties__ = topojson.feature(
        georgia,
        georgia.objects.counties
    ).features;
    let countyNames = counties__.map((d) => d.properties.NAME).sort();
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
        .on("click", stateAlternateSelect);

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
            // let  = d.properties.NAME;
            return `
                <input type="checkbox" class="county-box" id="${name}-box">
                <label class='box-label' for="test-box">${name}</label>
            `;
        });

    d3.selectAll(".county-box").on("click", countyAlternateSelect);

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
            .attr("transform", `translate(${width / 4},${10})`);

        let zillow_nest = d3
            .nest()
            .key((e) => e.RegionName.replace(" County", ""))
            .entries(zillow_data);
        zillow_map = flatten_nest(zillow_nest);

        var date_entries = new Set();
        var date_entries_str = new Set();
        zillow_data.forEach((element) => {
            Object.keys(element).forEach((key) => {
                // console.log("key", key);
                // console.log("date_entries", date_entries);
                // console.log("date_entries_str", date_entries_str);
                if (!date_entries_str.has(key) && date_re.test(key)) {
                    date_entries.add(date_parser(key));
                    date_entries_str.add(key);
                }
            });
        });

        var domain_data = [];
        zillow_data.forEach((d) => {
            date_entries.forEach((element) => {
                domain_data.push(parseFloat(d[date_formatter(element)]))
            });
        });
        quantileScale = quantileScale.domain(
            domain_data
        );

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
            .width(width / 2)
            .tickFormat(d3.timeFormat("%Y-%m-%d"))
            .default(default_date);

        g_slider
            .call(date_slider)
            .selectAll("text")
            .attr("dx", `-.05em`)
            .attr("dy", `.08em`)
            .attr("transform", `rotate(-45)`);

        g_slider
            .select("g.axis")
            .selectAll("text")
            .attr("class", "slider-tick-text");

        ready(undefined, georgia, zillow_data);
    });
}

function ready(error, georgia, zillow_data) {
    var cur_date = selectedDate();

    if (LOG_LEVEL == "DEBUG") {
        console.log(cur_date);
    }

    date_slider.on("onchange", () => {
        cur_date = selectedDate();

        if (LOG_LEVEL == "DEBUG") console.log(cur_date);

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

    // legend_color = legend_color.scale(quantileScale);
    // legend.call(legend_color);

    d3.select("g#counties")
        .selectAll("path")
        .data(topojson.feature(georgia, georgia.objects.counties).features)
        .style("fill", function (d) {
            cur_date_data = date_data.filter(
                (dd) =>
                    dd["county"].toLowerCase() ==
                    d["properties"]["NAME"].toLowerCase()
            );
            if (cur_date_data.length > 0) {
                return quantileScale(cur_date_data[0]["price"]);
            }
            return "#8693AB";
        });
}
