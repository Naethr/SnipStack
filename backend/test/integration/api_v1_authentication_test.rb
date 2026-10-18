require "test_helper"

class ApiV1AuthenticationTest < ActionDispatch::IntegrationTest
  AUTH_PATH = "/api/v1/auth"

  test "registers a user and returns a bearer token" do
    assert_difference("User.count", 1) do
      post "#{AUTH_PATH}/register", params: registration_params, as: :json
    end

    assert_response :created
    assert_bearer_token
    assert_user_response(email: "new-user@example.com")
  end

  test "rejects invalid and already used registration data" do
    assert_no_difference("User.count") do
      post "#{AUTH_PATH}/register",
           params: { user: { email: "", password: "short" } },
           as: :json
    end

    assert_response :unprocessable_entity
    assert_error_response

    assert_no_difference("User.count") do
      post "#{AUTH_PATH}/register",
           params: {
             user: {
               email: users(:one).email,
               password: "password",
               password_confirmation: "password"
             }
           },
           as: :json
    end

    assert_response :unprocessable_entity
    assert_error_response
  end

  test "logs in a user and returns a bearer token" do
    post "#{AUTH_PATH}/login",
         params: { user: { email: users(:one).email, password: "password" } },
         as: :json

    assert_response :ok
    assert_bearer_token
    assert_user_response(email: users(:one).email)
  end

  test "rejects invalid login credentials" do
    post "#{AUTH_PATH}/login",
         params: { user: { email: users(:one).email, password: "invalid" } },
         as: :json

    assert_response :unauthorized
    assert_equal({ "errors" => [ "Invalid email or password" ] }, response.parsed_body)
  end

  test "returns the authenticated user" do
    get "#{AUTH_PATH}/me", headers: authorization_headers(login_token)

    assert_response :ok
    assert_user_response(email: users(:one).email)
  end

  test "rejects me without a token" do
    get "#{AUTH_PATH}/me"

    assert_unauthorized_response
  end

  test "rejects me with an invalid token" do
    get "#{AUTH_PATH}/me", headers: authorization_headers("Bearer invalid")

    assert_unauthorized_response
  end

  test "logs out and revokes the bearer token" do
    token = login_token

    delete "#{AUTH_PATH}/logout", headers: authorization_headers(token), as: :json

    assert_response :no_content
    assert_empty response.body

    get "#{AUTH_PATH}/me", headers: authorization_headers(token)

    assert_unauthorized_response
  end

  test "rejects logout without a token" do
    delete "#{AUTH_PATH}/logout", as: :json

    assert_unauthorized_response
  end

  test "exposes the authorization response header through CORS" do
    origin = "http://127.0.0.1:5173"

    options "#{AUTH_PATH}/register", headers: {
      "Origin" => origin,
      "Access-Control-Request-Method" => "POST",
      "Access-Control-Request-Headers" => "content-type"
    }

    assert_response :success
    assert_equal origin, response.headers["Access-Control-Allow-Origin"]
    assert_includes response.headers["Access-Control-Expose-Headers"], "Authorization"

    post "#{AUTH_PATH}/register",
         params: registration_params(email: "cors-user@example.com"),
         headers: { "Origin" => origin },
         as: :json

    assert_response :created
    assert_bearer_token
    assert_includes response.headers["Access-Control-Expose-Headers"], "Authorization"
  end

  test "rejects invalid login credentials even with a valid bearer token" do
    token = login_token

    post "#{AUTH_PATH}/login",
        params: { user: { email: users(:two).email, password: "invalid" } },
        headers: authorization_headers(token),
        as: :json

    assert_response :unauthorized
    assert_equal({ "errors" => [ "Invalid email or password" ] }, response.parsed_body)
    assert_not response.headers.key?("Authorization")
  end

  private

  def registration_params(email: "new-user@example.com")
    {
      user: {
        email: email,
        password: "password",
        password_confirmation: "password"
      }
    }
  end

  def login_token
    post "#{AUTH_PATH}/login",
         params: { user: { email: users(:one).email, password: "password" } },
         as: :json

    assert_response :ok
    assert_bearer_token
  end

  def assert_bearer_token
    authorization = response.headers["Authorization"]

    assert_match(/\ABearer \S+\z/, authorization)
    authorization
  end

  def authorization_headers(token)
    { "Authorization" => token }
  end

  def assert_user_response(email:)
    assert_equal [ "user" ], response.parsed_body.keys
    assert_equal [ "email", "id" ], response.parsed_body.fetch("user").keys.sort
    assert_equal email, response.parsed_body.dig("user", "email")
    assert_kind_of Integer, response.parsed_body.dig("user", "id")
    assert_no_match(/password|encrypted_password|jti|token/i, response.body)
  end

  def assert_error_response
    assert_equal [ "errors" ], response.parsed_body.keys
    assert_kind_of Array, response.parsed_body.fetch("errors")
    assert_not_empty response.parsed_body.fetch("errors")
  end

  def assert_unauthorized_response
    assert_response :unauthorized
    assert_equal({ "errors" => [ "Unauthorized" ] }, response.parsed_body)
  end
end
