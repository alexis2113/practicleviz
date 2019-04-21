
const myArray=[
        "The sky",
        "above",
        "the port",
        "was",
        "the color of television",
        "tuned",
        "to",
        "a dead channel",
        ".",
        "All",
        "this happened",
        "more or less",
        ".",
        "I",
        "had",
        "the story",
        "bit by bit",
        "from various people",
        "and",
        "as generally",
        "happens",
        "in such cases",
        "each time",
        "it",
        "was",
        "a different story",
        ".",
        "It",
        "was",
        "a pleasure",
        "to",
        "burn"
      ]
/**
 * container - get/set the parent element
 * of the sections. Useful for if the
 * scrolling doesn't start at the very top
 * of the page.
 *
 * 
 * @param {Boolean} date - whether include dates
 */
function makedummy( date = false) {
  function randomDate(start, end) {
    return new Date(
      start.getTime() + Math.random() * (end.getTime() - start.getTime())
    );
  }
  let dummydata = Array.from({ length: 100 }, () => {
    return {
      word: myArray[Math.floor(Math.random() * myArray.length)],
      time: Math.min(Math.random()*50,25),
      filter: Math.round(Math.random())
    };
  });

  

  //making dummy data
  //
 
  return dummydata;
}
dummy=makedummy();
function tilechart(data) {
  const svg = d3.select("#tilechart").append("svg");
  //your code..
}
