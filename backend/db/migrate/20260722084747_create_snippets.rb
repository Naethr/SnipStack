class CreateSnippets < ActiveRecord::Migration[8.0]
  def change
  create_table :snippets do |t|
  t.string :title, null: false
  t.text :description
  t.string :language, null: false
  t.text :code, null: false
  t.text :tags

  t.timestamps
    end

  add_index :snippets, :language
  add_index :snippets, :created_at
  end
end
