//= require "jquery-1.8.3.min"
//= require "prettify"

$(function() {
  $('.article-content a').attr('target', '_blank');

  $('.article-content code, .article-content pre').addClass('prettyprint');
  $('.article-content pre').addClass('linenums');
  prettyPrint();
});