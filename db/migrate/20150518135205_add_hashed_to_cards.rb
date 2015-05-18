class AddHashedToCards < ActiveRecord::Migration
  def change
    add_column :cards, :hash, :string
  end
end
