function read_zillow_data(row) {
    ret_val = {};
    for (const [key, value] of Object.entries(row)) {
        ret_val[key] = value;
    }
    return ret_val;
}

function flatten_nest(nest) {
    if (
        !Array.isArray(nest) ||
        nest.length == 0 ||
        !(nest[0].hasOwnProperty("key") && nest[0].hasOwnProperty("values"))
    ) {
        if (Array.isArray(nest) && nest.length == 1) {
            return nest[0];
        }
        return nest;
    }
    var flattened_array = nest.map((n) => {
        let k = n.key;
        return { [k]: flatten_nest(n.values) };
    });

    return Object.assign(...flattened_array);
}

function avgForYear(z_map, county, year) {
    let keysForYear = Object.keys(z_map[county])
        .filter((k) => date_re.test(k))
        .filter((key) => date_parser(key).getUTCFullYear() == year);

    let pricesForYear = keysForYear.map((d) => parseFloat(z_map[county][d]));
    let average = pricesForYear.reduce((a, b) => a + b) / pricesForYear.length;

    // https://stackoverflow.com/a/7540412
    return average || 0;
}

function selectedDate() {
    return d3
        .select("g#date-slider")
        .select("g.parameter-value")
        .select("text")
        .text();
}

function selectedYear(asInt = false) {
    let currYear = selectedDate().split("-")[0];
    if (asInt) {
        return parseInt(currYear);
    } else {
        return currYear;
    }
}

function countyAlternateSelect() {
    let target = d3.select(d3.event.target),
        checked = target.property("checked"),
        name = target.attr("id").split("-")[0],
        el = d3.select(`#${name}-path`);
    if (checked) {
        selectedCounties.add(name);
        el.raise();
    } else {
        selectedCounties.delete(name);
        el.lower();
    }
    el.classed("selected", selectedCounties.has(name));
}

function stateAlternateSelect(d) {
    let name = d.properties.NAME;
    el = d3.select(`#${name}-path`);
    if (selectedCounties.has(name)) {
        selectedCounties.delete(name);
        el.lower();
    } else {
        selectedCounties.add(name);
        el.raise();
    }
    d3.select(`#${name}-box`).property("checked", selectedCounties.has(name));
    el.classed("selected", selectedCounties.has(name));
}

function tooltipCallback(onClick) {
    return (d) => {
        let x = d3.event.x,
            y = d3.event.y;
        if (onClick) tip.show(d);
        tip.style("top", `${y + 25}px`);
        tip.style("left", `${x - 50}px`);
    };
}

function getTip() {
    return d3.tip().html((d) => {
        let county = d.properties.NAME;
        let price = zillow_map[d.properties.NAME]?.[selectedDate()] | 0;
        // let avgPrice = avgForYear()

        return `
            <div class="tooltip" id="tooltip">
                <div><b>County Name</b>: ${county}</div>
                <div><b>Average Price</b>: ${dollar.format(price)}</div>
            </div>
            `;
    });
}

function getDataForCounty(countyMap, countyName) {
    let allCountyValues = countyMap[countyName];
    if (allCountyValues == undefined) {
        return [];
    }
    let formatted = Object.keys(allCountyValues)
        .filter((k) => Date.parse(k))
        .filter((k) => k != 'Unnamed: 0')
        .map((k) => ({
            date: k,
            value: parseFloat(allCountyValues[k]) | 0,
        }))
        .filter(o => o.value > 0);

    return formatted;
}

function getPredForCounty(cmap, countyName, startDate) {
    return cmap[countyName]?.[startDate]; 
}

function vert_stroke(cur_date) {
    d3.select(".vert-line").remove()

    d3.select("#line-container")
        .append("svg:line")
        .attr("class", "vert-line")
        .attr("x1", Math.max(LC_xScale(LC_dateParser(cur_date)), 0))
        .attr("y1", dimensions.boundedHeight)
        .attr("x2", Math.max(LC_xScale(LC_dateParser(cur_date)), 0))
        .attr("y2", 0);
}

function refreshLineChart() {
    let linedata = [...selectedCounties].map((e) => ({
        name: e,
        data: {
            actual: getDataForCounty(zillow_map, e),
            // TODO: replace this with the real values
            preds: getPredForCounty(preds_map, e, selectedDate())
        }
    }));
    drawLineChart(linedata);
    vert_stroke(selectedDate());
}

function date_inc(original_date) {
    let new_date = new Date(original_date);
    new_date.setUTCMonth(original_date.getUTCMonth() + 1);
    return new_date;
}

function parse_preds(preds_raw) {
    let preds_nest = d3.nest()
        .key(k => k.County)
        .key(k => k.Date)
        .entries(preds_raw);
    preds = flatten_nest(preds_nest)

    var final_obj = {};
    Object.keys(preds).forEach(el => {
        final_obj[el] = {};
        Object.keys(preds[el]).forEach(start_date_str => {
            final_obj[el][start_date_str] = [];
            var next_date = new Date(start_date_str);
            for (var i = 0, j = 1; i < 12; i++, j++) {
                var next_date = date_inc(next_date);
                var next_date_str = next_date.toISOString().split('T')[0];
                final_obj[el][start_date_str].push({
                    date: next_date_str,
                    value: preds[el][start_date_str][`Pred_${j}`]
                });
            }
        });
    });
    return final_obj;
}