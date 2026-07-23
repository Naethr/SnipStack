require "test_helper"

class SnippetTest < ActiveSupport::TestCase
  test "is valid with required fields" do
    snippet = Snippet.new(
      title: "Rails console",
      language: "bash",
      code: "bin/rails console"
    )

    assert snippet.valid?
  end

  test "requires title" do
    snippet = Snippet.new(language: "bash", code: "echo test")

    assert_not snippet.valid?
    assert_includes snippet.errors[:title], "can't be blank"
  end

  test "requires language" do
    snippet = Snippet.new(title: "Echo", code: "echo test")

    assert_not snippet.valid?
    assert_includes snippet.errors[:language], "can't be blank"
  end

  test "requires code" do
    snippet = Snippet.new(title: "Echo", language: "bash")

    assert_not snippet.valid?
    assert_includes snippet.errors[:code], "can't be blank"
  end

  test "normalizes tags" do
    snippet = Snippet.new(
      title: "Tag test",
      language: "ruby",
      code: "puts 'hello'",
      tags: "Rails, rails, API, "
    )

    snippet.valid?

    assert_equal "rails, api", snippet.tags
  end
end
