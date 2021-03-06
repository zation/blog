//= require "_jquery-1.8.3.min"
//= require "_prettify"
//= require "_articles"
$(function() {
  $('.article-content a').attr('target', '_blank');

  hljs.initHighlightingOnLoad();

  if ($('.about').length > 0) {
    $('.about-link').addClass('active');
  } else if ($('.resume').length > 0) {
    $('.resume-link').addClass('active');
  } else {
    $('.blog-link').addClass('active');
  }

  var $search = $('.search');
  $search.on('focus', function() {
    $('.search-container').addClass('active');
    $('.social-links').addClass('striction');
  }).on('blur', function() {
    $('.search-container').removeClass('active');
    $('.social-links').removeClass('striction');
    $('.search').val('');
    setTimeout(function() {
      $('.search-result').html('');
    }, 100);
  });

  function isTagsMacth(tags, searchValue) {
    var isMatch = false;
    $.each(tags, function() {
      if (this.toLowerCase().indexOf(searchValue) >= 0) {
        isMatch = true;
        return;
      }
    });
    return isMatch;
  }

  $search.on('keydown, keyup', function() {
    $('.search-result').html('');
    var searchValue = $('.search').val().toLowerCase();
    if (searchValue !== '') {
      $.each(articles, function() {
        if (this.title.toLowerCase().indexOf(searchValue) >= 0 || isTagsMacth(this.tags, searchValue)) {
          var item = $('<li><a href="' + this.link + '">' + this.title + '</a></li>');
          $('.search-result').append(item);
        }
      });
    }
  });
});