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
