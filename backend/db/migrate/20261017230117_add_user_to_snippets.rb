class AddUserToSnippets < ActiveRecord::Migration[8.0]
  def change
    add_reference :snippets, :user, null: false, foreign_key: true
  end
end
