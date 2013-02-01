//= require "jquery-1.8.3.min"
//= require "prettify"

$(function() {
  $('.article-content a').attr('target', '_blank');

  $('.article-content code, .article-content pre').addClass('prettyprint');
  $('.article-content pre').addClass('linenums');
  prettyPrint();

  if($('.about').length > 0) {
    $('.about-link').addClass('active');
  }
  else {
    $('.blog-link').addClass('active');
  }

  $('.search').on('focus', function() {
    $('.search-container').addClass('active');
    $('.social-links').addClass('striction');
  }).on('blur', function() {
    $('.search-container').removeClass('active');
    $('.social-links').removeClass('striction');
  });
});