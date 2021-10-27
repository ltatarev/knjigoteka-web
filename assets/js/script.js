/* $(parent.window.document).scroll(function() {
    $("#first").hide().fadeIn(4000);
});
 */

// FIRST TITLE SMOOTH APPEAR
$(document).ready(() => {
  $("#second").hide();
  $("#first").hide().fadeIn(1700);
  setTimeout(() => {
    $("#second").fadeIn(2000);
  }, 200);
});

$(document).scroll(() => {
  let scrollLeft = $(document).scrollLeft();
  let scrollTop = $(document).scrollTop();
  //console.log(scrollLeft, scrollTop);
});

// SCROLL TO TOP
$("#return-to-top").hide();
$(document).scroll(() => {
  if ($(document).scrollTop() >= 50) {
    // If page is scrolled more than 50px
    $("#return-to-top").fadeIn("slow"); // Fade in the arrow
  } else {
    $("#return-to-top").fadeOut();
  }
});
