Rails.application.routes.draw do
  devise_for :users,
             skip: :all,
             failure_app: "Api::V1::Auth::FailureApp"

  devise_scope :user do
    post "/api/v1/auth/register",
         to: "api/v1/auth/registrations#create",
         defaults: { format: :json },
         as: :api_v1_auth_register
    post "/api/v1/auth/login",
         to: "api/v1/auth/sessions#create",
         defaults: { format: :json },
         as: :api_v1_auth_login
    delete "/api/v1/auth/logout",
           to: "api/v1/auth/sessions#destroy",
           defaults: { format: :json },
           as: :api_v1_auth_logout
    get "/api/v1/auth/me",
        to: "api/v1/auth/users#show",
        defaults: { format: :json },
        as: :api_v1_auth_me
  end

  namespace :api do
    namespace :v1 do
      resources :snippets, only: %i[index show create update destroy]
    end
  end
end
