Rails.application.routes.draw do
  devise_for :users
  namespace :api do
    namespace :v1 do
      resources :snippets, only: %i[index show create update destroy]
    end
  end
end
