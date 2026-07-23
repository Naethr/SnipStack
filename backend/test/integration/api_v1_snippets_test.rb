require "test_helper"

class ApiV1SnippetsTest < ActionDispatch::IntegrationTest
  test "lists snippets" do
    get "/api/v1/snippets"

    assert_response :success

    body = response.parsed_body

    assert_kind_of Array, body
    assert body.any? { |snippet| snippet["title"] == "Rails routes" }
  end

  test "shows a snippet" do
    snippet = snippets(:rails_routes)

    get "/api/v1/snippets/#{snippet.id}"

    assert_response :success
    assert_equal snippet.title, response.parsed_body["title"]
  end

  test "creates a snippet" do
    assert_difference("Snippet.count", 1) do
      post "/api/v1/snippets",
          params: {
            snippet: {
              title: "PostgreSQL version",
              description: "Check PostgreSQL version.",
              language: "sql",
              code: "SELECT version();",
              tags: "postgresql, sql"
            }
          },
          as: :json
    end

    assert_response :created
    assert_equal "PostgreSQL version", response.parsed_body["title"]
  end

  test "returns validation errors when creating invalid snippet" do
    assert_no_difference("Snippet.count") do
      post "/api/v1/snippets",
          params: { snippet: { title: "", language: "", code: "" } },
          as: :json
    end

    assert_response :unprocessable_entity
    assert response.parsed_body["errors"].any?
  end

  test "updates a snippet" do
    snippet = snippets(:rails_routes)

    patch "/api/v1/snippets/#{snippet.id}",
          params: {
            snippet: {
              title: "Updated Rails routes"
            }
          },
          as: :json

    assert_response :success
    assert_equal "Updated Rails routes", response.parsed_body["title"]
  end

  test "deletes a snippet" do
    snippet = snippets(:react_fetch)

    assert_difference("Snippet.count", -1) do
      delete "/api/v1/snippets/#{snippet.id}"
    end

    assert_response :no_content
  end

  test "returns not found for missing snippet" do
    get "/api/v1/snippets/999999"

    assert_response :not_found
    assert_equal ["Resource not found"], response.parsed_body["errors"]
  end
end