require "test_helper"

class SeedsTest < ActiveSupport::TestCase
  test "requires an existing, explicitly selected owner without writing snippets" do
    previous = ENV.delete("SNIPSTACK_SEED_EMAIL")
    count = Snippet.count

    error = assert_raises(ArgumentError) { load Rails.root.join("db/seeds.rb") }
    assert_match(/SNIPSTACK_SEED_EMAIL/, error.message)
    assert_equal count, Snippet.count

    ENV["SNIPSTACK_SEED_EMAIL"] = "missing@example.com"
    error = assert_raises(ArgumentError) { load Rails.root.join("db/seeds.rb") }
    assert_match(/No user found/, error.message)
    assert_equal count, Snippet.count
  ensure
    ENV["SNIPSTACK_SEED_EMAIL"] = previous
  end

  test "seeds only the selected user and can be replayed without duplicates" do
    previous = ENV["SNIPSTACK_SEED_EMAIL"]
    owner = users(:one)
    other = users(:two)
    ENV["SNIPSTACK_SEED_EMAIL"] = owner.email
    other.snippets.create!(title: "Start Rails server", language: "bash", code: "echo other")
    original_other_code = other.snippets.find_by!(title: "Start Rails server").code

    load Rails.root.join("db/seeds.rb")
    titles = owner.snippets.pluck(:title)
    assert_equal 7, titles.length
    assert_includes titles, "Rails routes"
    assert_includes titles, "Start Rails server"
    assert_equal original_other_code, other.snippets.find_by!(title: "Start Rails server").code

    load Rails.root.join("db/seeds.rb")
    assert_equal titles.sort, owner.snippets.pluck(:title).sort
    assert_equal 7, owner.snippets.where(title: titles).count
  ensure
    ENV["SNIPSTACK_SEED_EMAIL"] = previous
  end
end
