xml.instruct!
xml.feed "xmlns" => "http://www.w3.org/2005/Atom" do
  xml.title "Zation's Blog"
  xml.subtitle "Coding for fun"
  xml.id "http://blog.url.com/"
  xml.link "href" => "http://zaiton.me/"
  xml.link "href" => "http://zation.me/feed.xml", "rel" => "self"
  xml.updated blog.articles.first.date.to_time.iso8601
  xml.author { xml.name "Zation" }

  blog.articles[0..5].each do |article|
    xml.entry do
      if article.data.subtitle
        xml.title article.title + "——" + article.data.subtitle
      else
        xml.title article.title
      end
      xml.link "rel" => "alternate", "href" => article.url
      xml.id article.url
      xml.published article.date.to_time.iso8601
      xml.updated article.date.to_time.iso8601
      xml.author { xml.name "Article Author" }
      xml.summary article.summary, "type" => "html"
      xml.content article.body, "type" => "html"
    end
  end
end