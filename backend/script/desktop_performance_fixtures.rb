TAG = "desktop-perf-20260723"
SUPPORTED_COUNTS = [ 3, 100, 1_000 ].freeze

case ARGV.fetch(0, "create")
when "create"
  count = Integer(ARGV.fetch(1, "1000"), 10)
  abort "Fixture count must be one of: #{SUPPORTED_COUNTS.join(", ")}." unless SUPPORTED_COUNTS.include?(count)

  existing = Snippet.where("tags LIKE ?", "%#{TAG}%").count
  abort "Performance fixtures already exist (#{existing})." unless existing.zero?

  now = Time.current
  rows = (1..count).map do |index|
    {
      title: "Desktop perf 20260723 #{index}",
      description: "Temporary WSLg performance fixture",
      language: "JavaScript",
      code: "const desktopPerf = #{index};",
      tags: TAG,
      created_at: now,
      updated_at: now
    }
  end

  Snippet.insert_all!(rows)
  puts "created=#{Snippet.where("tags LIKE ?", "%#{TAG}%").count}"
when "delete"
  deleted = Snippet.where("tags LIKE ?", "%#{TAG}%").delete_all
  remaining = Snippet.where("tags LIKE ?", "%#{TAG}%").count
  puts "deleted=#{deleted} remaining=#{remaining}"
else
  abort "Usage: bin/rails runner script/desktop_performance_fixtures.rb [create|delete] [3|100|1000]"
end
