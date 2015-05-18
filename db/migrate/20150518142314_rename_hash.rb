class RenameHash < ActiveRecord::Migration
  def change
    rename_column :cards, :hash, :hashed_id
  end
end
