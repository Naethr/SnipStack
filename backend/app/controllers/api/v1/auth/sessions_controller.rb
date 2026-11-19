module Api
  module V1
    module Auth
      class SessionsController < Devise::SessionsController
        skip_before_action :verify_signed_out_user, only: :destroy
        before_action :authenticate_user_from_token!, only: :destroy

        respond_to :json

        def create
          self.resource = warden.authenticate(auth_options)

          unless resource
            render json: { errors: [ "Invalid email or password" ] }, status: :unauthorized
            return
          end

          sign_in(resource_name, resource, store: false)
          render json: { user: { id: resource.id, email: resource.email } }, status: :ok
        end

        def destroy
          sign_out(resource_name)
          head :no_content
        end

        private

        def authenticate_user_from_token!
          authenticate_user!(force: true)
        end
      end
    end
  end
end
