class CreateCards < ActiveRecord::Migration
  def change
    create_table :cards do |t|
      t.text :url

      t.timestamps null: false
    end
  end
end
