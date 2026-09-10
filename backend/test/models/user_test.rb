require "test_helper"

class UserTest < ActiveSupport::TestCase
  test "fixtures satisfy Devise and JTI constraints" do
    assert_predicate users(:one), :valid?
    assert_predicate users(:two), :valid?
    assert_not_equal users(:one).jti, users(:two).jti
  end

  test "JTIMatcher initializes jti when a user is created" do
    user = User.create!(email: "created@example.com", password: "password")

    assert_predicate user.jti, :present?
    assert_equal user.jti, user.jwt_payload["jti"]
  end
end
