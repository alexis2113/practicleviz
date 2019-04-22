/**
 *
 */
function hide(selector) {
  selector.classed("hidden", true);
  selector.classed("reveal", false);
}
function show(selector) {
  selector.classed("reveal", true);
  selector.classed("hidden", false);
}

var width = 900;
var height = 720;
var margin = {
  top: 0,
  left: 20,
  bottom: 30,
  right: 10
};

// recoshowrding plots indexes

var mapdata = World;
var bardata = TerroristData.slice(1, 10);
var connectiondata = ConnectionData;
var pointsdata = PointsData.slice(0, 10);
var areaData = ClaimsData;
var routedata = d3
  .nest()
  .key(function(d) {
    return [d.Corigin, d.Cdest];
  })
  .rollup(function(leaves) {
    return { value: leaves.length, start: leaves[0].start, end: leaves[0].end };
  })
  .entries(connectiondata);

var minColor = "#f0f0f0",
  maxColor = "rgb(8, 48, 107)";
let mapcolor = function(value) {
  let cf = d3
    .scaleLog()
    .domain([1, 1600])
    .range([1, 0]);
  return value > 0 ? d3.interpolateRdGy(cf(value)) : 0;
};
function mapmsg(ctr, rec) {
  return (
    "<div class='tooltipcontent'><li><span>Country : " +
    ctr +
    "</span></li><li><span>Records : " +
    rec +
    "</span></li></div>"
  );
}
var projection = d3
  .geoMercator()
  .scale([width / (2 * Math.PI)])
  .translate([width / 2, height / 1.5])
  .precision(0.01);
var path = d3.geoPath().projection(projection);

