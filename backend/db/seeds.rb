email = ENV["SNIPSTACK_SEED_EMAIL"]&.strip
raise ArgumentError, "Set SNIPSTACK_SEED_EMAIL to an existing user's email before seeding." if email.blank?

owner = User.find_by(email: email.downcase)
raise ArgumentError, "No user found for SNIPSTACK_SEED_EMAIL=#{email.inspect}; register that account first." unless owner

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
  },
  {
    title: "Debounce a search field",
    description: "Delay a search request until the user pauses typing; clear the timer on cleanup.",
    language: "javascript",
    code: "useEffect(() => {\n  const timer = setTimeout(() => search(query), 300);\n  return () => clearTimeout(timer);\n}, [query]);",
    tags: "react, search, performance"
  },
  {
    title: "Find slow PostgreSQL queries",
    description: "Inspect the queries taking the most total execution time with pg_stat_statements enabled.",
    language: "sql",
    code: "SELECT query, calls, round(total_exec_time::numeric, 1) AS total_ms\nFROM pg_stat_statements\nORDER BY total_exec_time DESC\nLIMIT 10;",
    tags: "postgresql, observability, sql"
  },
  {
    title: "Retry a transient request",
    description: "Retry a failed request with a short increasing delay; stop after three attempts.",
    language: "javascript",
    code: "async function retry(request, attempts = 3) {\n  for (let attempt = 0; attempt < attempts; attempt++) {\n    try { return await request(); }\n    catch (error) {\n      if (attempt === attempts - 1) throw error;\n      await new Promise(resolve => setTimeout(resolve, 200 * (attempt + 1)));\n    }\n  }\n}",
    tags: "network, async, resilience"
  },
  {
    title: "Validate a JSON fixture",
    description: "Check that a fixture is valid JSON before sending it to an API.",
    language: "bash",
    code: "python -m json.tool sample.json > /dev/null && echo 'Valid JSON'",
    tags: "json, cli, debug"
  }
]

Snippet.transaction do
  snippets.each do |attributes|
    snippet = owner.snippets.find_or_initialize_by(title: attributes[:title])
    snippet.update!(attributes)
  end
end
