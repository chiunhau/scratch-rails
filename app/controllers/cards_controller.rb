class CardsController < ApplicationController

  require 'base64'
  require 'digest/md5'

  def index
    cards = Card.last(45)
    @card_hashed_ids = Array.new

    cards.each do |card|
      @card_hashed_ids.push(card.hashed_id)
    end
    @card_hashed_ids.reverse!
  end

  def refresh
    cards = Card.last(45)
    @latest_50 = Array.new

    cards.each do |card|
      @latest_50.push(card.hashed_id)
    end

    @latest_50.reverse!
    
    respond_to do |format|
      format.json { render json: @latest_50 }
    end
  end

  def create
  	@card = Card.new(card_params)
  	if @card.save
      @hashed = Digest::MD5.hexdigest(@card.id.to_s)
      @card.update({:hashed_id => @hashed})
  		render :json => @hashed
  	end

    data = card_params[:url]
    image_data = Base64.decode64(data['data:image/png;base64,'.length .. -1])

    File.open("#{Rails.root}/public/store/#{@card.hashed_id}.png", 'wb') do |f|
      f.write image_data
    end

    convert_to_grayscale(@card.hashed_id)
    convert_to_thumbnail(@card.hashed_id)
  end

  def convert_to_thumbnail(card_hashed_id)
    image = MiniMagick::Image.open("#{Rails.root}/public/store/#{card_hashed_id}.png")
    image.resize "200x200"
    image.write "#{Rails.root}/public/store/thumb/#{card_hashed_id}.png"
  end

  def convert_to_grayscale(card_hashed_id)
    image = MiniMagick::Image.open("#{Rails.root}/public/store/#{card_hashed_id}.png")
    image.colorspace("Gray")
    image.brightness_contrast("40x45")
    logo = MiniMagick::Image.new("#{Rails.root}/public/inno.png")
    result = image.composite(logo) do |c|
      c.compose "Over"
      c.geometry "+20+20"
    end
    result.write "#{Rails.root}/public/store/grayscale/#{card_hashed_id}.png"
  end

  def show
     @card = Card.find_by hashed_id: params[:id]
  end

  private
    def card_params
      params.require(:card).permit(:url)
    end
end
