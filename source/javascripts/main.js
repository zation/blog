//= require "_jquery-1.8.3.min"
//= require "_prettify"
//= require "_articles"

$(function() {
  $('.article-content a').attr('target', '_blank');

  $('.article-content code, .article-content pre').addClass('prettyprint');
  $('.article-content pre').addClass('linenums');
  prettyPrint();

  if($('.about').length > 0) {
    $('.about-link').addClass('active');
  } else {
    $('.blog-link').addClass('active');
  }

  $('.search').on('focus', function() {
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

  $('.search').on('keydown, keyup', function() {
    $('.search-result').html('');
    var searchValue = $('.search').val().toLowerCase();
    if(searchValue !== '') {
      $.each(articles, function() {
        if(this.title.toLowerCase().indexOf(searchValue) >= 0) {
          var item = $('<li><a href="' + this.link + '">' + this.title + '</a></li>');
          $('.search-result').append(item);
        }
      });
    }
  });
});