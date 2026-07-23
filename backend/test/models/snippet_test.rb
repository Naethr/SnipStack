require "test_helper"

class SnippetTest < ActiveSupport::TestCase
  test "requires the fields expected by both clients" do
    snippet = Snippet.new

    assert_not snippet.valid?
    assert_includes snippet.errors[:title], "can't be blank"
    assert_includes snippet.errors[:language], "can't be blank"
    assert_includes snippet.errors[:code], "can't be blank"
  end

  test "normalizes persisted values" do
    snippet = Snippet.create!(
      title: "  Useful title  ",
      description: "  Details  ",
      language: "  Ruby  ",
      code: "  puts :ok  ",
      tags: "  rails, api  "
    )

    assert_equal "Useful title", snippet.title
    assert_equal "Details", snippet.description
    assert_equal "Ruby", snippet.language
    assert_equal "puts :ok", snippet.code
    assert_equal "rails, api", snippet.tags
  end
end