var scrollVis = function() {
  // constants to define the size
  // and margins of the vis area.

  /**
   * start drawing barchart
   * for displaying top
   * terriost organization
   *
   */
  var lastIndex = -1;
  var activeIndex = 0;

  // Sizing for the Map visualization
  var mapSize = 6;
  var mapPad = 2;

  // initiate svg
  var svg = null;

  // initiate g
  var g = null;

  var xareasScale = d3
    .scaleLinear()
    .domain([0, 30])
    .range([0, width - 20]);
  var yareasScale = d3.scaleLinear().range([height, 0]);
  var coughColorScale = d3
    .scaleLinear()
    .domain([0, 1.0])
    .range(["#008080", "red"]);
  var Barwidth = d3
    .scaleLinear()
    .domain([0, d3.max(bardata, d => d.value)])
    .range([0, width]);
  var xAxisBar = d3.axisBottom().scale(Barwidth);
  var xAxisareas = d3
    .axisBottom()
    .scale(xareasScale)
    .tickFormat(function(d) {
      return d + " min";
    });

  var activateFunctions = [];

  var updateFunctions = [];
  // create svg and give it a width and height

  /**
   * chart
   *
   * @param selection - the current d3 selection(s)
   *  to draw the visualization in. For this
   *  example, we will be drawing it in #vis
   */
  var chart = function(selection) {
    selection.each(function(start = true) {
      svg = d3
        .select(this)
        .selectAll("svg")
        .data([mapdata]);
      var svgE = svg.enter().append("svg");
      // combine enter and existing selection
      svg = svg.merge(svgE);

      svg.attr("width", width + margin.left + margin.right);
      svg.attr("height", height + margin.top + margin.bottom);

      svg.append("g");

      // this group element will be used to contain all
      // other elements.
      g = svg
        .select("g")
        .attr("class", "major group")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

      // perform some preprocessing on raw data

      // set the bar scale's domain
      var countMax = d3.max(bardata, function(d) {
        return d.value;
      });
      Barwidth.domain([0, countMax]);

      // get aggregated areasogram data

      // set areasogram's domain
      var areasMax = d3.max(areaData, function(d) {
        return d.value;
      });
      yareasScale.domain([0, areasMax]);

      setupVis(mapdata, connectiondata, pointsdata, bardata, areaData);

      setupSections(mapdata, connectiondata, pointsdata, bardata, areaData);
    });
  };

  /**
   * @param mapdata - geofeatures for drawing maps
   * @param g - d3-selection,place holder for maps
   */

  function drawmap() {
    //clearing all remaining elements

    /** Awesome tooltip idea from Eric Porter https://codepen.io/EricPorter/pen/xdJLaG?editors=1000*/
    d3.select(".inner-layer")
      .append("path")
      .datum(topojson.mesh(World, World.objects.countries, (a, b) => a !== b))
      .attr("d", path)
      .attr("class", "map border")
      .attr("stroke", "white")
      .attr("stroke-width", 2);
    var selection2 = d3
      .select(".countries-layer")
      .selectAll(".map.countries.requiretooltip")
      .data(Feature)
      .attr("message", d => mapmsg(d.name, d.nrecord));

    selection2
      .enter()
      .append("g")
      .attr("message", d => mapmsg(d.name, d.nrecord))
      .attr("class", "map countries requiretooltip")
      .append("path")
      .attr("id", d => d.id)
      .attr("d", path)
      .attr("fill", d => mapcolor(d.nrecord))
      .attr("fill-opacity", 1)
      .attr("stroke-width", 2)
      .attr("opacity", 1);
  }

  function updatepoints() {
    const g = d3.select(".Points-layer");

    const ge = g.selectAll(".points.Points-layer").data(pointsdata);

    ge.enter()
      .append("use")
      .join(ge)
      .attr("class", "points Points-layer")
      .attr("id", d => d.feature.name)
      .attr("x", d => projection([d.coordinates[0], d.coordinates[1]])[0] - 19)
      .attr("y", d => projection([d.coordinates[0], d.coordinates[1]])[1] - 40)
      .attr("xlink:href", "#pinpoints")
      .attr("fill", "blue")
      .attr("opacity", 1)
      .attr("fill-opacity", 1);

    // Exit selection: Remove elements without data from the DOM
  }

  function drawconnection() {
    var links = [];
    for (var i = 0, len = routedata.length; i < len; i++) {
      links.push({
        type: "LineString",
        coordinates: [
          [routedata[i].value.start[0], routedata[i].value.start[1]],
          [routedata[i].value.end[0], routedata[i].value.end[1]]
        ]
      });
    }

    // Standard enter / update
    var pathArcs = d3
      .select(".Connections-layer")
      .selectAll(".routes.Connections-layer")
      .data(links)
      .attr("d", path)
      .attr("stroke", "white")
      .attr("stroke-width", 2);

    //enter
    pathArcs
      .enter()
      .append("path")
      .attr("class", "arc routes Connections-layer")
      .attr("d", path)
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("fill", "none")
      .attr("opacity", 1);
  }

  function drawIntro() {
    var selection = d3
      .select(".Intro-layer")
      .selectAll(".Intro-layer.texts")
      .data(["hello"]);

    selection
      .enter()
      .append("p")
      .attr("class", "Intro-layer texts")
      .text(d => d[0])
      .attr("opacity", 0)
      .transition()
      .duration(100)
      .ease(d3.easeLinear)
      .attr("opacity", 1);

    // Exit selection: Remove elements without data from the DOM

    selection.exit().remove();
  }

  function drawbar() {
    var margin = 100;
    var xscale = d3
        .scaleLinear()
        .domain([0, d3.max(bardata, d => d.value)])
        .range([0, width - margin]),
      yscale = d3
        .scaleBand()
        .domain(d3.range(bardata.length))
        .range([margin, height - margin])
        .round(true)
        .paddingInner(3);
    var Barheight = (height - 70) / bardata.length;
    var g = d3
      .select(".Bar-layer")
      .selectAll(".terrorist-bars.Bar-layer")
      .data(bardata);

    var yaxis = d3
      .select(".Bar-layer")
      .selectAll(".y.bar-axis Bar-layer")
      .data(bardata);
    yaxis
      .enter()
      .append("g")
      .attr("transform", (d, i) => {
        return (
          "translate(" + `${margin + 400}` + "," + `${yscale(i) - 50}` + ")"
        );
      })
      .attr("class", "y bar-axis Bar-layer")
      .attr("text-anchor", "start")
      .append("text")
      .text(d => d.key);

    g.enter()
      .append("rect")
      .attr("class", "terrorist-bars Bar-layer")
      .attr("x", -10)
      .attr("y", (d, i) => yscale(i) - 40)
      .attr("height", Barheight - 30)
      .attr("width", d => xscale(d.value));
  }

  /**
   * setupVis - creates initial elements for all
   * sections of the visualization.
   *
   * @param mapdata - data
   * @param {Array.<Object>} bardata - summarize top terriost,
   *  array of objects with properties [gname,counts]
   * @param {Array.<Array>} areaData - Array with length 1 include filtered data
   */
  var setupVis = function(
    mapdata,
    connectiondata,
    pointsdata,
    bardata,
    areaData
  ) {
    // axis
    g.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxisBar);

    g.append("g").attr("class", " hidden section-Intro Intro-layer");
    //create new group for maps
    g.append("g").attr("class", " section-map Map-layer");
    const MAPG = d3.select(".Map-layer");
    MAPG.append("g")
      .attr("class", "Map-layer map")
      .attr("id", "Map-outlayer")
      .append("g")
      .attr("class", "map inner-layer hidden");

    d3.select(".map.inner-layer")
      .append("g")
      .attr("class", "map countries-layer");
    d3.select(".map.inner-layer")
      .append("g")
      .attr("class", "map Points-layer hidden");
    d3.select(".map.inner-layer")
      .append("g")
      .attr("class", "map Connections-layer hidden");

    //
    g.append("g").attr("class", "section-terrorist Bar-layer hidden");
    g.append("g").attr("class", "section-area Area-layer hidden");

    /**
     *
     * @param areaData - datas for drawing bars
     * @param g - datas for drawing bars
     */
    function drawarea(data = areaData) {
      const margin = 30;

      var timeExtent = d3.extent(data, function(d) {
        return d.value.date;
      });
      var xScale = d3
        .scaleTime()
        .domain(timeExtent)
        .range([0, width]);

      //extraction of just the rolled up counts from the nested data

      var yScale = d3
        .scaleLinear()
        .domain(d3.extent(data,d=>d.value.ncaps))
        .range([height, 5]);
      var yScale2 = d3
        .scaleLinear()
        .domain(d3.extent(data, d => d.value.nperps))
        .range([height, 5]);

      var x_axis = d3.axisBottom(xScale);
      var y_axis = d3
        .axisLeft(yScale)
        .tickValues([10, 50, 100, 150, 200, 250, 300]);

      const g = d3.select(".Area-layer");

      const stacks = g
        .selectAll(".area-stack")
        .data([""])
        .enter()
        .append("g")
        .attr("class", "area-stack");
        

      //define area generator
      var area = d3
        .area()
        .x(function(d) {
          return margin + xScale(new Date(d.key));
        })
        .y1(function(d) {
          return yScale2(d.value.nperps);
        })

        .y0(function(d) {
          return yScale.range()[0];
        });

      var area2 = d3
        .area()
        .curve(d3.curveMonotoneX)
        .x(function(d) {
         
          return margin + xScale(new Date(d.key));
        })
        .y1(function(d) {
         
          return yScale(d.value.ncaps);
        })

        .y0(function(d) {
          return height;
        });

      stacks
        .append("g")
        .attr("class", "area1-perps")
        .append("path")
        .datum(data)
        .attr("d", area)
        .attr("fill", "blue");

      stacks
        .append("g")
        .attr("class", "area2-captured")
        .append("path")
        .datum(data)
        .attr("d", area2)
        .attr("fill", "black");

      g.selectAll(".circle1")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "circle1")
        .attr("cx", function(d) {
          return margin + xScale(new Date(d.key));
        })
        .attr("cy", function(d) {
          return yScale(parseInt(d.value.nperps));
        });

      g.enter()
        .append("g")
        .attr("class", "x area-axis")
        .attr("transform", "translate(" + margin + "," + height + ")")
        .call(x_axis.tickFormat(d3.timeFormat("%Y-%m")))
        .selectAll("text")
        .style("text-anchor", "end");

      g.append("g")
        .attr("class", "y area-axis")
        .attr("transform", "translate(" + margin + ",0)")
        //.attr("transform", "translate(" + margin + ",0)")
        .call(y_axis);
    }

    //
    updatepoints();
    drawmap();

    drawconnection();
    drawbar();
    drawarea();
  };

  /**
   * setupSections - each section is activated
   * by a separate function. Here we associate
   * these functions to the sections based on
   * the section's index.
   *
   */
  var setupSections = function() {
    // activateFunctions are called each

    activateFunctions[0] = showIntro;
    activateFunctions[1] = showMap;
    activateFunctions[2] = showPoints;
    activateFunctions[3] = showPoints2;
    activateFunctions[4] = showConnect;
    activateFunctions[5] = showBar;
    activateFunctions[6] = showArea;
    activateFunctions[7] = showDetails;
    activateFunctions[8] = showFinal;

    // updateFunctions are called while
    // in a particular section to update
    // the scroll progress in that section.
    // Most sections do not need to be updated
    // for all scrolling and so are set to
    // no-op functions.
    for (var i = 0; i < 9; i++) {
      updateFunctions[i] = function() {};
    }
    updateFunctions[7] = updating;
  };

  /**
   * Control Flows
   *
   *
   */

  /**
   * showIntro - initial title
   *
   * hides: All the maps related item
   * (no previous step to hide)
   * shows: intro title
   *
   */
  function showIntro(backwards = false) {
    if (backwards) {
      d3.selectAll(".map.inner-layer").call(hide);
    } else {
      d3.selectAll(".intro-layer").call(show);
    }
  }

  /**
   * showMap - preparemap
   *
   * hides: intro title
   * hides: map Map
   * shows: filler count title
   *
   */

  function showMap(backwards = false) {
    hideAxis();
    if (backwards) {
      d3.selectAll(".Points-layer").call(hide);
      d3.selectAll(".map.inner-layer").call(show);
    } else {
      d3.selectAll(".intro-layer").call(hide);
      d3.selectAll(".map.inner-layer").call(show);
    }
  }

  /**
   * showPoints - show top countries on the map
   *
   * hides: barchart, text and axis
   * shows: map Map and highlighted
   * filler words. also ensures maps
   * are moved back to their place in the Map
   */
  function showPoints(backwards = false) {
    if (backwards) {
    } else {
      d3.selectAll(".Points-layer").call(show);
    }
  }
  function showPoints2(backwards = false) {
    if (backwards) {
      d3.selectAll(".Connections-layer").call(hide);
      d3.selectAll(".Points-layer").call(show);
    } else {
      d3.selectAll(".Points-layer").call(show);
    }
  }
  /**
   * showConnect -
   *
   * hides: map Map
   * hides: areasogram
   * shows: barchart
   *
   */
  function showConnect(backwards = false) {
    hideAxis();
    if (backwards) {
      d3.selectAll(".Bar-layer").call(hide);
      d3.selectAll(".map.inner-layer").call(show);
      d3.selectAll(".Connections-layer").call(show);
    } else {
      d3.selectAll(".Points-layer").call(hide);
      d3.selectAll(".Connections-layer").call(show);
    }
  }

  /**
   * showBar - shows the first part
   *  of the areasogram of filler words
   *
   * hides: barchart
   * hides: last half of areasogram
   * shows: first half of areasogram
   *
   */
  function showBar(backwards = false) {
    console.log("show bar");
    if (backwards) {
      d3.selectAll(".Area-layer").call(hide);
      d3.selectAll(".Bar-layer").call(show);
    } else {
      d3.selectAll(".map.inner-layer").call(hide);
      d3.selectAll(".Bar-layer").call(show);
    }
    showAxis(xAxisBar);
  }

  /**
   * showArea - show all countries
   *
   * hides: cough title and color
   * (previous step is also part of the
   *  areasogram, so we don't have to hide
   *  that)
   * shows: all areasogram bars
   *
   */
  function showArea(backwards = false) {
    if (backwards) {
      d3.selectAll(".Area-layer").call(show);
    } else {
      d3.selectAll(".Area-layer").call(show)
      d3.selectAll(".Bar-layer").call(hide);
    }
    hideAxis();
  }
  /**
   * showDetails - Deatil page of each country
   */

  function showDetails(backwards = false) {
    hideAxis();
  }

  /**
   * showFinal
   *
   * hides: nothing
   * (previous and next sections are areasograms
   *  so we don't have to hide much here)
   * shows: areasogram
   *
   */
  function showFinal(backwards = false) {
    // ensure the axis to areasogram one

    hideAxis();
  }

  /**
   * showAxis - helper function to
   * display particular xAxis
   *
   * @param axis - the axis to show
   *  (xAxisareas or xAxisBar)
   */
  function showAxis(axis) {
    g.select(".x.axis")
      .call(axis)
      .transition()
      .duration(500)
      .style("opacity", 1);
  }

  /**
   * hideAxis - helper function
   * to hide the axis
   *
   */
  function hideAxis() {
    g.select(".x.axis")
      .transition()
      .duration(500)
      .style("opacity", 0);
  }

  /**
   * UPDATE FUNCTIONS
   *
   * These will be called within a section
   * as the user scrolls through it.
   *
   * We use an immediate transition to
   * update visual elements based on
   * how far the user has scrolled
   *
   */

  /**
   * updating - increase/decrease
   *
   *
   * @param progress - 0.0 - 1.0 -
   *  how far user has scrolled in section
   */
  function updating(progress) {
    g.selectAll(".cough")
      .transition()
      .duration(0)
      .attr("opacity", progress);

    g.selectAll(".areas")
      .transition("cough")
      .duration(0)
      .style("fill", function(d) {
        return d.x0 >= 14 ? coughColorScale(progress) : "#008080";
      });
  }

  /**
   * activate -
   *
   * @param index - index of the activated section
   */
  chart.activate = function(index) {
    activeIndex = index;
    var sign = activeIndex - lastIndex < 0 ? -1 : 1;
    var scrolledSections = d3.range(lastIndex + sign, activeIndex + sign, sign);

    scrolledSections.forEach(function(i) {
      activateFunctions[i](sign < 0 ? true : false);
    });
    lastIndex = activeIndex;
  };

  /**
   * update
   *
   * @param index
   * @param progress
   */
  chart.update = function(index, progress) {
    updateFunctions[index](progress);
  };

  // return chart function
  return chart;
};

/**
 * display - called once data
 * has been loaded.
 * sets up the scroller and
 * displays the visualization.
 *
 * @param rawD - rawdata
 */
function display(rawD) {
  // create a new plot and
  // display it
  var plot = scrollVis();
  d3.select("#vis")
    .datum([rawD])
    .call(plot);

  // setup scroll functionality
  var scroll = scroller().container(d3.select("#graphic"));

  // pass in .step selection as the steps
  scroll(d3.selectAll(".step"));

  // setup event handling
  scroll.on("active", function(index) {
    d3.selectAll(".step")
      .style("opacity", function(d, i) {
        return i === index ? 1 : 0.1;
      })
      .classed("activate", function(d, i) {
        return i === index ? true : false;
      });
    d3.selectAll(".counter")
      .style("opacity", function(d, i) {
        return i === index ? 1 : 0.1;
      })
      .classed("activate", function(d, i) {
        return i === index ? true : false;
      });

    // activate current section
    plot.activate(index);
  });

  scroll.on("progress", function(index, progress) {
    plot.update(index, progress);
  });
}

// load data and display
display(dummy);
