/**
 *
 */

var width = 900;
var height = 720;
var margin = {
  top: 0,
  left: 20,
  bottom: 30,
  right: 10
};
function controlbar(show) { 
    d3
    .selectAll(".Bar-layer")
    .transition()
    .duration(100)
    .ease(d3.easeLinear)
    .attr("opacity", show);
}
function controlmap(showbase,showp=0) {
  d3.selectAll(".border")
    .transition()
    .duration(100)
    .ease(d3.easeLinear)
    .attr("opacity", showbase);
    d3.selectAll(".countries-layer")
      .transition()
      .duration(100)
      .ease(d3.easeLinear)
      .attr("opacity", showbase);
  
    d3.selectAll(".Points-layer")
      .transition()
      .duration(100)
      .ease(d3.easeLinear)
      .attr("opacity", showp);
  
     d3.selectAll(".Connections-layer")
       .transition()
       .duration(100)
       .ease(d3.easeLinear)
       .attr("opacity", 1-showp); 

    }

    
  
  


// recoshowrding plots indexes

var mapdata = World;
var bardata = TerroristData.slice(1, 10);
var connectiondata = ConnectionData;
var pointsdata = PointsData.slice(0, 10);
var histData = ClaimsData;
var routedata = d3
  .nest()
  .key(function(d) {
    return [d.Corigin, d.Cdest];
  })
  .rollup(function(leaves) {
    return { value: leaves.length, start: leaves[0].start, end: leaves[0].end };
  })
  .entries(connectiondata);
