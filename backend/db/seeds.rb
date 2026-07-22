snippets = [
  {
    title: "Rails routes",
    description: "Show all available Rails routes.",
    language: "bash",
    code: "bin/rails routes",
    tags: "rails, routes, debug"
  },
  {
    title: "Start Rails server",
    description: "Run the Rails API on port 3000.",
    language: "bash",
    code: "bin/rails server -b 127.0.0.1 -p 3000",
    tags: "rails, server, api"
  },
  {
    title: "React fetch example",
    description: "Basic fetch call to an API endpoint.",
    language: "javascript",
    code: "fetch('http://127.0.0.1:3000/api/v1/snippets').then(response => response.json())",
    tags: "react, fetch, api"
  }
]

snippets.each do |attributes|
  snippet = Snippet.find_or_initialize_by(title: attributes[:title])
  snippet.update!(attributes)
end
