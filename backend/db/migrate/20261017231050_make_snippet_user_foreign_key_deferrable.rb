class MakeSnippetUserForeignKeyDeferrable < ActiveRecord::Migration[8.0]
  def up
    remove_foreign_key :snippets, :users
    add_foreign_key :snippets, :users, deferrable: :deferred
  end

  def down
    remove_foreign_key :snippets, :users
    add_foreign_key :snippets, :users
  end
end
