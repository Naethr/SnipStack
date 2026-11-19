require "test_helper"

class ApiV1SnippetsTest < ActionDispatch::IntegrationTest
  test "lists snippets" do
    get "/api/v1/snippets", headers: auth_headers(users(:one))

    assert_response :success

    body = response.parsed_body

    assert_kind_of Array, body
    assert_equal [ snippets(:rails_routes).id ], body.map { |snippet| snippet["id"] }

    get "/api/v1/snippets", headers: auth_headers(users(:two))
    assert_response :success
    assert_equal [ snippets(:react_fetch).id ], response.parsed_body.map { |snippet| snippet["id"] }
  end

  test "shows a snippet" do
    snippet = snippets(:rails_routes)

    get "/api/v1/snippets/#{snippet.id}", headers: auth_headers(users(:one))

    assert_response :success
    assert_equal snippet.title, response.parsed_body["title"]
  end

  test "creates a snippet" do
    headers = auth_headers(users(:one))

    assert_difference("Snippet.count", 1) do
      post "/api/v1/snippets",
          params: {
            snippet: {
              title: "PostgreSQL version",
              description: "Check PostgreSQL version.",
              language: "sql",
              code: "SELECT version();",
              tags: "postgresql, sql",
              user_id: users(:two).id
            }
          },
          as: :json,
          headers: headers
    end

    assert_response :created
    assert_equal "PostgreSQL version", response.parsed_body["title"]
    assert_equal users(:one).id, Snippet.find(response.parsed_body["id"]).user_id
  end

  test "returns validation errors when creating invalid snippet" do
    assert_no_difference("Snippet.count") do
      post "/api/v1/snippets",
          params: { snippet: { title: "", language: "", code: "" } },
          as: :json,
          headers: auth_headers(users(:one))
    end

    assert_response :unprocessable_entity
    assert response.parsed_body["errors"].any?
  end

  test "updates a snippet" do
    snippet = snippets(:rails_routes)

    patch "/api/v1/snippets/#{snippet.id}",
          params: {
            snippet: {
              title: "Updated Rails routes",
              user_id: users(:two).id
            }
          },
          as: :json,
          headers: auth_headers(users(:one))

    assert_response :success
    assert_equal "Updated Rails routes", response.parsed_body["title"]
    assert_equal users(:one).id, snippet.reload.user_id
  end

  test "deletes a snippet" do
    snippet = snippets(:rails_routes)

    assert_difference("Snippet.count", -1) do
      delete "/api/v1/snippets/#{snippet.id}", headers: auth_headers(users(:one))
    end

    assert_response :no_content
  end

  test "returns not found for missing snippet" do
    get "/api/v1/snippets/999999", headers: auth_headers(users(:one))

    assert_response :not_found
    assert_equal [ "Resource not found" ], response.parsed_body["errors"]
  end

  test "rejects all snippet actions without a token" do
    snippet = snippets(:rails_routes)

    get "/api/v1/snippets"
    assert_response :unauthorized

    get "/api/v1/snippets/#{snippet.id}"
    assert_response :unauthorized

    assert_no_difference("Snippet.count") do
      post "/api/v1/snippets",
           params: { snippet: { title: "Public", language: "ruby", code: "puts :public" } },
           as: :json
    end
    assert_response :unauthorized

    patch "/api/v1/snippets/#{snippet.id}",
          params: { snippet: { title: "Public update" } },
          as: :json
    assert_response :unauthorized
    assert_equal "Rails routes", snippet.reload.title

    assert_no_difference("Snippet.count") do
      delete "/api/v1/snippets/#{snippet.id}"
    end
    assert_response :unauthorized
  end

  test "hides another user's snippet from show update and delete" do
    other_snippet = snippets(:react_fetch)
    headers = auth_headers(users(:one))

    get "/api/v1/snippets/#{other_snippet.id}", headers: headers
    assert_response :not_found

    patch "/api/v1/snippets/#{other_snippet.id}",
          params: { snippet: { title: "Changed" } },
          as: :json,
          headers: headers
    assert_response :not_found
    assert_equal "React fetch example", other_snippet.reload.title

    assert_no_difference("Snippet.count") do
      delete "/api/v1/snippets/#{other_snippet.id}", headers: headers
    end
    assert_response :not_found
    assert_equal [ "Resource not found" ], response.parsed_body["errors"]
  end

  private

  def auth_headers(user)
    post "/api/v1/auth/login",
         params: { user: { email: user.email, password: "password" } },
         as: :json

    assert_response :ok
    { "Authorization" => response.headers.fetch("Authorization") }
  end
end
