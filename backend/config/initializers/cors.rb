frontend_origins = ENV.fetch(
  "FRONTEND_ORIGIN",
  "http://localhost:5173,http://127.0.0.1:5173"
).split(",").map(&:strip)

Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    origins(*frontend_origins)

    resource "/api/*",
            headers: :any,
            methods: %i[get post patch delete options head],
            max_age: 600
  end
end