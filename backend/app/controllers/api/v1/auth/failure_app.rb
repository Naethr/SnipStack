module Api
  module V1
    module Auth
      class FailureApp < Devise::FailureApp
        def respond
          self.status = :unauthorized
          self.content_type = "application/json"
          self.response_body = { errors: [ "Unauthorized" ] }.to_json
        end
      end
    end
  end
end