// Updates the visualization
console.log("r", routedata);
routedata;
var arcWidth = d3
  .scaleLinear()
  .domain(
    d3.extent(
      routedata,
      d =>
        function(d) {
          return d.value;
        }
    )
  )
  .range([0.1, 7]);
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

  var xHistScale = d3
    .scaleLinear()
    .domain([0, 30])
    .range([0, width - 20]);
  var yHistScale = d3.scaleLinear().range([height, 0]);
  var coughColorScale = d3
    .scaleLinear()
    .domain([0, 1.0])
    .range(["#008080", "red"]);
  var Barwidth = d3
    .scaleLinear()
    .domain([0, d3.max(bardata, d => d.value)])
    .range([0, width]);
  var xAxisBar = d3.axisBottom().scale(Barwidth);
  var xAxisHist = d3
    .axisBottom()
    .scale(xHistScale)
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

      // get aggregated histogram data

      // set histogram's domain
      var histMax = d3.max(histData, function(d) {
        return d.value;
      });
      yHistScale.domain([0, histMax]);

      setupVis(mapdata, connectiondata, pointsdata, bardata, histData);

      setupSections(mapdata, connectiondata, pointsdata, bardata, histData);
    });
  };

  /**
   * @param mapdata - geofeatures for drawing maps
   * @param g - d3-selection,place holder for maps
   */

  function drawmap() {
    //clearing all remaining elements

    /** Awesome tooltip idea from Eric Porter https://codepen.io/EricPorter/pen/xdJLaG?editors=1000*/

    var selection2 = d3
      .select(".countries-layer")
      .selectAll(".map.countries.removeable.requiretooltip")
      .data(Feature)
      .attr("message", d => mapmsg(d.name, d.nrecord));

    selection2
      .enter()
      .append("g")
      .attr("message", d => mapmsg(d.name, d.nrecord))
      .attr("class", "map countries removeable requiretooltip")
      .append("path")
      .attr("id", d => d.id)
      .attr("d", path)
      .attr("fill", d => mapcolor(d.nrecord))
      .attr("fill-opacity", 1)
      .attr("stroke-width", 2)
      .attr("opacity", 0)
      .transition()
      .duration(100)
      .ease(d3.easeLinear)
      .attr("opacity", 1);

    d3.selectAll(".map.border").attr("opacity", 1);

    selection2
      .transition()
      .duration(100)
      .ease(d3.easeLinear)
      .attr("opacity", 0);

    selection2.exit().remove();
  }

  function updatepoints() {
    var selection = d3
      .select(".Points-layer")
      .selectAll(".Points-layer.points")
      .data(pointsdata)
      .attr("x", d => projection([d.coordinates[0], d.coordinates[1]])[0] - 16)
      .attr("y", d => projection([d.coordinates[0], d.coordinates[1]])[1] - 38)
      .attr("xlink:href", "#pinpoints")
      .attr("fill", "blue")
      .attr("fill-opacity", 0.6);

    selection
      .enter()
      .append("use")
      .attr("class", "points Points-layer")
      .attr("id", d => d.feature.name)
      .attr("x", d => projection([d.coordinates[0], d.coordinates[1]])[0] - 19)
      .attr("y", d => projection([d.coordinates[0], d.coordinates[1]])[1] - 40)
      .attr("xlink:href", "#pinpoints")
      .attr("fill", "blue")
      .attr("opacity", 0)
      .transition()
      .duration(100)
      .ease(d3.easeLinear)
      .attr("opacity", 1)
      .attr("fill-opacity", 0.6);

    // Exit selection: Remove elements without data from the DOM
    selection
      .transition()
      .duration(100)
      .ease(d3.easeLinear)
      .attr("opacity", 0);

    selection.exit().remove();
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
      .transition()
      .duration(10);

    //exit
    pathArcs.exit().remove();
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
    var margin = 20;
    var xscale = d3
        .scaleLinear()
        .domain([0, d3.max(bardata, d => d.value)])
        .range([width - margin, 0]),
      yscale = d3
        .scaleBand()
        .domain(d3.range(bardata.length))
        .range([margin, height - margin])
        .round(true)
        .paddingInner(0.8);
    var Barheight = (height - 20) / bardata.length;
    var g = d3
      .select(".Bar-layer")
      .selectAll(".terrorist-bars.Bar-layer")
      .data(bardata);

    g.exit().remove();

    g.enter()
      .append("rect")
      .join(g)
      .attr("class", "terrorist-bars Bar-layer")
      .attr("x", 0)
      .attr("y", (d, i) => yscale(i) - 40)
      .attr("height", Barheight)
      .transition()
      .duration(100)
      .ease(d3.easeLinear)
      .attr("width", d => xscale(d.value));
  }

  /**
   * setupVis - creates initial elements for all
   * sections of the visualization.
   *
   * @param mapdata - data
   * @param {Array.<Object>} bardata - summarize top terriost,
   *  array of objects with properties [gname,counts]
   * @param {Array.<Array>} histData - Array with length 1 include filtered data
   */
  var setupVis = function(
    mapdata,
    connectiondata,
    pointsdata,
    bardata,
    histData
  ) {
    console.log("bar", bardata);
    console.log("hist", histData);
    console.log("map", mapdata);
    console.log("points", pointsdata);
    console.log("con", connectiondata);
    // axis
    g.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")")
      .call(xAxisBar);
    g.select(".x.axis").style("opacity", 0);

    g.append("g").attr("class", "section-Intro Intro-layer");
    //create new group for maps
    g.append("g").attr("class", "section-map Map-layer");
    const MAPG = d3.select(".Map-layer");
    MAPG.append("g")
      .attr("class", "Map-layer map")
      .attr("id", "Map-outlayer")
      .append("g")
      .attr("class", "map inner-layer")
      .append("path")
      .datum(topojson.mesh(World, World.objects.countries, (a, b) => a !== b))
      .attr("d", path)
      .attr("class", "map border")
      .attr("stroke", "white")
      .attr("stroke-width", 2);

    d3.select(".map.inner-layer")
      .append("g")
      .attr("class", "map countries-layer");
    d3.select(".map.inner-layer")
      .append("g")
      .attr("class", "map Points-layer");
    d3.select(".map.inner-layer")
      .append("g")
      .attr("class", "map Connections-layer");

    //
    g.append("g").attr("class", "section-terrorist Bar-layer").attr("opacity",0);

    g.append("g").attr("class", "section-claims Claims-layer");

    /**
     *
     * @param histData - datas for drawing bars
     * @param g - datas for drawing bars
     */
    function drawclaims(histData, g) {
      var hist = g.selectAll(".hist").data(histData);
      var histE = hist
        .enter()
        .append("rect")
        .attr("class", "hist");
      hist = hist
        .merge(histE)
        .attr("x", function(d) {
          return xHistScale(d.x0);
        })
        .attr("y", height)
        .attr("height", 0)
        .attr(
          "width",
          xHistScale(histData[0].x1) - xHistScale(histData[0].x0) - 1
        )
        .attr("fill", barColors[0])
        .attr("opacity", 0);
    }

    //

    drawmap();
    updatepoints();
    drawbar();
  };

  /**
   * setupSections - each section is activated
   * by a separate function. Here we associate
   * these functions to the sections based on
   * the section's index.
   *
   */
  var setupSections = function(
    mapdata,
    connectiondata,
    pointsdata,
    bardata,
    histData
  ) {
    // activateFunctions are called each
    // time the active section changes
    activateFunctions[0] = showIntro;
    activateFunctions[1] = showMap;
    activateFunctions[2] = showPoints;
    activateFunctions[3] = showPoints2;
    activateFunctions[4] = showConnect;
    activateFunctions[5] = showBar;
    activateFunctions[6] = showHist;
    activateFunctions[7] = showFinal;
    activateFunctions[8] = showDetail;

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
  function showIntro() {
    console.log("begin");
    
    controlmap(0,0);
     controlbar(0,0);
  }

  /**
   * showMap - preparemap
   *
   * hides: intro title
   * hides: map Map
   * shows: filler count title
   *
   */

  function showMap() {
    hideAxis();
     
    controlmap(1, 0);
    controlbar(0, 0);
    
  }

  /**
   * showPoints - show top countries on the map
   *
   * hides: barchart, text and axis
   * shows: map Map and highlighted
   * filler words. also ensures maps
   * are moved back to their place in the Map
   */
  function showPoints() {
    hideAxis();
    controlmap(1, 1);
    
  }
  function showPoints2() {
    console.log("show points2");
    controlmap(1, 1);
  }
  /**
   * showConnect - barchart
   *
   * hides: map Map
   * hides: histogram
   * shows: barchart
   *
   */
  function showConnect() {
    
    
    drawconnection();
    controlmap(1);
    hideAxis();
    
  }

  /**
   * showBar - shows the first part
   *  of the histogram of filler words
   *
   * hides: barchart
   * hides: last half of histogram
   * shows: first half of histogram
   *
   */
  function showBar() {
    console.log("show bar");
    
    controlmap(0);
    controlbar(1);
    showAxis(xAxisBar);
  }

  /**
   * showHist - show all histogram
   *
   * hides: cough title and color
   * (previous step is also part of the
   *  histogram, so we don't have to hide
   *  that)
   * shows: all histogram bars
   *
   */
  function showHist() {
    console.log("show histclaim");
    // ensure the axis to histogram one
    showAxis(xAxisHist);

    g.selectAll(".cough")
      .transition()
      .duration(0)
      .attr("opacity", 0);

    // named transition to ensure
    // color change is not clobbered
    g.selectAll(".hist")
      .transition("color")
      .duration(500)
      .style("fill", "#008080");

    g.selectAll(".hist")
      .transition()
      .duration(1200)
      .attr("y", function(d) {
        return yHistScale(d.length);
      })
      .attr("height", function(d) {
        return height - yHistScale(d.length);
      })
      .style("opacity", 1.0);
  }
  /**
   * showDetail
   */

  function showDetail() {
    console.log("detail");
  }

  /**
   * showCough
   *
   * hides: nothing
   * (previous and next sections are histograms
   *  so we don't have to hide much here)
   * shows: histogram
   *
   */
  function showFinal() {
    // ensure the axis to histogram one
    showAxis(xAxisHist);

    g.selectAll(".hist")
      .transition()
      .duration(600)
      .attr("y", function(d) {
        return yHistScale(d.length);
      })
      .attr("height", function(d) {
        return height - yHistScale(d.length);
      })
      .style("opacity", 1.0);
  }

  /**
   * showAxis - helper function to
   * display particular xAxis
   *
   * @param axis - the axis to show
   *  (xAxisHist or xAxisBar)
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

    g.selectAll(".hist")
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
      activateFunctions[i]();
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
    // highlight current step text
    d3.selectAll(".step").style("opacity", function(d, i) {
      return i === index ? 1 : 0.1;
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
