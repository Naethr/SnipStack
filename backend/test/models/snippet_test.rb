require "test_helper"

class SnippetTest < ActiveSupport::TestCase
  test "database rejects a snippet referencing a missing user" do
    assert_not User.exists?(id: -1)

    assert_raises(ActiveRecord::InvalidForeignKey) do
      ActiveRecord::Base.transaction(requires_new: true) do
        Snippet.connection.execute(<<~SQL)
          INSERT INTO snippets (title, language, code, user_id, created_at, updated_at)
          VALUES ('Invalid owner', 'ruby', 'puts :invalid', -1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        SQL
        Snippet.connection.execute("SET CONSTRAINTS ALL IMMEDIATE")
      end
    end

    assert_not Snippet.exists?(user_id: -1)
  end

  test "is valid with required fields" do
    snippet = Snippet.new(
      user: users(:one),
      title: "Rails console",
      language: "bash",
      code: "bin/rails console"
    )

    assert snippet.valid?
  end

  test "requires title" do
    snippet = Snippet.new(user: users(:one), language: "bash", code: "echo test")

    assert_not snippet.valid?
    assert_includes snippet.errors[:title], "can't be blank"
  end

  test "requires language" do
    snippet = Snippet.new(user: users(:one), title: "Echo", code: "echo test")

    assert_not snippet.valid?
    assert_includes snippet.errors[:language], "can't be blank"
  end

  test "requires code" do
    snippet = Snippet.new(user: users(:one), title: "Echo", language: "bash")

    assert_not snippet.valid?
    assert_includes snippet.errors[:code], "can't be blank"
  end

  test "normalizes tags" do
    snippet = Snippet.new(
      user: users(:one),
      title: "Tag test",
      language: "ruby",
      code: "puts 'hello'",
      tags: "Rails, rails, API, "
    )

    snippet.valid?

    assert_equal "rails, api", snippet.tags
  end
end
