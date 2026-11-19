require "test_helper"

class SnippetsApiTest < ActionDispatch::IntegrationTest
  test "CRUD preserves the JSON contract" do
    headers = auth_headers(users(:one))

    get api_v1_snippets_url, headers: headers
    assert_response :success
    assert_kind_of Array, response.parsed_body

    assert_difference("Snippet.count", 1) do
      post api_v1_snippets_url, params: {
        snippet: {
          title: "Desktop smoke",
          description: "Created by the integration test",
          language: "Ruby",
          code: "puts :desktop",
          tags: "tauri, test"
        }
      }, as: :json, headers: headers
    end
    assert_response :created
    snippet_id = response.parsed_body.fetch("id")

    patch api_v1_snippet_url(snippet_id),
          params: { snippet: { title: "Desktop smoke updated" } },
          as: :json,
          headers: headers
    assert_response :success
    assert_equal "Desktop smoke updated", response.parsed_body.fetch("title")

    post api_v1_snippets_url,
         params: { snippet: { title: "", language: "", code: "" } },
         as: :json,
         headers: headers
    assert_response :unprocessable_entity
    assert_not_empty response.parsed_body.fetch("errors")

    assert_difference("Snippet.count", -1) do
      delete api_v1_snippet_url(snippet_id), as: :json, headers: headers
    end
    assert_response :no_content

    get api_v1_snippet_url(snippet_id), headers: headers
    assert_response :not_found
    assert_equal [ "Resource not found" ], response.parsed_body.fetch("errors")
  end

  test "CORS allows only configured browser origins" do
    authorization = auth_headers(users(:one))

    options api_v1_snippets_url, headers: cors_headers("tauri://localhost")
    assert_response :success
    assert_nil response.headers["Access-Control-Allow-Origin"]

    allowed_origin = "http://127.0.0.1:5173"
    allowed_headers = { "Origin" => allowed_origin, **authorization }

    options api_v1_snippets_url, headers: cors_headers(allowed_origin)
    assert_response :success
    assert_equal allowed_origin, response.headers["Access-Control-Allow-Origin"]
    assert_includes response.headers["Access-Control-Allow-Methods"], "POST"

    options api_v1_snippets_url,
            headers: cors_headers(allowed_origin).merge(
              "Access-Control-Request-Headers" => "authorization,content-type"
            )
    assert_response :success
    assert_includes response.headers["Access-Control-Allow-Headers"].downcase, "authorization"

    get api_v1_snippets_url, headers: allowed_headers
    assert_response :success
    assert_equal allowed_origin, response.headers["Access-Control-Allow-Origin"]
    assert_includes response.headers["Access-Control-Allow-Methods"], "POST"

    post api_v1_snippets_url,
         params: {
           snippet: {
             title: "CORS Desktop",
             language: "Ruby",
             code: "puts :cors"
           }
         },
         headers: allowed_headers,
         as: :json
    assert_response :created
    assert_equal allowed_origin, response.headers["Access-Control-Allow-Origin"]
    snippet_id = response.parsed_body.fetch("id")

    patch api_v1_snippet_url(snippet_id),
          params: { snippet: { title: "CORS Desktop updated" } },
          headers: allowed_headers,
          as: :json
    assert_response :success
    assert_equal allowed_origin, response.headers["Access-Control-Allow-Origin"]

    delete api_v1_snippet_url(snippet_id), headers: allowed_headers, as: :json
    assert_response :no_content
    assert_equal allowed_origin, response.headers["Access-Control-Allow-Origin"]

    options api_v1_snippets_url, headers: cors_headers("https://evil.example")
    assert_response :success
    assert_nil response.headers["Access-Control-Allow-Origin"]

    options api_v1_snippets_url, headers: cors_headers("http://localhost:5173")
    assert_response :success
    assert_nil response.headers["Access-Control-Allow-Origin"]
  end

  private

  def cors_headers(origin)
    {
      "Origin" => origin,
      "Access-Control-Request-Method" => "POST",
      "Access-Control-Request-Headers" => "content-type"
    }
  end

  def auth_headers(user)
    post "/api/v1/auth/login",
         params: { user: { email: user.email, password: "password" } },
         as: :json

    assert_response :ok
    { "Authorization" => response.headers.fetch("Authorization") }
  end
end
