require 'debugger'
base_path = "http://www.zation.me"

def get_time_string time
  p time.strftime "%Y-%m-%dT%H:%M:%S%:z"
  time.to_s "%Y-%m-%d" + "T" + time.to_s("%H:%M:%S") + "+08:00"
end

xml.instruct!
xml.urlset "xmlns" => "http://www.sitemaps.org/schemas/sitemap/0.9",
"xmlns:xsi" => "http://www.w3.org/2001/XMLSchema-instance",
"xsi:schemaLocation" => "http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd" do
  xml.url do
    xml.loc base_path + "/"
    xml.lastmod Time.now.strftime "%Y-%m-%dT%H:%M:%S" + "+08:00"
    xml.changefreq "weekly"
    xml.priority "1.00"
  end
  blog.articles.each do |article|
    xml.url do
      xml.loc base_path + article.url
      xml.lastmod Time.now.strftime "%Y-%m-%dT%H:%M:%S" + "+08:00"
      xml.changefreq "monthly"
      xml.priority "0.80"
    end
  end
end