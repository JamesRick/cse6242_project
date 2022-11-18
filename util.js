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
    let name = d.properties.NAME,
        el = d3.select(this);
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
        let price = zillow_map[d.properties.NAME][selectedDate()];
        // let avgPrice = avgForYear()

        return `
            <div class="tooltip" id="tooltip">
                <div><b>County Name</b>: ${county}</div>
                <div><b>Average Price</b>: ${dollar.format(price)}</div>
                <div><b>
            </div>
            `;
    });
}
