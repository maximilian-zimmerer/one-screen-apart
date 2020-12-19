let toggle;
let spans = $(".info-container").find("span, hr");

$("document").ready(() => {
  $("a").hover(() => {
    $(".link-icon").toggleClass("fadeIn");
  });
});
$(".menu-icon").click(() => {
  // set scroll to 0 before animation
  $(".info-container").animate(
    {
      scrollTop: 0,
    },
    {
      duration: 100,
      complete: animate(toggle),
    }
  );
});
function animate(bool) {
  let timer = 50; // animate elements
  $.each(spans, (i, item) => {
    setTimeout(() => {
      bool ? $(item).removeClass("fadeIn") : $(item).addClass("fadeIn");
    }, timer);
    timer += 50;
  });
  hasTouch()
    ? $(".app-container").fadeToggle()
    : $(".app-container, .notification-wrapper").fadeToggle(); // toggle app
  $(".info-container").toggleClass("noTouch"); // prevent pointer events
  $(".menu-icon").toggleClass("rotate"); // animate background
  $("body").toggleClass("invert"); // animate background
  spans = reverseArr(spans); // reverse animtation oder
  toggle = !toggle; // toggle boolean
}
function reverseArr(input) {
  let newArr = [];
  for (let i = input.length - 1; i >= 0; i--) {
    newArr.push(input[i]);
  }
  return newArr;
}
function hasTouch() {
  let hasTouchScreen = false;
  if ("particlesMaxTouchPoints" in navigator) {
    hasTouchScreen = navigator.particlesMaxTouchPoints > 0;
  } else if ("msparticlesMaxTouchPoints" in navigator) {
    hasTouchScreen = navigator.msparticlesMaxTouchPoints > 0;
  } else {
    var mQ = window.matchMedia && matchMedia("(pointer:coarse)");
    if (mQ && mQ.media === "(pointer:coarse)") {
      hasTouchScreen = !!mQ.matches;
      // fallback
    } else if ("orientation" in window) {
      hasTouchScreen = true;
    } else {
      // agent sniffing fallback
      var UA = navigator.userAgent;
      hasTouchScreen =
        /\b(BlackBerry|webOS|iPhone|IEMobile)\b/i.test(UA) ||
        /\b(Android|Windows Phone|iPad|iPod)\b/i.test(UA);
    }
  }
  return hasTouchScreen;
}
