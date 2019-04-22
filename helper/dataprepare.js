//gather and prepare all dataset
const Earth = GEODATA;
let World = WORLD;
let Major = MAIN;

// world(topology) key: character'000'
// maindata key: character'000'
// earth key: string [A-Z]{3}
const Feature = topojson.feature(WORLD, WORLD.objects.countries).features;
const CodeMap = new Map(NCODE.map(d => [d["country-code"], d["name"]]));
const NcodeMap = new Map(CODE.map(d => [d["eid"], d["code"]]));
const PointMap = new Map(
  GEOPOINTS.map(d => [d["ccn3"], d["latlng"].reverse()])
);
//organize data using EID
var DATA = d3
  .nest()
  .key(function(d) {
    return d.eid;
  })
  .entries(Major);
DATA = new Map(DATA.map(d => [d.key, d.values]));
const Percountry = new Map(
  d3
    .nest()
    .key(function(d) {
      return d.code;
    })
    .entries(CODE)
    .map(d => [d.key.padStart(3, "0"), d.values])
);

World.objects.countries.geometries.forEach(e => {
  e.name = CodeMap.get(e.id);
  e.eid = NcodeMap.get(e.id);
  e.nrecord = Percountry.get(e.id) ? Percountry.get(e.id).length : 0;
  return e;
});
Feature.forEach(e => {
  e.name = CodeMap.get(e.id);
  e.nrecord = Percountry.get(e.id) ? Percountry.get(e.id).length : 0;
  return e;
});
const ConnectionData = RELATE.map(function (e) { 
  let temp = e.origin.toString().padStart(3, "0");
  let temp2 = e.destination.toString().padStart(3, "0");
  e.Corigin = CodeMap.get(temp);
  e.Cdest = CodeMap.get(temp2);
  e.start = PointMap.get(temp);
  e.end = PointMap.get(temp2);
  
  return e;

})

let Cdata = Array.from({ length: Major.length }, () => {
  return {
    word: 0
  };
});


function parsedata(v) {
  var reg = /[-]{0,1}[\d]*[\.]{0,1}[\d]+/g;
  if (typeof v === "string" || v instanceof String) {
    return v.match(reg);
  } else if (typeof v === "number" || v instanceof Number) {
    return +v === 0 ? 0 : +v;
  } else if (!v === v) {
    return "Unknown";
  }
}
(formatMonth = d3.timeFormat("%b")),
  (formatYear = d3.timeFormat("%Y")),
  (formatTime = d3.timeFormat("%b,%Y"));

Major.forEach(function(d, i) {
  Cdata[i].index = d.eid;
  Cdata[i].order = i;
  Cdata[i].date = new Date(+d.iyear, +d.imonth, 00);
  Cdata[i].fdate = formatTime(Cdata[i].date);
  Cdata[i].month = formatMonth(Cdata[i].date);
  Cdata[i].year = formatYear(Cdata[i].date);
  Cdata[i].attack = +parsedata(d.attacktype1); //
  Cdata[i].claimhow = +parsedata(d.claimmod);
  Cdata[i].Compete = +parsedata(d.compclaim);
  Cdata[i].target = +parsedata(d.targtype1); //
  Cdata[i].weapon = +parsedata(d.weaptype1); //
  Cdata[i].success = +parsedata(d.success) !== 0 ? "NO" : "Yes"; // barchart up/down
  Cdata[i].suicide = +parsedata(d.suicide) !== 0 ? "No" : "Yes";
  Cdata[i].extended = +parsedata(d.extended) !== 0 ? "No" : "Yes"; //not using
  Cdata[i].multiple = +parsedata(d.multiple) !== 0 ? "No" : "Yes"; //
  Cdata[i].claimed = +parsedata(d.claimed) !== 0 ? "No" : "Yes";
  Cdata[i].nperps = +parsedata(d.nperps); //terriost
  Cdata[i].nperpcap = +parsedata(d.nperpcap); //captured
  Cdata[i].nkill = +parsedata(d.nkill); //radar
  Cdata[i].nwound = +parsedata(d.nwound); //radar
  Cdata[i].nhostkid = +parsedata(d.nhostkid); //radar
  Cdata[i].Ransomamt = +parsedata(d.Ransomamt);
  Cdata[i].ransompaid = +parsedata(d.ransompaid);
  Cdata[i].country = NcodeMap.get(d.eid); //map
  Cdata[i].location = d.country_txt; //map
  Cdata[i].gname = d.gname;
});

// prepare data for terroist summaries

var CRS = crossfilter(Cdata);

var Gll = CRS.groupAll();
//

var Dgname = CRS.dimension(function(d) {
  return d.gname;
});
TerroristData = Dgname.group().top(Infinity);
var PointsData=
d3.nest()
  .key(function(d) {
    return d.country;
  })
  .rollup(function(leaves) {
    return leaves.length;
  })
  .entries(Cdata);
PointsData.sort(function(a, b) {
        return  b.value-a.value;
});
      
PointsData.forEach(function (e) {
  e.code = e.key.padStart(3, "0");
});
PointsData.forEach(function (e) {
  let found = Feature.find(function (element) {
    return element.id == e.code;
  });
  e.feature = found;

});
PointsData.forEach(function (e) {
  e.coordinates = PointMap.get(e.code);
});
const ClaimsData=
d3.nest()
  .key(function(d) {
    return d.fdate;
  }).rollup(function (leaves) {
    
    return {
      ncaps: d3.sum(leaves, function (g) { return Math.max(0,g.nperps); }),
      nperps: d3.sum(leaves, function (g) { return Math.max(g.ncaps,0); }),
      date: leaves[0].date
    }
  })
  
  .entries(Cdata);

// var ex=barchart().dimension(Gyear).group(Gyear.group(d3.timeYear));
console.log(ClaimsData);
var trans = d3
  .transition()
  .duration(303)
  .ease(d3.easeLinear);
