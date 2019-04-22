(function () {
  $(document).ready(function () {
  
    // border hover effect;
    $(".countryg").addClass("country-map1").on("mouseover", function (e) {
      $(this).find("path").css("stroke-width", "4").css("stroke", "white");
    }).on("mouseout", function (e) {
      $(this).find("path").css("stroke-width", "2").css("stroke", "white");
    });
    
    $('<defs><linearGradient id="linear" x1="0%" y1="0%" x2="100%" y2="100%">' +
      '<stop offset="0%" stop-color="#6cc24a"><animate attributeName="stop-color" values="#6cc24a; #36ba8d; #00b2d0; #36ba8d; #6cc24a" dur="10s" repeatCount="indefinite">' +
      '</animate></stop><stop offset="50%"   stop-color="#36ba8d">' +
      '<animate attributeName="stop-color" values="#36ba8d; #6cc24a; #9effdb; #00b2d0; #36ba8d" dur="10s" repeatCount="indefinite"></animate>' +
      '</stop><stop offset="100%"   stop-color="#00b2d0">' +
      '<animate attributeName="stop-color" values="#00b2d0; #36ba8d; #6cc24a; #36ba8d; #00b2d0" dur="10s" repeatCount="indefinite"></animate>' +
      '</stop></linearGradient></defs>')
      .insertBefore(".outer-map");

    /** Awesome tooltip idea from Eric Porter https://codepen.io/EricPorter/pen/xdJLaG?editors=1000*/
    $('.requiretooltip')
      .hover(function () {
        var title = $(this).attr('message');
        $(this).data('tipText', title);
        if (title == '') { }
        else {
          $('<p class="tooltip-active"></p>').html(title).appendTo('.tpholder').delay(800).fadeIn("slow");
          $('.tooltip-active').addClass("active");
        }
      }, function () {
        $(this).attr('message', $(this).data('tipText'));
        $('.tooltip-active').removeClass("active").delay(200).fadeOut("slow");
      }).mousemove(function (e) {
        var mousex = e.pageX + 200 > 800 ? e.pageX - 200 : e.pageX;
        var mousey = e.pageY + 100 > 800 ? e.pageY - 150 : e.pageY + 24;
        $('.tooltip-active').css({
          top: mousey,
          left: mousex
        })
      }).mouseout(function (e) {
        $('body').find("p.tooltip-active").delay(200).remove();
      });

    window.onscroll = function () {
      scrollsticky();
    };

    var header = $(".section-title");
    var sticky = header.offsetTop;

    function scrollsticky() {
      if (window.pageYOffset > sticky ){
    console.log(window.pageYOffset);
    header.addClass("sticky");
  } else {
    header.removeClass("sticky");
  }
}



  
 




  })
})();
