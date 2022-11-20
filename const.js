const margin = {
    top: 10,
    bottom: 10,
    left: 10,
    right: 10,
};

/**
 * LOG_LEVEL for controlling console.log output.
 * valid values: "RELEASE", "DEBUG".
 */
const LOG_LEVEL = "DEBUG";

const index_path = "zillow_data/index.json";
const date_re = new RegExp("[0-9]+-[0-9]+-[0-9]+");
const date_parser = d3.timeParse("%Y-%m-%d");
const seconds_per_day = 60 * 60 * 24;
const dollar = Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
});

const projection = d3.geoAlbers().translate([0, 0]).scale(1).rotate([90, 0, 0]);
const path = d3.geoPath().projection(projection);
