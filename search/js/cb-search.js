 $(document).ready(function () {
  var initial = 0;
  var show = true;

  var toggleSearch = function (visible) {
    initial = 0;
    show = !visible;
    var visibility = visible ? 'block' : 'none';
    $("#search-content").val("");
    $(".search-tool").css("display", visibility);
  };

  var shouldToggle = function (time) {
    var gap = time - initial;
    initial = time;
    return gap < 500;
  };

  $(document).keyup(function (e) {
    var now = new Date().getTime();
    if (e.keyCode == 17 && shouldToggle(now)) {
      toggleSearch(show);
    } else if (e.keyCode == 27) {
      toggleSearch(false);
    }
  });

	$("#search-content").keyup(function (e) {
    var now = new Date().getTime();
    if (e.keyCode == 17 && shouldToggle(now)) {
      toggleSearch(show);
    }
  });

  $("#close-btn").click(function () {
    toggleSearch(false);
  });
  $("#search-btn").click(function() {
    toggleSearch(true);
  });

  var is_visible = false;
  $(window).scroll(function() {
	if($(window).scrollTop() > parseInt($(window).height() / 4)) {
		if(!is_visible) {
			$('#scroll-btn').show();
			is_visible = true;
		}
	} else {
		if(is_visible) {
			$('#scroll-btn').hide();
			is_visible = false;
		}
	}
  });

  $('#scroll-btn').click(function() {
	 $('html,body').animate({scrollTop: 0}, "slow");
  });
 
  $.getJSON("/search/cb-search.json")
    .done(function (data) {
      if (data.code == 0) {
        $("#search-content").typeahead({
          source: data.data,
          displayText: function (item) {
            return item.title;
          },
          afterSelect: function (item) {
            window.location.href = item.url;
          }
        });
      }
    });
});
